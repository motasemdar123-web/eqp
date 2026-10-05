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

// Helper for Hybrid (DS/SO + EO) Planning
function planHybridOrders({
  items,
  selectedMachines,
  startingOrderNo = 'R100/2026',
  customer = 'DAR AL HAI',
  normalOrderType = 'DS',
}) {
  if (!items || items.length === 0) return [];
  if (!selectedMachines || selectedMachines.length === 0) {
    selectedMachines = [{ customer, model: 'PC500LC-10R', serial: '100433' }];
  }

  const match = startingOrderNo.match(/R(\d+)\/(\d{4})/);
  let seq = match ? parseInt(match[1], 10) : 1;
  let year = match ? match[2] : '2026';

  const orders = [];
  let orderIdx = 0;

  // 1. Consolidated Normal Stock Order (DS or SO)
  const dsParts = [];
  let dsTotalAmount = 0;

  for (const it of items) {
    const dsQty = typeof it.ds_quantity === 'number'
      ? it.ds_quantity
      : Math.min(parseInt(it.quantity, 10) || 0, it.kme_stock || 0);

    if (dsQty > 0) {
      const uPrice = parseFloat(it.unit_price) || 0;
      const lineTotal = dsQty * uPrice;
      dsTotalAmount += lineTotal;

      dsParts.push({
        part_no: it.part_no.trim(),
        description: it.description || 'Komatsu Genuine Component',
        quantity: dsQty,
        unit: it.unit || 'EA',
        unit_price: uPrice > 0 ? uPrice.toFixed(3) : '0.000',
        total_price: lineTotal > 0 ? lineTotal.toFixed(3) : '0.000',
      });
    }
  }

  if (dsParts.length > 0) {
    orderIdx++;
    const currentDbOrderNo = `R${seq}/${year}`;
    seq++;

    orders.push({
      index: orderIdx,
      order_type: normalOrderType || 'DS',
      db_order_no: currentDbOrderNo,
      customer: '',
      model: 'Direct Stock (KME)',
      serial: 'N/A',
      parts: dsParts,
      total_items: dsParts.length,
      total_quantity: dsParts.reduce((sum, p) => sum + p.quantity, 0),
      total_amount: dsTotalAmount.toFixed(3),
      cycle_num: 1,
      quotation_no: '',
      status: 'READY',
    });
  }

  // 2. Emergency Orders (EO)
  const eoTracking = items
    .map((it) => {
      const eoQty = typeof it.eo_quantity === 'number'
        ? it.eo_quantity
        : Math.max(0, (parseInt(it.quantity, 10) || 0) - (it.ds_quantity ?? (it.kme_stock || 0)));
      return {
        part_no: it.part_no.trim(),
        description: it.description || 'Komatsu Genuine Component',
        unit: it.unit || 'EA',
        unit_price: parseFloat(it.unit_price) || 0,
        remaining: Math.max(0, eoQty),
        max_per_order: parseInt(it.max_per_order, 10) || eoQty || 1,
      };
    })
    .filter((t) => t.remaining > 0);

  let eoCycleCounter = 0;
  while (eoTracking.some((t) => t.remaining > 0)) {
    orderIdx++;
    eoCycleCounter++;
    const currentDbOrderNo = `R${seq}/${year}`;
    seq++;

    const machineIdx = (eoCycleCounter - 1) % selectedMachines.length;
    const cycleNum = Math.floor((eoCycleCounter - 1) / selectedMachines.length) + 1;
    const machine = selectedMachines[machineIdx];

    const orderParts = [];
    let orderTotalAmount = 0;

    for (const t of eoTracking) {
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
      order_type: 'EO',
      db_order_no: currentDbOrderNo,
      customer: machine.customer || customer,
      model: machine.model,
      serial: machine.serial,
      parts: orderParts,
      total_items: orderParts.length,
      total_quantity: orderParts.reduce((sum, p) => sum + p.quantity, 0),
      total_amount: orderTotalAmount.toFixed(3),
      cycle_num: cycleNum,
      quotation_no: '',
      status: 'READY',
    });
  }

  return orders;
}

describe('Hybrid Normal Stock (DS/SO) and Emergency (EO) Planning Engine', () => {
  it('correctly splits requested 50 units into DS (10 available in stock) and EO (40 backorder)', () => {
    const items = [
      {
        part_no: '600-311-6742',
        description: 'FUEL FILTER',
        quantity: 50,
        kme_stock: 10,
        kme_eor: 40,
        kltd_total: 0,
        ds_quantity: 10,
        eo_quantity: 40,
        max_per_order: 20, // Max 20 per EO machine order
        unit_price: '25.000',
        unit: 'EA',
      },
    ];

    const machines = [
      { customer: 'SAMA CONTRACTING', model: 'PC400-8R', serial: 'B20401' },
      { customer: 'SAMA CONTRACTING', model: 'PC400-8R', serial: 'B20402' },
    ];

    const orders = planHybridOrders({
      items,
      selectedMachines: machines,
      startingOrderNo: 'R229/2026',
      normalOrderType: 'DS',
    });

    // Expect 3 orders in total:
    // 1 DS order for 10 units (no machine details)
    // 2 EO orders for 40 units (20 units on machine 1, 20 units on machine 2)
    expect(orders.length).toBe(3);

    // Sub-order 1: DS (Stock)
    expect(orders[0].index).toBe(1);
    expect(orders[0].order_type).toBe('DS');
    expect(orders[0].db_order_no).toBe('R229/2026');
    expect(orders[0].customer).toBe('');
    expect(orders[0].model).toBe('Direct Stock (KME)');
    expect(orders[0].serial).toBe('N/A');
    expect(orders[0].parts[0].quantity).toBe(10);
    expect(orders[0].total_quantity).toBe(10);
    expect(orders[0].total_amount).toBe('250.000');

    // Sub-order 2: EO #1 (Emergency on Machine B20401)
    expect(orders[1].index).toBe(2);
    expect(orders[1].order_type).toBe('EO');
    expect(orders[1].db_order_no).toBe('R230/2026');
    expect(orders[1].serial).toBe('B20401');
    expect(orders[1].model).toBe('PC400-8R');
    expect(orders[1].parts[0].quantity).toBe(20);

    // Sub-order 3: EO #2 (Emergency on Machine B20402)
    expect(orders[2].index).toBe(3);
    expect(orders[2].order_type).toBe('EO');
    expect(orders[2].db_order_no).toBe('R231/2026');
    expect(orders[2].serial).toBe('B20402');
    expect(orders[2].model).toBe('PC400-8R');
    expect(orders[2].parts[0].quantity).toBe(20);

    // Total quantity must equal exactly 50
    const totalDispatched = orders.reduce((sum, o) => sum + o.total_quantity, 0);
    expect(totalDispatched).toBe(50);
  });

  it('supports toggling normal order type to SO', () => {
    const items = [
      {
        part_no: '600-311-6742',
        description: 'FILTER',
        quantity: 15,
        kme_stock: 15,
        ds_quantity: 15,
        eo_quantity: 0,
        unit_price: '30.000',
      },
    ];

    const orders = planHybridOrders({
      items,
      startingOrderNo: 'R500/2026',
      normalOrderType: 'SO',
    });

    expect(orders.length).toBe(1);
    expect(orders[0].order_type).toBe('SO');
    expect(orders[0].db_order_no).toBe('R500/2026');
    expect(orders[0].serial).toBe('N/A');
    expect(orders[0].parts[0].quantity).toBe(15);
  });

  it('creates only EO orders when KME stock is 0', () => {
    const items = [
      {
        part_no: 'ND446010-5360',
        description: 'MOTOR',
        quantity: 3,
        kme_stock: 0,
        kme_eor: 3,
        ds_quantity: 0,
        eo_quantity: 3,
        max_per_order: 1,
        unit_price: '370.350',
      },
    ];

    const machines = [
      { customer: 'DAR AL HAI', model: 'PC400', serial: 'SN-01' },
      { customer: 'DAR AL HAI', model: 'PC400', serial: 'SN-02' },
      { customer: 'DAR AL HAI', model: 'PC400', serial: 'SN-03' },
    ];

    const orders = planHybridOrders({
      items,
      selectedMachines: machines,
      startingOrderNo: 'R300/2026',
    });

    expect(orders.length).toBe(3);
    expect(orders.every((o) => o.order_type === 'EO')).toBe(true);
    expect(orders[0].db_order_no).toBe('R300/2026');
    expect(orders[1].db_order_no).toBe('R301/2026');
    expect(orders[2].db_order_no).toBe('R302/2026');
  });
});
