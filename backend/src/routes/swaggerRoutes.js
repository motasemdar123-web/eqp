const { Router } = require('express');
const path = require('path');
const fs = require('fs');

const router = Router();
const OPENAPI_PATH = path.join(__dirname, '../docs/openapi.json');

/**
 * Serve raw OpenAPI 3.0 JSON specification
 */
router.get('/openapi.json', (req, res) => {
  if (!fs.existsSync(OPENAPI_PATH)) {
    return res.status(404).json({ error: 'OpenAPI specification not found' });
  }
  res.setHeader('Content-Type', 'application/json');
  return res.sendFile(OPENAPI_PATH);
});

/**
 * Serve Interactive Swagger UI Console with Dar Al Hai styling
 */
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dar Al Hai EQP - SAP B1 M2M Integration API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://daralhai.com/favicon.ico" />
  <style>
    body {
      margin: 0;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .top-header {
      background: #1e293b;
      color: #f8fafc;
      padding: 16px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0284c7;
    }
    .top-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .top-header .tag {
      background: #0284c7;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .top-header .links a {
      color: #38bdf8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      margin-left: 16px;
    }
    .top-header .links a:hover {
      text-decoration: underline;
    }
    #swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      margin-top: 20px;
      margin-bottom: 40px;
    }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div class="top-header">
    <h1>
      <span>Dar Al Hai EQP &mdash; SAP B1 API</span>
      <span class="tag">M2M Integration</span>
    </h1>
    <div class="links">
      <a href="/api/docs/sap-integration/openapi.json" target="_blank">&#128196; Raw OpenAPI JSON</a>
      <a href="/api/v1/integration/sap/health" target="_blank">&#9989; Test Health</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/docs/sap-integration/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

module.exports = router;
