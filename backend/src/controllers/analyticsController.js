const analyticsRepository = require('../repositories/analyticsRepository');

async function overview(req, res) {
  const data = await analyticsRepository.getOverview();

  res.json({
    success: true,
    data,
  });
}

module.exports = { overview };
