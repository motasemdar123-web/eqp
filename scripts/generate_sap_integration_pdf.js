const fs = require('fs');
const path = require('path');
const { chromium } = require('../backend/node_modules/playwright');

const IMAGES_DIR = 'C:/Users/Motasem.ghanem/.gemini/antigravity/brain/10fff9e0-1e60-4198-ab29-f25c47f6647c/.user_uploaded';

function getBase64Image(filename) {
  const fullPath = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(fullPath)) {
    const data = fs.readFileSync(fullPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  console.warn('Image not found:', fullPath);
  return '';
}

const img1 = getBase64Image('media_1791187475717.png'); // Step 1: Requested Parts & Item Types
const img2 = getBase64Image('media_1791187485804.png'); // Step 2 & 3: Target Fleet & Settings
const img3 = getBase64Image('media_1791187500658.png'); // Step 4: Planned Unified Quotations Queue
const img4 = getBase64Image('media_1791187526953.png'); // Quotation to SO Converter & Create SAP PO

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dar Al Hai — Parts Inquiry & SAP B1 PO API Integration Guide</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
    }

    .page-break {
      page-break-before: always;
    }

    /* Header Banner */
    .header-banner {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }

    .org-badge {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 5px;
    }

    h1.doc-title {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 3px;
    }

    p.doc-subtitle {
      font-size: 9.5pt;
      color: #64748b;
      font-weight: 500;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 8pt;
    }

    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }

    .meta-item span {
      color: #0f172a;
      font-weight: 600;
    }

    /* Headings */
    h2.section-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin-top: 14px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 10px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 6px;
      color: #334155;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 8.5pt;
      border-left: 3.5px solid;
      page-break-inside: avoid;
    }

    .callout-amber {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }

    .callout-blue {
      background: #f0f9ff;
      border-color: #0284c7;
      color: #075985;
    }

    .callout-emerald {
      background: #ecfdf5;
      border-color: #10b981;
      color: #065f46;
    }

    .callout-title {
      display: block;
      font-weight: 700;
      font-size: 9pt;
      margin-bottom: 2px;
    }

    /* Architecture Flow Diagram */
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      margin: 10px 0;
      padding: 10px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      page-break-inside: avoid;
    }

    .flow-step {
      flex: 1;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 6px 5px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .flow-step-num {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      background: #0284c7;
      color: #ffffff;
      width: 16px;
      height: 16px;
      line-height: 16px;
      border-radius: 50%;
      margin-bottom: 3px;
    }

    .flow-step-title {
      font-size: 7.5pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .flow-step-desc {
      font-size: 6.5pt;
      color: #64748b;
      line-height: 1.2;
    }

    .flow-arrow {
      color: #94a3b8;
      font-size: 12pt;
      font-weight: bold;
      user-select: none;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 10px 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
    }

    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.5px;
    }

    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Figures / Screenshots */
    .figure-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px;
      margin: 8px 0;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .figure-card img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      display: block;
    }

    .figure-caption {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 5px;
      font-style: italic;
      text-align: center;
    }

    /* Code & JSON block */
    pre.code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7pt;
      padding: 8px;
      border-radius: 5px;
      overflow-x: auto;
      line-height: 1.35;
      margin: 6px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 3px;
      border-radius: 3px;
    }

    ul, ol {
      margin-left: 16px;
      margin-bottom: 6px;
      font-size: 9pt;
    }

    li {
      margin-bottom: 2px;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: EXECUTIVE BRIEF & ARCHITECTURE ================= -->
  <div class="header-banner">
    <span class="org-badge">Dar Al Hai General Trading • Heavy Equipment Operations</span>
    <h1 class="doc-title">Parts Inquiry &amp; SAP Business One PO API Integration</h1>
    <p class="doc-subtitle">Operational Context, Komatsu PDX Allocation Rules, and Proposed SAP B1 Service Layer Integration</p>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <strong>Target Audience</strong>
      <span>ABS (SAP B1 Technical Team)</span>
    </div>
    <div class="meta-item">
      <strong>Prepared By</strong>
      <span>Motasem Ghanem (EQP Ops)</span>
    </div>
    <div class="meta-item">
      <strong>Core Systems</strong>
      <span>EQP Portal • Komatsu PDX • SAP B1</span>
    </div>
    <div class="meta-item">
      <strong>Document Version</strong>
      <span>v1.0 (Integration RFC &amp; Spec)</span>
    </div>
  </div>

  <h2 class="section-title">1. Executive Summary &amp; Business Objective</h2>
  <p>
    Dar Al Hai is the authorized Komatsu equipment operator and service organization managing a major fleet of excavators, bulldozers, and heavy earthmoving machinery across infrastructure sites in Kuwait. To maintain operational readiness and rapidly restore breakdown machines, the Maintenance &amp; Spare Parts department orders genuine replacement components directly from <strong>Komatsu Middle East (KME / PDX Portal)</strong>.
  </p>
  <p>
    Once emergency orders are processed on the manufacturer portal, Komatsu confirms the stock and issues official <strong>Komatsu Sales Orders (SOs)</strong>. Each Komatsu Sales Order creates a direct commercial commitment billed by Vendor <strong><code>V000006</code> (Komatsu Middle East)</strong> in US Dollars (USD).
  </p>

  <div class="callout callout-blue">
    <span class="callout-title">The Objective for the ABS Team:</span>
    We need to enable the EQP system to automatically create corresponding <strong>Purchase Orders (POs)</strong> in <strong>SAP Business One</strong> for Vendor <code>V000006</code> via the <strong>SAP B1 Service Layer (REST API)</strong>. This replaces our current temporary desktop RPA bridge, prevents manual entry delays, and ensures 100% accounting alignment between Komatsu billing and SAP financial ledgers.
  </div>

  <h2 class="section-title">2. End-to-End System Architecture</h2>
  <p>
    The target solution connects the field maintenance workflow directly to SAP B1 via automated API requests:
  </p>

  <div class="flow-diagram">
    <div class="flow-step">
      <div class="flow-step-num">1</div>
      <div class="flow-step-title">Parts Inquiry</div>
      <div class="flow-step-desc">Enter part numbers &amp; enforce allocation caps per machine.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step">
      <div class="flow-step-num">2</div>
      <div class="flow-step-title">Fleet Allocation</div>
      <div class="flow-step-desc">Distribute across active chassis serial numbers.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step">
      <div class="flow-step-num">3</div>
      <div class="flow-step-title">Komatsu PDX</div>
      <div class="flow-step-desc">Submit sub-orders &amp; convert to Komatsu Sales Orders (SO).</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
      <div class="flow-step-num" style="background: #0284c7;">4</div>
      <div class="flow-step-title" style="color: #0369a1;">SAP Service Layer</div>
      <div class="flow-step-desc">REST API <code>POST /b1s/v1/PurchaseOrders</code>.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #10b981; background: #ecfdf5;">
      <div class="flow-step-num" style="background: #10b981;">5</div>
      <div class="flow-step-title" style="color: #065f46;">SAP B1 Database</div>
      <div class="flow-step-desc">Official <code>DocEntry</code> &amp; <code>DocNum</code> registered in SAP.</div>
    </div>
  </div>

  <h2 class="section-title">3. The Business Need: Why Orders Must Be Split</h2>
  <p>
    From an ERP perspective, purchasing 22 hydraulic hoses would normally be consolidated into a single PO line. However, the <strong>Komatsu Middle East PDX Portal</strong> enforces strict Emergency Order (EO) policies:
  </p>
  <ul>
    <li><strong>Mandatory Machine Chassis Binding:</strong> Every emergency breakdown line item must be validated against a genuine Komatsu Model (e.g. <code>PC500LC-10R</code>) and registered Kuwait Chassis Serial Number (e.g. <code>100433</code>).</li>
    <li><strong>Anti-Hoarding Line-Item Quotas:</strong> To prevent distributors from using breakdown channels to accumulate stock, Komatsu strictly caps the quantity per item per machine (e.g. <strong>maximum 1 or 2 hoses per machine</strong>).</li>
    <li><strong>Rejection of Bulk Orders:</strong> Submitting a single order of 22 hoses against one excavator is <strong>rejected by Komatsu portal validation</strong>.</li>
    <li><strong>Sequential Reference Numbering:</strong> Each dispatched sub-order must have a unique sequential distributor reference (e.g. <code>R229/2026</code> through <code>R238/2026</code>).</li>
  </ul>

  <div class="callout callout-amber">
    <span class="callout-title">The Operational Result:</span>
    To legitimately procure 22 hoses during a major emergency overhaul, the EQP system splits the request across <strong>10 compatible machines</strong>, resulting in <strong>10 Komatsu Quotations</strong>, which convert into <strong>10 Komatsu Sales Orders</strong>, and requires <strong>10 corresponding Purchase Orders in SAP Business One</strong>.
  </div>

  <!-- ================= PAGE 2: STEP 1 & STEP 2 SCREENSHOTS ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">4. Step-by-Step Functional Workflow &amp; Screenshots</h2>

  <h3 class="subsection-title">Step 1: Requested Parts &amp; Item Sub-Order Caps</h3>
  <p>
    The maintenance engineer enters required part numbers. The EQP engine verifies them against the genuine Komatsu catalogue, fetches official USD unit prices, and establishes the <strong>Max / Sub-Order</strong> constraint.
  </p>

  <div class="figure-card">
    <img src="${img1}" alt="Step 1: Requested Parts and Item Types" />
    <div class="figure-caption">Figure 1: Part Entry and Sub-Order Caps (Part 2A8-62-12230 capped at 2 EA/sub-order; Part 2A8-62-11751 capped at 1 EA/sub-order; Total: 22 EA, $1,498.020).</div>
  </div>

  <h3 class="subsection-title">Step 2 &amp; 3: Fleet Machine Pool Allocation &amp; Sequence Parameters</h3>
  <p>
    The dispatcher selects the customer fleet account (<em>Laala Al-Kuwait Real Estate Co.</em>), filters for model compatibility (<em>PC500LC-10R - 100% Match</em>), and activates a pool of genuine machines (20 serial numbers). The starting distributor reference is set (e.g., <code>R229/2026</code>) with breakdown remarks.
  </p>

  <div class="figure-card">
    <img src="${img2}" alt="Step 2 and 3: Fleet Allocation and Sequence Setup" />
    <div class="figure-caption">Figure 2: Active Machine Pool Selection (20 SNs allocated) and Sequential Reference Generation.</div>
  </div>

  <!-- ================= PAGE 3: STEP 3 & STEP 4 SCREENSHOTS ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">Step 4: Planned Unified Quotations &amp; Live Dispatch Queue</h3>
  <p>
    The dispatcher algorithm groups requested parts into compliant sub-orders, maximizing lines per order while respecting the individual quantity caps. Here, 22 units across 2 part numbers are allocated across 10 machines into <strong>10 sub-orders</strong> (<code>R229/2026</code> to <code>R238/2026</code>) ready for live dispatch to Komatsu PDX.
  </p>

  <div class="figure-card">
    <img src="${img3}" alt="Step 4: Planned Unified Quotations and Live Dispatch Queue" />
    <div class="figure-caption">Figure 3: Unified Quotations Dispatch Queue displaying DB order numbers, target asset serial numbers, and line items.</div>
  </div>

  <h3 class="subsection-title">Step 5: Komatsu Quotation to Sales Order (SO) Conversion &amp; SAP Trigger</h3>
  <p>
    Once submitted to Komatsu PDX, the portal returns official Komatsu Quotation Numbers (e.g., <code>0000282871</code>). The EQP system batch-confirms these quotations and converts them into official <strong>Komatsu Sales Orders (SO)</strong> (e.g., <code>SO #0000278046</code>, <code>SO #0000278047</code>...).
  </p>

  <div class="figure-card">
    <img src="${img4}" alt="Komatsu Quotation to SO Converter and SAP PO Trigger" />
    <div class="figure-caption">Figure 4: Komatsu Quotation to Sales Order Converter showing official Komatsu SO numbers and the target "Create SAP PO" action.</div>
  </div>

  <div class="callout callout-emerald">
    <span class="callout-title">The Exact Integration Trigger:</span>
    At this stage, the Komatsu Sales Order is officially confirmed. Clicking <strong>"Create SAP PO"</strong> should call the SAP Service Layer API to instantly create the approved Purchase Order in SAP B1 for Vendor <code>V000006</code>, returning the SAP <code>DocNum</code> directly into this screen.
  </div>

  <!-- ================= PAGE 4: TECHNICAL API SPECIFICATION FOR ABS ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">5. Technical API Specification for the ABS / SAP Team</h2>
  <p>
    To implement direct creation of Purchase Orders in SAP Business One, we propose integrating with the <strong>SAP Business One Service Layer</strong> (OData v4 REST API).
  </p>

  <h3 class="subsection-title">A. Authentication &amp; Session Management</h3>
  <ul>
    <li><strong>Endpoint:</strong> <code>POST https://&lt;sap-server&gt;:50000/b1s/v1/Login</code></li>
    <li><strong>Payload:</strong> <code>{ "CompanyDB": "DAR_AL_HAI", "UserName": "API_USER", "Password": "..." }</code></li>
    <li><strong>Session Handling:</strong> SAP returns HTTP Session Cookies (<code>B1SESSION</code> and <code>ROUTEID</code>) which our backend preserves and attaches to subsequent requests.</li>
  </ul>

  <h3 class="subsection-title">B. Header Field Mapping (Table: <code>OPOR</code> / Entity: <code>PurchaseOrders</code>)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">SAP Field</th>
        <th style="width: 25%;">SAP Description</th>
        <th style="width: 30%;">Source from EQP System</th>
        <th style="width: 25%;">Example Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>CardCode</code></td>
        <td>Vendor Code</td>
        <td>Komatsu Middle East Vendor Code</td>
        <td><code>V000006</code></td>
      </tr>
      <tr>
        <td><code>DocDate</code></td>
        <td>Posting Date</td>
        <td>Order Date (YYYY-MM-DD)</td>
        <td><code>2026-10-05</code></td>
      </tr>
      <tr>
        <td><code>DocDueDate</code></td>
        <td>Delivery Due Date</td>
        <td>Required Delivery Date</td>
        <td><code>2026-10-12</code></td>
      </tr>
      <tr>
        <td><code>DocCurrency</code></td>
        <td>Document Currency</td>
        <td>Komatsu Billed Currency</td>
        <td><code>USD</code></td>
      </tr>
      <tr>
        <td><code>NumAtCard</code></td>
        <td>Vendor Ref / BP Reference</td>
        <td>Komatsu SO Number + DB Order Ref</td>
        <td><code>SO #0000278046 / R228/2026</code></td>
      </tr>
      <tr>
        <td><code>Comments</code></td>
        <td>Remarks</td>
        <td>Breakdown Machine Model &amp; Serial</td>
        <td><code>Komatsu EO: PC500LC-10R (SN: 100433)</code></td>
      </tr>
      <tr>
        <td><code>U_KomatsuSO</code></td>
        <td>UDF: Komatsu SO No</td>
        <td>Official Komatsu Sales Order Number</td>
        <td><code>0000278046</code></td>
      </tr>
      <tr>
        <td><code>U_MachineSerial</code></td>
        <td>UDF: Machine Serial</td>
        <td>Chassis Serial Number</td>
        <td><code>100433</code></td>
      </tr>
      <tr>
        <td><code>U_MachineModel</code></td>
        <td>UDF: Machine Model</td>
        <td>Equipment Model Code</td>
        <td><code>PC500LC-10R</code></td>
      </tr>
    </tbody>
  </table>

  <h3 class="subsection-title">C. Line Item Field Mapping (Table: <code>POR1</code> / Entity: <code>DocumentLines</code>)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">SAP Field</th>
        <th style="width: 25%;">SAP Description</th>
        <th style="width: 30%;">Source from EQP System</th>
        <th style="width: 25%;">Example Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>ItemCode</code></td>
        <td>Item Number</td>
        <td>Genuine Komatsu Part Number</td>
        <td><code>2A8-62-12230</code></td>
      </tr>
      <tr>
        <td><code>ItemDescription</code></td>
        <td>Item Description</td>
        <td>Part Description from Komatsu Master</td>
        <td><code>HOSE</code></td>
      </tr>
      <tr>
        <td><code>Quantity</code></td>
        <td>Quantity</td>
        <td>Sub-order allocated quantity</td>
        <td><code>2.00</code></td>
      </tr>
      <tr>
        <td><code>UnitPrice</code></td>
        <td>Unit Price (USD)</td>
        <td>Komatsu Unit Price in USD</td>
        <td><code>66.31</code></td>
      </tr>
      <tr>
        <td><code>WarehouseCode</code></td>
        <td>Warehouse</td>
        <td>Receiving Warehouse</td>
        <td><code>003</code> <em>(or default per ABS)</em></td>
      </tr>
      <tr>
        <td><code>TaxCode</code></td>
        <td>Tax Code</td>
        <td>Import Zero/Exempt</td>
        <td><code>P0</code> <em>(or default per ABS)</em></td>
      </tr>
    </tbody>
  </table>

  <!-- ================= PAGE 5: JSON PAYLOAD & ACTION ITEMS ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">D. Concrete JSON Request Payload (<code>POST /b1s/v1/PurchaseOrders</code>)</h3>
  <p>
    Below is the exact JSON structure our backend will send to the Service Layer for each confirmed sub-order:
  </p>

  <pre class="code-block">{
  "CardCode": "V000006",
  "DocDate": "2026-10-05",
  "DocDueDate": "2026-10-12",
  "DocCurrency": "USD",
  "NumAtCard": "SO #0000278046 / R228/2026",
  "Comments": "Komatsu Emergency Order | Asset: PC500LC-10R (SN: 100433) | Customer: Laala Al-Kuwait | Quote: 0000282871",
  "U_KomatsuSO": "0000278046",
  "U_KomatsuQuote": "0000282871",
  "U_MachineSerial": "100433",
  "U_MachineModel": "PC500LC-10R",
  "DocumentLines": [
    {
      "ItemCode": "2A8-62-12230",
      "ItemDescription": "HOSE",
      "Quantity": 2.0,
      "UnitPrice": 66.31,
      "WarehouseCode": "003",
      "TaxCode": "P0"
    },
    {
      "ItemCode": "2A8-62-11751",
      "ItemDescription": "HOSE",
      "Quantity": 1.0,
      "UnitPrice": 70.23,
      "WarehouseCode": "003",
      "TaxCode": "P0"
    }
  ]
}</pre>

  <h3 class="subsection-title">E. Expected SAP Response &amp; Storage</h3>
  <p>
    Upon successful creation, SAP B1 returns HTTP 201 Created with the document identifiers:
  </p>
  <pre class="code-block">{
  "DocEntry": 14205,
  "DocNum": 20260481,
  "DocDate": "2026-10-05",
  "CardCode": "V000006",
  "DocTotal": 202.85,
  "DocCurrency": "USD"
}</pre>
  <p>
    The EQP database saves <code>DocNum: 20260481</code> and <code>DocEntry: 14205</code> alongside the Komatsu quotation record, giving the maintenance and finance teams instant cross-traceability.
  </p>

  <h2 class="section-title">6. Key Questions &amp; Alignment Needed from ABS</h2>
  <ol>
    <li>
      <strong>Service Layer Endpoint URL &amp; Connectivity:</strong><br>
      Please provide the official Service Layer URL (e.g., <code>https://daralhai.b1pro.com:50000/b1s/v1/</code>) and confirm firewall access for the EQP backend server.
    </li>
    <li>
      <strong>Dedicated Technical API User:</strong><br>
      We request a dedicated API service account (e.g., <code>B1_API_EQP</code>) with authorizations limited to <code>PurchaseOrders</code> (Create/Read) to avoid relying on interactive user credentials.
    </li>
    <li>
      <strong>Handling New Part Numbers (Item Master <code>OITM</code>):</strong><br>
      With over 500,000 Komatsu catalogue items, occasionally an emergency breakdown part does not yet exist in SAP B1. What is ABS's preferred procedure?
      <ul style="margin-top: 3px;">
        <li><em>Option 1 (Recommended):</em> Allow our API to auto-create missing parts via <code>POST /b1s/v1/Items</code> using Komatsu catalogue metadata prior to PO creation.</li>
        <li><em>Option 2:</em> Use a standard non-inventory item master with explicit line-item descriptions.</li>
      </ul>
    </li>
    <li>
      <strong>Document Status: Active PO vs. Draft:</strong><br>
      Should the API create approved open POs (<code>PurchaseOrders</code>) directly, or create Drafts (<code>PurchaseOrderDrafts</code>) for accounting verification during the pilot phase?
    </li>
    <li>
      <strong>Existing UDFs:</strong><br>
      Please confirm if user-defined fields already exist on <code>OPOR</code> for Komatsu SO numbers or Machine Serials that we should populate.
    </li>
  </ol>

  <div class="callout callout-emerald" style="margin-top: 10px;">
    <span class="callout-title">Next Steps:</span>
    Once ABS provides the Service Layer connection parameters and confirms the Item Master policy, the EQP engineering team will execute test transactions in the SAP sandbox environment within 24 hours.
  </div>

</body>
</html>
`;

async function generatePdf() {
  const outputPath = path.join(__dirname, '../docs/SAP_B1_Parts_Inquiry_Integration_Guide.pdf');
  const tempHtmlPath = path.join(__dirname, '../scratch/integration_guide_temp.html');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');
  console.log('HTML written to:', tempHtmlPath);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(`file://${tempHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">Dar Al Hai &bull; Parts Inquiry &amp; SAP B1 PO API Integration Guide</div>',
    footerTemplate: '<div style="font-size: 7.5pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;">Confidential &bull; Prepared for ABS Consulting &bull; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF successfully created at:', outputPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
