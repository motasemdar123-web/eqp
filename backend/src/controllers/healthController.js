const reportGeneratorService = require('../services/reportGeneratorService');

function health(req, res) {
  res.json({
    message: 'EQP Backend Running',
    auth: 'microsoft',
  });
}

async function pdfConverter(req, res) {
  const converter = await reportGeneratorService.getPdfConverterStatus();
  res.json({
    success: true,
    converter,
  });
}

module.exports = { health, pdfConverter };
