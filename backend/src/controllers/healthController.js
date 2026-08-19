const reportGeneratorService = require('../services/reportGeneratorService');
const database = require('../config/database');

function health(req, res) {
  res.json({
    message: 'EQP Backend Running',
    auth: 'microsoft',
    database: database.isConnected() ? 'connected' : 'disconnected',
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
