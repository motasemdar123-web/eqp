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

// ============================================
// TEST SUITE
// ============================================
console.log('Testing Multi-Item & Multi-SN EO Planning Engine...');

// Test 1: Bundling 2 items together when quantities fit in 1 sub-order
{
  const items = [
    { part_no: '2A8-62-12230', description: 'HOSE', quantity: 12, max_per_order: 12, unit_price: '51.200', unit: 'EA' },
    { part_no: '2A8-62-11751', description: 'HOSE', quantity: 10, max_per_order: 10, unit_price: '54.100', unit: 'EA' },
  ];
  const machines = [
    { customer: 'DAR AL HAI', model: 'PC500LC-10R', serial: '100433' },
  ];

  const orders = planMultiItemEoOrders({ items, selectedMachines: machines, startingOrderNo: 'R153/2026' });

  assert.strictEqual(orders.length, 1, 'Should create exactly 1 sub-order when all parts fit in batch limit');
  assert.strictEqual(orders[0].parts.length, 2, 'Sub-order #1 must contain both part numbers together');
  assert.strictEqual(orders[0].parts[0].part_no, '2A8-62-12230');
  assert.strictEqual(orders[0].parts[0].quantity, 12);
  assert.strictEqual(orders[0].parts[0].total_price, '614.400');
  assert.strictEqual(orders[0].parts[1].part_no, '2A8-62-11751');
  assert.strictEqual(orders[0].parts[1].quantity, 10);
  assert.strictEqual(orders[0].parts[1].total_price, '541.000');
  assert.strictEqual(orders[0].total_amount, '1155.400');
  console.log('✓ Test 1 Passed: Both items requested together in single sub-order.');
}

// Test 2: Multi-Item with different quantities splitting across Multi-SNs
// Part A (qty 12, max 6) -> 2 batches
// Part B (qty 5, max 5) -> 1 batch
// Part C (qty 18, max 6) -> 3 batches
{
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

  assert.strictEqual(orders.length, 3, 'Should create 3 sub-orders to fulfill all quantities');
  
  // Order #1: SN 100433, has all 3 parts together
  assert.strictEqual(orders[0].db_order_no, 'R100/2026');
  assert.strictEqual(orders[0].serial, '100433');
  assert.strictEqual(orders[0].parts.length, 3, 'Order #1 has Part A, Part B, Part C together');
  assert.strictEqual(orders[0].parts[0].quantity, 6);
  assert.strictEqual(orders[0].parts[1].quantity, 5);
  assert.strictEqual(orders[0].parts[2].quantity, 6);

  // Order #2: SN 100434, has Part A (6) and Part C (6), Part B is done
  assert.strictEqual(orders[1].db_order_no, 'R101/2026');
  assert.strictEqual(orders[1].serial, '100434');
  assert.strictEqual(orders[1].parts.length, 2, 'Order #2 has Part A and Part C');
  assert.strictEqual(orders[1].parts[0].quantity, 6);
  assert.strictEqual(orders[1].parts[1].quantity, 6);

  // Order #3: SN 100435, has only Part C remainder (6)
  assert.strictEqual(orders[2].db_order_no, 'R102/2026');
  assert.strictEqual(orders[2].serial, '100435');
  assert.strictEqual(orders[2].parts.length, 1, 'Order #3 has only remaining Part C in a separate inquiry');
  assert.strictEqual(orders[2].parts[0].part_no, '6745-12-3100');
  assert.strictEqual(orders[2].parts[0].quantity, 6);

  console.log('✓ Test 2 Passed: Multi-item packing together and separate remainder orders across Multi-SNs.');
}

console.log('\nAll Multi-Item & Multi-SN tests passed successfully!');
