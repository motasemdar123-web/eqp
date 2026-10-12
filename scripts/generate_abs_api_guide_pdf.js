const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, '..', 'docs', 'ABS_SAP_B1_API_Integration_Guide.pdf');
const tempHtmlPath = path.resolve(__dirname, '..', 'docs', 'ABS_SAP_B1_API_Integration_Guide.html');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dar Al Hai EQP - SAP Business One M2M Developer Guide</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 8.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      page-break-after: always;
      break-after: page;
      padding: 0;
      margin: 0;
    }
    .page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
    .header-banner {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-text {
      font-size: 16pt;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .meta-box {
      text-align: right;
      font-size: 7.5pt;
      color: #475569;
    }
    .title-banner {
      background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
      color: white;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .title-banner h1 {
      font-size: 14pt;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .title-banner p {
      font-size: 8.5pt;
      opacity: 0.92;
    }
    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin: 12px 0 8px 0;
    }
    h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin: 8px 0 4px 0;
    }
    p, li {
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 6px;
    }
    ul, ol {
      padding-left: 18px;
      margin-bottom: 8px;
    }
    .callout {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-left: 4px solid #0284c7;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 8.2pt;
      color: #0369a1;
    }
    .callout-warning {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 8pt;
    }
    th {
      background-color: #0f172a;
      color: white;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-get { background: #e0f2fe; color: #0369a1; }
    .badge-post { background: #dcfce7; color: #15803d; }
    .badge-patch { background: #fef3c7; color: #b45309; }
    .badge-del { background: #fee2e2; color: #b91c1c; }
    pre, code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 7.6pt;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 8px 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 6px 0 10px 0;
      line-height: 1.35;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 8px 0;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #fafafa;
    }
    .card h4 {
      font-size: 8.8pt;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .footer-note {
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: Executive Overview & Security -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="logo-text">DAR AL HAI &bull; EQP SYSTEM</div>
        <div class="logo-sub">Enterprise Equipment Maintenance &amp; Parts Logistics</div>
      </div>
      <div class="meta-box">
        <strong>Document Code:</strong> DAH-SAP-INT-2026-V1<br>
        <strong>Audience:</strong> Rand &amp; ABS Consulting (SAP B1 Team)<br>
        <strong>Release Date:</strong> October 2026 &bull; Production Ready
      </div>
    </div>

    <div class="title-banner">
      <h1>SAP Business One Integration Specification &amp; M2M Developer Guide</h1>
      <p>Automated Komatsu Middle East Purchase Order Ingestion, Status Synchronization &amp; Error Handling</p>
    </div>

    <h2>1. Executive Summary &amp; Architecture</h2>
    <p>
      This developer guide provides the authoritative Machine-to-Machine (M2M) API specifications for <strong>ABS Consulting</strong> to integrate <strong>SAP Business One</strong> with Dar Al Hai's <strong>EQP System</strong>. The EQP synchronization engine scans Komatsu Middle East's PDX portal 4 times daily (07:00, 11:00, 14:00, 18:00 Kuwait Time) and ingests confirmed Emergency Orders (EO), Daily Stock (DS), and Stock Orders (SO).
    </p>

    <div class="callout">
      <strong>Core Integration Purpose:</strong> ABS's integration service retrieves confirmed Komatsu orders in real time, automatically creates corresponding Purchase Orders (PO) in SAP Business One against Vendor <code>V000006</code> (Komatsu Middle East), and confirms PO creation back to EQP with the SAP <code>DocNum</code> and <code>DocEntry</code>.
    </div>

    <div class="grid-2">
      <div class="card">
        <h4>Komatsu Ingestion Engine (EQP)</h4>
        <ul>
          <li>Scans Komatsu PDX every 4 hours daily.</li>
          <li>Delta deduplication by SO and Quotation number.</li>
          <li>Delivery due date calculated per channel (EO: +30d, DS: +10d, SO: +120d).</li>
          <li>Automatic cookie health check &amp; operator alerts.</li>
        </ul>
      </div>
      <div class="card">
        <h4>SAP Business One Gateway (ABS)</h4>
        <ul>
          <li>Polls <code>/orders/pending</code> or webhook pickup.</li>
          <li>Transitions orders to <code>PULLED_BY_SAP</code>.</li>
          <li>Inserts SAP B1 Purchase Order (DocType: Item).</li>
          <li>Acknowledges via <code>/orders/{id}/acknowledge</code>.</li>
        </ul>
      </div>
    </div>

    <h2>2. Hardened M2M Security &amp; Authentication</h2>
    <p>
      Communication is restricted to HTTPS with strict Machine-to-Machine authentication. All integration requests must include a cryptographically hashed Bearer API key in the HTTP header:
    </p>
    <pre>Authorization: Bearer eqp_live_&lt;32-byte-hex-secret&gt;</pre>
    <ul>
      <li><strong>Token Cryptography:</strong> API keys are hashed with <strong>SHA-256</strong> prior to database persistence. Plaintext keys are never stored.</li>
      <li><strong>Scoped Authorization:</strong> The integration service operates under the dedicated role <code>SAP_INTEGRATION_SERVICE</code> with granular scopes (<code>sap:read</code>, <code>sap:write</code>).</li>
      <li><strong>IP Whitelisting:</strong> Endpoints enforce configurable IP whitelisting for ABS gateway IPs (e.g., Azure VM, AWS NAT gateway, or ABS static IP).</li>
      <li><strong>Rate Limiting:</strong> Enforced at <strong>60 requests per minute</strong> per token to guarantee zero platform degradation.</li>
      <li><strong>Access Audit Trail:</strong> Every request is logged in <code>api_access_logs</code> with response latency, client IP, payload, and HTTP status code.</li>
    </ul>

    <h2>3. Order Integration State Machine</h2>
    <table>
      <thead>
        <tr>
          <th>State Enum</th>
          <th>Trigger Event</th>
          <th>Description &amp; Action Required</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>PENDING_SAP_PULL</strong></td>
          <td>Komatsu Ingestion Cron</td>
          <td>Order confirmed from Komatsu PDX. Ready for ABS/SAP pickup.</td>
        </tr>
        <tr>
          <td><strong>PULLED_BY_SAP</strong></td>
          <td><code>GET /orders/pending</code></td>
          <td>Retrieved by ABS integration gateway. Locked against duplicate pickups.</td>
        </tr>
        <tr>
          <td><strong>SAP_PO_CREATED</strong></td>
          <td><code>POST /acknowledge</code></td>
          <td>PO successfully created in SAP B1 with <code>sapDocNum</code> &amp; <code>sapDocEntry</code>.</td>
        </tr>
        <tr>
          <td><strong>SAP_SYNC_FAILED</strong></td>
          <td><code>POST /fail</code></td>
          <td>Integration failure reported by ABS (e.g., invalid item code). Flagged for retry.</td>
        </tr>
        <tr>
          <td><strong>EXCLUDED</strong></td>
          <td>Admin Action</td>
          <td>Manually omitted by Dar Al Hai operations from SAP processing.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- PAGE 2: Endpoints Specification & JSON Contracts -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="logo-text">DAR AL HAI &bull; EQP SYSTEM</div>
        <div class="logo-sub">Enterprise Equipment Maintenance &amp; Parts Logistics</div>
      </div>
      <div class="meta-box">
        <strong>Gateway Base URL:</strong> https://eqp.daralhai.com/api/v1/integration/sap<br>
        <strong>Documentation:</strong> https://eqp.daralhai.com/api/docs/sap-integration
      </div>
    </div>

    <h2>4. API Endpoints Specification</h2>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Endpoint Path</th>
          <th>Scope</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-get">GET</span></td>
          <td><code>/health</code></td>
          <td><code>sap:read</code></td>
          <td>Health &amp; connectivity check; verifies credentials and latency.</td>
        </tr>
        <tr>
          <td><span class="badge badge-get">GET</span></td>
          <td><code>/orders/pending</code></td>
          <td><code>sap:read</code></td>
          <td>Retrieves pending confirmed orders (auto-transitions to <code>PULLED_BY_SAP</code>).</td>
        </tr>
        <tr>
          <td><span class="badge badge-get">GET</span></td>
          <td><code>/orders/:id</code></td>
          <td><code>sap:read</code></td>
          <td>Inspects single order manifest and line items by ID or SO number.</td>
        </tr>
        <tr>
          <td><span class="badge badge-post">POST</span></td>
          <td><code>/orders/:id/acknowledge</code></td>
          <td><code>sap:write</code></td>
          <td>Confirms SAP PO creation with <code>sapDocNum</code> &amp; <code>sapDocEntry</code>.</td>
        </tr>
        <tr>
          <td><span class="badge badge-post">POST</span></td>
          <td><code>/orders/:id/fail</code></td>
          <td><code>sap:write</code></td>
          <td>Reports integration failure with detailed error diagnostic.</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Request &amp; Response Payloads</h2>

    <h3>5.1 GET /orders/pending &mdash; Response Example</h3>
    <pre>{
  "success": true,
  "totalCount": 1,
  "page": 1,
  "pageSize": 50,
  "returnedCount": 1,
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "komatsuSalesOrderNo": "200451",
      "komatsuQuotationNo": "0000281449",
      "distributorRefNo": "R197/2026",
      "channel": "EMERGENCY_ORDER",
      "orderDate": "2026-10-12T07:00:00.000Z",
      "deliveryDueDate": "2026-11-11T07:00:00.000Z",
      "currency": "USD",
      "vendorCode": "V000006",
      "customerCode": "536K",
      "customerName": "DAR AL HAI",
      "equipmentSerial": "100433",
      "equipmentModel": "PC500LC-10R",
      "sapStatus": "PULLED_BY_SAP",
      "items": [
        {
          "lineNumber": 1,
          "partNumber": "6742-01-5280",
          "description": "GASKET, HEAD",
          "quantity": 2,
          "unitPriceUSD": 45.50,
          "lineTotalUSD": 91.00,
          "suggestedWarehouse": "003",
          "suggestedTaxCode": "P0"
        }
      ]
    }
  ]
}
    </pre>
  </div>

  <!-- PAGE 3: Write Contracts & Field Mapping Reference -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="logo-text">DAR AL HAI &bull; EQP SYSTEM</div>
        <div class="logo-sub">Enterprise Equipment Maintenance &amp; Parts Logistics</div>
      </div>
      <div class="meta-box">
        <strong>Gateway Base URL:</strong> https://eqp.daralhai.com/api/v1/integration/sap<br>
        <strong>Documentation:</strong> https://eqp.daralhai.com/api/docs/sap-integration
      </div>
    </div>

    <h2>5. Request &amp; Response Payloads (Continued)</h2>
    <div class="grid-2">
      <div>
        <h3>5.2 POST /orders/:id/acknowledge</h3>
        <p>Sent by ABS immediately after SAP B1 PO generation:</p>
        <pre>{
  "sapDocNum": "300481",
  "sapDocEntry": 1824,
  "remarks": "Created via ABS Integration Engine"
}</pre>
      </div>
      <div>
        <h3>5.3 POST /orders/:id/fail</h3>
        <p>Sent by ABS when SAP B1 throws an error:</p>
        <pre>{
  "reason": "Item 6742-01-5280 not registered in Item Master",
  "errorCode": "-1002",
  "rawError": { "sapCode": -1002, "field": "ItemCode" }
}</pre>
      </div>
    </div>

    <h2>6. SAP Business One Field Mapping Reference</h2>
    <table>
      <thead>
        <tr>
          <th>EQP Field</th>
          <th>SAP B1 Target Field (OPOR / POR1)</th>
          <th>Type</th>
          <th>Default / Transformation</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>vendorCode</code></td><td><code>OPOR.CardCode</code></td><td>String</td><td>Fixed: <code>"V000006"</code> (Komatsu Middle East)</td></tr>
        <tr><td><code>orderDate</code></td><td><code>OPOR.DocDate</code></td><td>Date</td><td>Order timestamp</td></tr>
        <tr><td><code>deliveryDueDate</code></td><td><code>OPOR.DocDueDate</code></td><td>Date</td><td>Calculated SLA due date (EO: +30d, DS: +10d, SO: +120d)</td></tr>
        <tr><td><code>currency</code></td><td><code>OPOR.DocCur</code></td><td>String</td><td>Fixed: <code>"USD"</code></td></tr>
        <tr><td><code>distributorRefNo</code></td><td><code>OPOR.NumAtCard</code></td><td>String</td><td>Dar Al Hai Internal Ref (e.g., <code>"R197/2026"</code>)</td></tr>
        <tr><td><code>komatsuSalesOrderNo</code></td><td><code>OPOR.Comments</code></td><td>String</td><td>Stored in comments and UDF (e.g., <code>U_KomatsuSO</code>)</td></tr>
        <tr><td><code>items[].partNumber</code></td><td><code>POR1.ItemCode</code></td><td>String</td><td>OEM Komatsu Part Number (e.g., <code>"6742-01-5280"</code>)</td></tr>
        <tr><td><code>items[].quantity</code></td><td><code>POR1.Quantity</code></td><td>Numeric</td><td>Line Item Quantity</td></tr>
        <tr><td><code>items[].unitPriceUSD</code></td><td><code>POR1.Price</code></td><td>Numeric</td><td>Line Item Unit Price in USD</td></tr>
        <tr><td><code>items[].suggestedWarehouse</code></td><td><code>POR1.WhsCode</code></td><td>String</td><td>Default: <code>"003"</code></td></tr>
        <tr><td><code>items[].suggestedTaxCode</code></td><td><code>POR1.TaxCode</code></td><td>String</td><td>Default: <code>"P0"</code> (0% Tax)</td></tr>
      </tbody>
    </table>
  </div>

  <!-- PAGE 4: Integration Code Samples & Verification -->
  <div class="page">
    <div class="header-banner">
      <div>
        <div class="logo-text">DAR AL HAI &bull; EQP SYSTEM</div>
        <div class="logo-sub">Enterprise Equipment Maintenance &amp; Parts Logistics</div>
      </div>
      <div class="meta-box">
        <strong>Technical Support:</strong> motasem.ghanem@daralhai.com<br>
        <strong>API Explorer:</strong> /api/docs/sap-integration
      </div>
    </div>

    <h2>7. Implementation Code Examples for ABS Engineers</h2>

    <h3>7.1 C# / .NET Example (HttpClient &amp; SAP B1 DI API)</h3>
    <pre>var client = new HttpClient();
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "eqp_live_abs_secret_key");
const string baseUrl = "https://eqp.daralhai.com/api/v1/integration/sap";

// 1. Pull pending orders from EQP
var resp = await client.GetAsync($"{baseUrl}/orders/pending");
if (!resp.IsSuccessStatusCode) return;
var json = await resp.Content.ReadAsStringAsync();
using var doc = JsonDocument.Parse(json);

// 2. Iterate and insert Purchase Order into SAP B1 via DI API / Service Layer
foreach (var ord in doc.RootElement.GetProperty("orders").EnumerateArray()) {
    string orderId = ord.GetProperty("id").GetString();
    try {
        int sapDocNum = CreatePurchaseOrderInSap(ord); // Custom ABS method
        
        // 3. Acknowledge PO creation back to EQP
        var ack = new { sapDocNum = sapDocNum.ToString(), sapDocEntry = 1824, remarks = "Synced via ABS Service" };
        await client.PostAsJsonAsync($"{baseUrl}/orders/{orderId}/acknowledge", ack);
    } catch (Exception ex) {
        var fail = new { reason = ex.Message, errorCode = "-1001" };
        await client.PostAsJsonAsync($"{baseUrl}/orders/{orderId}/fail", fail);
    }
}</pre>

    <h3>7.2 cURL CLI Verification Commands</h3>
    <pre># 1. Pull Pending Orders
curl -X GET "https://eqp.daralhai.com/api/v1/integration/sap/orders/pending" \
  -H "Authorization: Bearer eqp_live_abs_secret_key"

# 2. Acknowledge SAP PO Creation
curl -X POST "https://eqp.daralhai.com/api/v1/integration/sap/orders/550e8400-e29b-41d4-a716-446655440000/acknowledge" \
  -H "Authorization: Bearer eqp_live_abs_secret_key" -H "Content-Type: application/json" \
  -d '{"sapDocNum": "300481", "sapDocEntry": 1824, "remarks": "PO created successfully"}'</pre>

    <h2>8. Verification &amp; Testing Checklist</h2>
    <div class="callout callout-warning">
      <strong>Initial Integration Test Procedure:</strong>
      <ol style="margin-top: 4px; padding-left: 16px;">
        <li>ABS receives initial sandbox/live token: <code>eqp_live_...</code></li>
        <li>Send <code>GET /health</code> to verify connectivity and IP whitelisting.</li>
        <li>Send <code>GET /orders/pending</code> to verify JSON payload structure.</li>
        <li>Execute test PO insertion in SAP B1 Test Company DB.</li>
        <li>Submit acknowledgment to confirm automatic transition to <code>SAP_PO_CREATED</code>.</li>
      </ol>
    </div>

    <h2>9. Production Contacts &amp; Operations</h2>
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Contact Person</th>
          <th>Email</th>
          <th>Support Scope</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Lead Systems Engineer</td>
          <td>Motasem Ghanem</td>
          <td>motasem.ghanem@daralhai.com</td>
          <td>API Key generation, EQP logic, Swagger issues</td>
        </tr>
        <tr>
          <td>ABS Integration Lead</td>
          <td>Rand / ABS Team</td>
          <td>abs-integration@daralhai.com</td>
          <td>SAP B1 DI API, Service Layer mapping</td>
        </tr>
      </tbody>
    </table>
  </div>

</body>
</html>`;

async function generatePdf() {
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  console.log('Temporary HTML created at:', tempHtmlPath);

  try {
    const { chromium } = require('../backend/node_modules/playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`file://${tempHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 7.2pt; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm;"><span>Dar Al Hai General Trading • EQP Systems Architecture</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> • Confidential</span></div>',
      margin: {
        top: '10mm',
        bottom: '14mm',
        left: '12mm',
        right: '12mm',
      },
    });

    await browser.close();
    console.log('PDF successfully generated with Playwright at:', outputPath);
  } catch (playwrightError) {
    console.warn('Playwright generation notice:', playwrightError.message);
    console.log('Generating fallback via PDFKit...');

    const PDFDocument = require('../backend/node_modules/pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    doc.fontSize(18).fillColor('#0369a1').text('DAR AL HAI & EQP SYSTEM', { align: 'center' });
    doc.fontSize(14).fillColor('#0f172a').text('SAP Business One M2M Developer Guide', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('Prepared for Rand & ABS Consulting Integration Team', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#0284c7').text('1. Overview');
    doc.fontSize(9).fillColor('#334155').text(
      'The EQP System ingests Komatsu Middle East Purchase Orders and provides hardened M2M endpoints for SAP Business One automation.'
    );
    doc.moveDown();

    doc.fontSize(12).fillColor('#0284c7').text('2. Security & Authentication');
    doc.fontSize(9).fillColor('#334155').text('Authorization Header: Bearer eqp_live_<key>');
    doc.text('Key Cryptography: SHA-256 hash storage; scoped role: SAP_INTEGRATION_SERVICE.');
    doc.moveDown();

    doc.fontSize(12).fillColor('#0284c7').text('3. Endpoints');
    doc.text('- GET /api/v1/integration/sap/health');
    doc.text('- GET /api/v1/integration/sap/orders/pending');
    doc.text('- GET /api/v1/integration/sap/orders/:id');
    doc.text('- POST /api/v1/integration/sap/orders/:id/acknowledge');
    doc.text('- POST /api/v1/integration/sap/orders/:id/fail');
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#64748b').text('Interactive Swagger documentation available at /api/docs/sap-integration');
    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));
    console.log('PDF successfully generated via PDFKit at:', outputPath);
  }
}

generatePdf()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  });
