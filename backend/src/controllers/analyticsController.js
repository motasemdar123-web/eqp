const analyticsRepository = require('../repositories/analyticsRepository');

async function overview(req, res) {
  const data = await analyticsRepository.getOverview();

  res.json({
    success: true,
    data,
  });
}

async function greasing(req, res) {
  const data = await analyticsRepository.getGreasingAnalytics();
  res.json({ success: true, data });
}

async function componentRotations(req, res) {
  const data = await analyticsRepository.getFanPumpRotations();
  res.json({ success: true, data });
}

async function wearLifespan(req, res) {
  const data = await analyticsRepository.getWearLifespanAnalytics();
  res.json({ success: true, data });
}

async function ripperTeeth(req, res) {
  const data = await analyticsRepository.getRipperAnalytics();
  res.json({ success: true, data });
}

async function cylinders(req, res) {
  const data = await analyticsRepository.getCylinderAnalytics();
  res.json({ success: true, data });
}

async function fleetSummary(req, res) {
  const [greasingData, fanPumpsData, wearData, ripperData, cylinderData] = await Promise.all([
    analyticsRepository.getGreasingAnalytics(),
    analyticsRepository.getFanPumpRotations(),
    analyticsRepository.getWearLifespanAnalytics(),
    analyticsRepository.getRipperAnalytics(),
    analyticsRepository.getCylinderAnalytics(),
  ]);

  res.json({
    success: true,
    data: {
      greasing: greasingData,
      fanPumps: fanPumpsData,
      wear: wearData,
      ripper: ripperData,
      cylinders: cylinderData,
    },
  });
}

async function workshop(req, res) {
  const data = await analyticsRepository.getWorkshopAnalytics();
  res.json({ success: true, data });
}

async function governance(req, res) {
  const data = await analyticsRepository.getGovernanceAnalytics();
  res.json({ success: true, data });
}

module.exports = {
  overview,
  greasing,
  componentRotations,
  wearLifespan,
  ripperTeeth,
  cylinders,
  fleetSummary,
  workshop,
  governance,
};


