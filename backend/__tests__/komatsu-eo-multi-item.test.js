const assert = require('assert');

// Helper: Smart packing algorithm for multi-item & multi-SN
function planMultiItemEoOrders({
  items,
  selectedMachines,
  startingOrderNo = 'R153/2026',
  customer = 'DAR AL HAI',
  comments = 'Urgent Breakdown',
}) {
  if (!items || items.length === 0) return [];
  if (!selectedMachines || selectedMachines.length === 0) {
    selectedMachines = [{ customer, model: 'PC500LC-10R', serial: '100433' }];
  }

  // Parse order starting reference
  const match = startingOrderNo.match(/R(\d+)\/(\d{4})/);
  let seq = match ? parseInt(match[1], 10) : 1;
  let year = match ? match[2] : '2026';

  // Track remaining quantities
  const tracking = items.map((item) => ({
    part_no: item.part_no.trim(),
    description: item.description || 'Komatsu Genuine Component',
    unit: item.unit || 'EA',
    unit_price: parseFloat(item.unit_price) || 0,
    remaining: parseInt(item.quantity, 10) || 0,
    max_per_order: parseInt(item.max_per_order, 10) || parseInt(item.quantity, 10) || 1,
  }));

  const orders = [];
  let orderIdx = 0;

  while (tracking.some((t) => t.remaining > 0)) {
    orderIdx++;
    const currentDbOrderNo = `R${seq}/${year}`;
    seq++;

    const machineIdx = (orderIdx - 1) % selectedMachines.length;
    const cycleNum = Math.floor((orderIdx - 1) / selectedMachines.length) + 1;
    const machine = selectedMachines[machineIdx];

    const orderParts = [];
    let orderTotalAmount = 0;

    for (const t of tracking) {
      if (t.remaining > 0) {
        const batchQty = Math.min(t.remaining, t.max_per_order);
        t.remaining -= batchQty;
        const lineTotal = batchQty * t.unit_price;
        orderTotalAmount += lineTotal;

        orderParts.push({
          part_no: t.part_no,
          description: t.description,
          quantity: batchQty,
          unit: t.unit,
          unit_price: t.unit_price.toFixed(3),
          total_price: lineTotal.toFixed(3),
        });
      }
    }

    orders.push({
      index: orderIdx,
      db_order_no: currentDbOrderNo,
      customer: machine.customer || customer,
      model: machine.model,
      serial: machine.serial,
      parts: orderParts,
      total_items: orderParts.length,
      total_quantity: orderParts.reduce((s, p) => s + p.quantity, 0),
      total_amount: orderTotalAmount.toFixed(3),
      cycle_num: cycleNum,
      quotation_no: '',
      status: 'READY',
    });
  }

  return orders;
}

describe('Multi-Item & Multi-SN EO Planning Engine', () => {
  it('bundles 2 items together when quantities fit in 1 sub-order', () => {
    const items = [
      { part_no: '2A8-62-12230', description: 'HOSE', quantity: 12, max_per_order: 12, unit_price: '51.200', unit: 'EA' },
      { part_no: '2A8-62-11751', description: 'HOSE', quantity: 10, max_per_order: 10, unit_price: '54.100', unit: 'EA' },
    ];
    const machines = [
      { customer: 'DAR AL HAI', model: 'PC500LC-10R', serial: '100433' },
    ];

    const orders = planMultiItemEoOrders({ items, selectedMachines: machines, startingOrderNo: 'R153/2026' });

    expect(orders.length).toBe(1);
    expect(orders[0].parts.length).toBe(2);
    expect(orders[0].parts[0].part_no).toBe('2A8-62-12230');
    expect(orders[0].parts[0].quantity).toBe(12);
    expect(orders[0].parts[0].total_price).toBe('614.400');
    expect(orders[0].parts[1].part_no).toBe('2A8-62-11751');
    expect(orders[0].parts[1].quantity).toBe(10);
    expect(orders[0].parts[1].total_price).toBe('541.000');
    expect(orders[0].total_amount).toBe('1155.400');
  });

  it('splits multi-items with different quantities across multi-SNs', () => {
    const items = [
      { part_no: '2A8-62-12230', description: 'HOSE', quantity: 12, max_per_order: 6, unit_price: '50.000', unit: 'EA' },
      { part_no: '2A8-62-11751', description: 'HOSE', quantity: 5, max_per_order: 5, unit_price: '50.000', unit: 'EA' },
      { part_no: '6745-12-3100', description: 'VALVE', quantity: 18, max_per_order: 6, unit_price: '100.000', unit: 'EA' },
    ];
    const machines = [
      { customer: 'DAR AL HAI', model: 'PC500LC-10R', serial: '100433' },
      { customer: 'DAR AL HAI', model: 'PC500LC-10R', serial: '100434' },
      { customer: 'DAR AL HAI', model: 'PC500LC-10R', serial: '100435' },
    ];

    const orders = planMultiItemEoOrders({ items, selectedMachines: machines, startingOrderNo: 'R100/2026' });

    expect(orders.length).toBe(3);

    // Order #1: SN 100433, has all 3 parts together
    expect(orders[0].db_order_no).toBe('R100/2026');
    expect(orders[0].serial).toBe('100433');
    expect(orders[0].parts.length).toBe(3);
    expect(orders[0].parts[0].quantity).toBe(6);
    expect(orders[0].parts[1].quantity).toBe(5);
    expect(orders[0].parts[2].quantity).toBe(6);

    // Order #2: SN 100434, has Part A (6) and Part C (6), Part B is done
    expect(orders[1].db_order_no).toBe('R101/2026');
    expect(orders[1].serial).toBe('100434');
    expect(orders[1].parts.length).toBe(2);
    expect(orders[1].parts[0].quantity).toBe(6);
    expect(orders[1].parts[1].quantity).toBe(6);

    // Order #3: SN 100435, has only Part C remainder (6)
    expect(orders[2].db_order_no).toBe('R102/2026');
    expect(orders[2].serial).toBe('100435');
    expect(orders[2].parts.length).toBe(1);
    expect(orders[2].parts[0].part_no).toBe('6745-12-3100');
    expect(orders[2].parts[0].quantity).toBe(6);
  });
});
