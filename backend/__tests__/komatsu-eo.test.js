const komatsuEoService = require('../src/services/komatsuEoService');

describe('Komatsu Emergency Order Service', () => {
  test('loads customer fleet data from bundled excel', async () => {
    const fleet = await komatsuEoService.loadFleetData();
    expect(fleet).toBeDefined();
    expect(Array.isArray(fleet.machines)).toBe(true);
    expect(fleet.machines.length).toBeGreaterThanOrEqual(281);
    expect(fleet.customers.length).toBeGreaterThan(0);
    expect(fleet.models.length).toBeGreaterThan(0);
  });

  test('adds custom machine to fleet', async () => {
    const fleet = await komatsuEoService.addCustomMachine({
      customer: 'TEST_CUSTOM_CUSTOMER',
      machine_type: 'Excavator',
      model: 'PC999-TEST',
      serials: '99901, 99902'
    });
    expect(fleet.customers).toContain('TEST_CUSTOM_CUSTOMER');
    expect(fleet.models).toContain('PC999-TEST');
  });
});
