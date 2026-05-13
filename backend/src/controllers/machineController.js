const machineRepository = require('../repositories/machineRepository');
const historyRepository = require('../repositories/historyRepository');

async function listMachines(req, res) {
  const machines = await machineRepository.findAll();

  res.json({
    success: true,
    machines,
  });
}

async function listMachineHistory(req, res) {
  const history = await historyRepository.findAll();

  res.json({
    success: true,
    history,
  });
}

module.exports = {
  listMachines,
  listMachineHistory,
};
