const reportGeneratorService = require('../services/reportGeneratorService');
const database = require('../config/database');

function health(req, res) {
  res.json({
    message: 'EQP Backend Running',
    auth: 'microsoft',
    database: database.isConnected() ? 'connected' : 'disconnected',
  });
}

async function sapConnectivity(req, res) {
  const urls = [
    'https://daralhai.b1pro.com/',
    'https://daralhai.b1pro.com/software/html5.html',
  ];
  const results = {};
  for (const target of urls) {
    const t0 = Date.now();
    try {
      const resp = await fetch(target, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      });
      results[target] = { ok: true, status: resp.status, elapsedMs: Date.now() - t0 };
    } catch (err) {
      results[target] = { ok: false, error: err.message, elapsedMs: Date.now() - t0 };
    }
  }
  res.json({ results, timestamp: new Date().toISOString() });
}

module.exports = { health, pdfConverter, sapConnectivity };
