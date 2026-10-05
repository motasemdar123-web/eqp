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
      margin: 12mm 13mm 12mm 13mm;
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
      font-size: 9pt;
    }

    .page-break {
      page-break-before: always;
    }

    /* Header Banner */
    .header-banner {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .org-badge {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }

    h1.doc-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 3px;
    }

    p.doc-subtitle {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
      margin-bottom: 12px;
      font-size: 7.5pt;
    }

    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 6.5pt;
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
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin-top: 13px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 9px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 5px;
      color: #334155;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 5px;
      padding: 8px 11px;
      margin: 8px 0;
      font-size: 8pt;
      border-left: 3.5px solid;
      page-break-inside: avoid;
      line-height: 1.4;
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
      font-size: 8.5pt;
      margin-bottom: 2px;
    }

    /* Architecture Flow Diagram */
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      margin: 8px 0;
      padding: 8px 6px;
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
      padding: 6px 4px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .flow-step-num {
      display: inline-block;
      font-size: 6.5pt;
      font-weight: 700;
      background: #0284c7;
      color: #ffffff;
      width: 15px;
      height: 15px;
      line-height: 15px;
      border-radius: 50%;
      margin-bottom: 2px;
    }

    .flow-step-title {
      font-size: 7pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 2px;
    }

    .flow-step-desc {
      font-size: 6pt;
      color: #64748b;
      line-height: 1.2;
    }

    .flow-arrow {
      color: #94a3b8;
      font-size: 11pt;
      font-weight: bold;
      user-select: none;
    }

    /* Badges & Pills */
    .badge-ds {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 700;
      display: inline-block;
    }

    .badge-eo {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 700;
      display: inline-block;
    }

    .badge-kme {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 6.5pt;
      font-weight: 700;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 7px 0 9px 0;
      font-size: 7.5pt;
      page-break-inside: avoid;
    }

    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 4.5px 6.5px;
      text-align: left;
    }

    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 6.5pt;
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
      padding: 5px;
      margin: 7px 0;
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
      font-size: 7pt;
      color: #475569;
      margin-top: 4px;
      font-style: italic;
      text-align: center;
    }

    /* UI Simulation Widget */
    .ui-mock-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 9px;
      margin: 7px 0;
      font-size: 7.5pt;
      page-break-inside: avoid;
    }

    .ui-mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 6px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Code & JSON block */
    pre.code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7pt;
      padding: 8px 10px;
      border-radius: 5px;
      overflow-x: auto;
      line-height: 1.38;
      margin: 6px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 3px;
      border-radius: 3px;
    }

    ul, ol {
      margin-left: 15px;
      margin-bottom: 5px;
      font-size: 8.5pt;
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
    <p class="doc-subtitle">Operational Context, Komatsu PDX Split Rules, and Unified SAP B1 Service Layer Purchase Order Creation</p>
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
      <span>v2.0 (Unified SAP PO Creation RFC)</span>
    </div>
  </div>

  <h2 class="section-title">1. Executive Summary: All Orders Are Identical to SAP</h2>
  <p>
    Dar Al Hai is the authorized Komatsu equipment operator and service organization managing an extensive fleet of excavators, bulldozers, and heavy earthmoving machinery across major infrastructure projects in Kuwait. To maintain operational readiness and rapidly replenish replacement components, the Maintenance &amp; Spare Parts department orders genuine parts directly from <strong>Komatsu Middle East (KME / PDX Portal)</strong>.
  </p>
  <p>
    To ensure seamless accounting integration, the EQP maintenance system connects directly with <strong>SAP Business One</strong> to create corresponding <strong>Purchase Orders (POs)</strong> for Vendor <strong><code>V000006</code> (Komatsu Middle East)</strong> in US Dollars (USD).
  </p>

  <div class="callout callout-emerald">
    <span class="callout-title">Core Operating Principle for the ABS Team:</span>
    <strong>To SAP Business One, all orders are identical standard Purchase Orders.</strong><br>
    Whether a sub-order originated from an Emergency Order (<span class="badge-eo">EO</span>) or a Normal Stock Order (<span class="badge-ds">DS</span> / <span class="badge-ds">SO</span>), <strong>the SAP integration structure and process do not change</strong>:
    <ul style="margin-top: 4px;">
      <li><strong>Automatic Pricing from Komatsu:</strong> The unit price generated in Komatsu PDX already reflects the final price. When an order is placed on an Emergency basis (EO), Komatsu PDX automatically adjusts the unit price directly on the quotation. When placed as Daily Stock (DS), it applies normal catalogue rates.</li>
      <li><strong>Direct Price Passthrough:</strong> Neither SAP nor the API integration middleware needs to calculate surcharges, premiums, or special freight formulas. SAP simply records the exact confirmed unit price received from Komatsu.</li>
      <li><strong>Uniform PO Structure:</strong> Every confirmed Komatsu Sales Order (SO) creates one standard Purchase Order in SAP B1 using the exact same API payload schema.</li>
    </ul>
  </div>

  <h2 class="section-title">2. End-to-End System Architecture Flow</h2>
  <p>
    The workflow connects field requisitions to SAP Business One through a clean, automated API sequence:
  </p>

  <div class="flow-diagram">
    <div class="flow-step">
      <div class="flow-step-num">1</div>
      <div class="flow-step-title">Parts Entry</div>
      <div class="flow-step-desc">Enter part numbers &amp; required quantities.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
      <div class="flow-step-num" style="background: #0284c7;">2</div>
      <div class="flow-step-title" style="color: #0369a1;">PDX Inquiry</div>
      <div class="flow-step-desc">Check stock across Dubai warehouse &amp; factory.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #10b981; background: #ecfdf5;">
      <div class="flow-step-num" style="background: #10b981;">3</div>
      <div class="flow-step-title" style="color: #065f46;">Komatsu Splitting</div>
      <div class="flow-step-desc">Split per Komatsu rules (Stock vs Emergency caps).</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step">
      <div class="flow-step-num">4</div>
      <div class="flow-step-title">Komatsu Sales Order</div>
      <div class="flow-step-desc">Convert to confirmed Komatsu SOs with final USD prices.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
      <div class="flow-step-num" style="background: #0284c7;">5</div>
      <div class="flow-step-title" style="color: #0369a1;">Uniform SAP PO</div>
      <div class="flow-step-desc"><code>POST /b1s/v1/PurchaseOrders</code> (Direct price entry).</div>
    </div>
  </div>

  <!-- ================= PAGE 2: WHY ORDERS ARE SPLIT ON KOMATSU SIDE ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">3. The Operational Need: Why Orders Are Split (Komatsu Portal Constraint)</h2>
  <p>
    From an ERP perspective, purchasing 50 filters would normally be handled as a single PO line. However, the <strong>Komatsu Middle East PDX Portal</strong> enforces strict manufacturer routing and anti-hoarding policies that require the EQP system to split requests into multiple sub-orders:
  </p>
  <ul>
    <li><strong>Channel Distinction on Komatsu PDX:</strong>
      <ul>
        <li><strong>Normal Stock Orders (<span class="badge-ds">DS</span> Daily Stock / <span class="badge-ds">SO</span> Stock Order):</strong> Fulfilled up to available stock in KME Dubai local warehouse. Komatsu allows bulk quantities with <strong>no machine serial number or customer details</strong>.</li>
        <li><strong>Emergency Orders (<span class="badge-eo">EO</span>):</strong> Used for shortages and factory backorders. Komatsu strictly mandates that every emergency line item must be validated against a genuine machine model (e.g. <code>PC500LC-10R</code>) and Kuwait chassis serial number (e.g. <code>100433</code>).</li>
      </ul>
    </li>
    <li><strong>Anti-Hoarding Line Item Quotas (Emergency Channel):</strong> Komatsu caps emergency breakdown quantities per machine (e.g. max 20 filters per machine). Submitting 50 units against a single excavator is rejected by portal validation.</li>
    <li><strong>Automated Komatsu Pricing:</strong> When Komatsu generates an Emergency quotation, it automatically applies its emergency pricing structure to the unit price. When generating a Daily Stock quotation, it applies base rates.</li>
    <li><strong>Sequential Reference Numbering:</strong> Each dispatched Komatsu sub-order receives a continuous sequential distributor reference (e.g. <code>R229/2026</code>, <code>R230/2026</code>, <code>R231/2026</code>).</li>
  </ul>

  <div class="callout callout-blue">
    <span class="callout-title">Summary for SAP Team: Order Splitting is Strictly an External Komatsu Operational Step</span>
    The splitting logic and machine allocation exist solely to comply with Komatsu's manufacturer portal rules. <strong>Once Komatsu approves and confirms the sub-orders into official Komatsu Sales Orders (SOs), each SO maps directly 1:1 into a standard SAP Business One Purchase Order.</strong>
  </div>

  <h2 class="section-title">4. Illustrative Example: 50 Units of Fuel Filter (Part 600-311-6742)</h2>
  <p>
    When a maintenance requisition for 50 units is processed:
  </p>
  <div class="ui-mock-box">
    <div class="ui-mock-header">
      <span>Requisition: 50 EA &bull; Fuel Filter (600-311-6742)</span>
      <span>Komatsu PDX Stock Availability: KME Stock: 10 | Shortage: 40</span>
    </div>
    <div style="font-size: 7.5pt; color: #334155; line-height: 1.45;">
      <strong>1. Komatsu Sub-Order #1 (<span class="badge-ds">DS Stock</span>) — Ref <code>R229/2026</code>:</strong> 10 units fulfilled from Dubai stock &rarr; Converts to <strong>Komatsu SO #0000278046</strong> at confirmed catalogue price &rarr; <strong>Creates SAP PO #1</strong>.<br>
      <strong>2. Komatsu Sub-Order #2 (<span class="badge-eo">EO Emergency</span>) — Ref <code>R230/2026</code>:</strong> 20 units assigned to Machine SN 100433 &rarr; Converts to <strong>Komatsu SO #0000278047</strong> at confirmed PDX price &rarr; <strong>Creates SAP PO #2</strong>.<br>
      <strong>3. Komatsu Sub-Order #3 (<span class="badge-eo">EO Emergency</span>) — Ref <code>R231/2026</code>:</strong> 20 units assigned to Machine SN 100434 &rarr; Converts to <strong>Komatsu SO #0000278048</strong> at confirmed PDX price &rarr; <strong>Creates SAP PO #3</strong>.
    </div>
  </div>
  <p style="font-size: 8pt; color: #64748b; font-style: italic;">
    Each of the 3 resulting SAP Purchase Orders uses the exact same document structure, with the exact price confirmed on the respective Komatsu SO.
  </p>

  <!-- ================= PAGE 3: STEP 1 & STEP 2 SCREENSHOTS & UI FLOW ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">5. Step-by-Step Functional Workflow &amp; Screenshots</h2>

  <h3 class="subsection-title">Step 1: Part Entry, Real-Time Master Stock &amp; Allocation</h3>
  <p>
    The maintenance engineer enters requested part numbers. The EQP engine verifies them against the Komatsu catalogue, fetches live warehouse availability badges (<strong>KME Stock</strong> in Dubai, <strong>EOR</strong> restriction, and <strong>KLTD</strong> factory stock), and allocates quantities between available stock and emergency shortage.
  </p>

  <div class="figure-card">
    <img src="${img1}" alt="Step 1: Requested Parts and Item Types" />
    <div class="figure-caption">Figure 1: Part Entry table showing catalogue verification, descriptions, and line item quantity breakdown.</div>
  </div>

  <h3 class="subsection-title">Step 2: Fleet Machine Allocation (Emergency Orders Only)</h3>
  <p>
    For items routed through the Emergency channel, the dispatcher selects the target customer fleet account (e.g. <em>Laala Al-Kuwait Real Estate Co.</em>) and activates compatible machine chassis serial numbers (e.g. <em>PC500LC-10R</em>). For 100% Stock orders, machine allocation is completely bypassed.
  </p>

  <div class="figure-card">
    <img src="${img2}" alt="Step 2: Fleet Allocation and Sequence Setup" />
    <div class="figure-caption">Figure 2: Active Machine Pool Selection (filtered for compatible equipment) and sequential distributor reference setup.</div>
  </div>

  <!-- ================= PAGE 4: DISPATCH MANIFEST & SO CONVERSION ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">Step 3: Unified Quotations Manifest</h3>
  <p>
    The EQP engine generates the sub-order manifest ready for Komatsu submission, assigning continuous distributor reference numbers (e.g. <code>R229/2026</code>, <code>R230/2026</code>, <code>R231/2026</code>) and tracking asset assignments.
  </p>

  <div class="figure-card">
    <img src="${img3}" alt="Step 3: Planned Unified Quotations and Live Dispatch Queue" />
    <div class="figure-caption">Figure 3: Planned Unified Quotations Manifest showing distributor order references, target assets, and line items.</div>
  </div>

  <h3 class="subsection-title">Step 4: Komatsu Quotation to Sales Order (SO) Conversion &amp; SAP Trigger</h3>
  <p>
    Once submitted to Komatsu PDX, the portal returns official Komatsu Quotation Numbers. The EQP system batch-confirms these quotations and converts them into official <strong>Komatsu Sales Orders (SO)</strong> (e.g., <code>SO #0000278046</code>, <code>SO #0000278047</code>...).
  </p>

  <div class="figure-card">
    <img src="${img4}" alt="Step 4: Komatsu Quotation to SO Converter and SAP PO Trigger" />
    <div class="figure-caption">Figure 4: Komatsu Quotation to Sales Order Converter showing official Komatsu SO numbers and the target "Create SAP PO" action.</div>
  </div>

  <div class="callout callout-emerald">
    <span class="callout-title">The Exact Integration Trigger:</span>
    At this stage, the Komatsu Sales Order is officially confirmed. Clicking <strong>"Create SAP PO"</strong> calls the SAP Service Layer API to instantly create the approved Purchase Order in SAP B1 for Vendor <code>V000006</code>, returning the SAP <code>DocNum</code> directly into this screen.
  </div>

  <!-- ================= PAGE 5: TECHNICAL API SPECIFICATION FOR ABS ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">6. Technical API Specification for the ABS / SAP Team</h2>
  <p>
    To implement direct creation of Purchase Orders in SAP Business One, we propose integrating with the <strong>SAP Business One Service Layer</strong> (OData v4 REST API).
  </p>

  <h3 class="subsection-title">A. Header Field Mapping (Table: <code>OPOR</code> / Entity: <code>PurchaseOrders</code>)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">SAP Field</th>
        <th style="width: 25%;">SAP Description</th>
        <th style="width: 30%;">Source from EQP System</th>
        <th style="width: 27%;">Example Value</th>
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
        <td><code>SO #0000278046 / R229/2026</code></td>
      </tr>
      <tr>
        <td><code>Comments</code></td>
        <td>Remarks</td>
        <td>Order context &amp; reference notes</td>
        <td><code>Komatsu Ref: R229/2026 | Quote: 0000282871</code></td>
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
        <td>Asset Serial (if EO) or blank (if Stock)</td>
        <td><code>100433</code> <em>(or null)</em></td>
      </tr>
      <tr>
        <td><code>U_MachineModel</code></td>
        <td>UDF: Machine Model</td>
        <td>Equipment Model (if EO) or blank (if Stock)</td>
        <td><code>PC500LC-10R</code> <em>(or null)</em></td>
      </tr>
    </tbody>
  </table>

  <h3 class="subsection-title">B. Line Item Field Mapping (Table: <code>POR1</code> / Entity: <code>DocumentLines</code>)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">SAP Field</th>
        <th style="width: 25%;">SAP Description</th>
        <th style="width: 30%;">Source from EQP System</th>
        <th style="width: 27%;">Example Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>ItemCode</code></td>
        <td>Item Number</td>
        <td>Genuine Komatsu Part Number</td>
        <td><code>600-311-6742</code></td>
      </tr>
      <tr>
        <td><code>ItemDescription</code></td>
        <td>Item Description</td>
        <td>Part Description from Komatsu Master</td>
        <td><code>FUEL FILTER</code></td>
      </tr>
      <tr>
        <td><code>Quantity</code></td>
        <td>Quantity</td>
        <td>Confirmed order line quantity</td>
        <td><code>10.00</code></td>
      </tr>
      <tr>
        <td><code>UnitPrice</code></td>
        <td>Unit Price (USD)</td>
        <td><strong>Confirmed unit price directly from Komatsu SO</strong></td>
        <td><code>25.00</code></td>
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

  <h3 class="subsection-title">C. Unified Standard JSON Request Payload (<code>POST /b1s/v1/PurchaseOrders</code>)</h3>
  <p>
    Because all orders follow the exact same structure in SAP, our backend transmits this uniform payload:
  </p>

  <pre class="code-block">{
  "CardCode": "V000006",
  "DocDate": "2026-10-05",
  "DocDueDate": "2026-10-12",
  "DocCurrency": "USD",
  "NumAtCard": "SO #0000278046 / R229/2026",
  "Comments": "Komatsu Order | DB Ref: R229/2026 | Quote: 0000282871",
  "U_KomatsuSO": "0000278046",
  "U_KomatsuQuote": "0000282871",
  "U_MachineSerial": "100433",
  "U_MachineModel": "PC500LC-10R",
  "DocumentLines": [
    {
      "ItemCode": "600-311-6742",
      "ItemDescription": "FUEL FILTER",
      "Quantity": 10.0,
      "UnitPrice": 25.00,
      "WarehouseCode": "003",
      "TaxCode": "P0"
    }
  ]
}</pre>

  <!-- ================= PAGE 6: SAP RESPONSE & ACTION ITEMS ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">D. Expected SAP Response &amp; Storage</h3>
  <p>
    Upon successful creation, the SAP B1 Service Layer returns HTTP 201 Created with the official document identifiers:
  </p>
  <pre class="code-block">{
  "DocEntry": 14205,
  "DocNum": 20260481,
  "DocDate": "2026-10-05",
  "CardCode": "V000006",
  "DocTotal": 250.00,
  "DocCurrency": "USD"
}</pre>
  <p>
    The EQP database stores <code>DocNum: 20260481</code> and <code>DocEntry: 14205</code> directly onto the Komatsu quotation record, giving maintenance, procurement, and accounting teams complete cross-traceability.
  </p>

  <h2 class="section-title">7. Key Questions &amp; Alignment Needed from the ABS Team</h2>
  <ol>
    <li>
      <strong>Service Layer Endpoint URL &amp; Connectivity:</strong><br>
      Please provide the official Service Layer URL (e.g. <code>https://daralhai.b1pro.com:50000/b1s/v1/</code>) and confirm firewall whitelisting for the EQP backend server.
    </li>
    <li>
      <strong>Dedicated Technical API User:</strong><br>
      We request a dedicated API service account (e.g. <code>B1_API_EQP</code>) with permissions restricted to <code>PurchaseOrders</code> (Create/Read) and <code>Items</code> (Read/Create) to avoid using individual user credentials.
    </li>
    <li>
      <strong>Handling New Part Numbers (Item Master <code>OITM</code>):</strong><br>
      With over 500,000 Komatsu parts in the catalogue, occasionally a component does not yet exist in SAP B1. What is ABS's preferred procedure?
      <ul style="margin-top: 3px;">
        <li><em>Option 1 (Recommended):</em> Allow our API to auto-create missing parts via <code>POST /b1s/v1/Items</code> using Komatsu catalogue master data before creating the PO.</li>
        <li><em>Option 2:</em> Use a standard non-inventory item master with explicit line-item descriptions.</li>
      </ul>
    </li>
    <li>
      <strong>Document Status: Active PO vs. Draft:</strong><br>
      Should the API create approved open POs (<code>PurchaseOrders</code>) directly, or create Drafts (<code>PurchaseOrderDrafts</code>) for accounting verification during the initial pilot phase?
    </li>
    <li>
      <strong>Receiving Warehouse Code:</strong><br>
      Please confirm the default receiving warehouse code for Komatsu parts (e.g. <code>003</code> or <code>001</code>).
    </li>
    <li>
      <strong>Existing UDF Confirmation:</strong><br>
      Please confirm if user-defined fields already exist on <code>OPOR</code> for <code>U_KomatsuSO</code>, <code>U_MachineSerial</code>, and <code>U_MachineModel</code>, or if ABS will create them.
    </li>
  </ol>

  <div class="callout callout-emerald" style="margin-top: 10px;">
    <span class="callout-title">Next Steps &amp; Testing Plan:</span>
    Once ABS provides the Service Layer connection credentials and confirms the item master procedure, the EQP engineering team will execute sample test transactions in the SAP sandbox environment within 24 hours.
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
      top: '11mm',
      bottom: '11mm',
      left: '12mm',
      right: '12mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">Dar Al Hai &bull; Parts Inquiry &amp; SAP B1 PO API Integration Guide</div>',
    footerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;">Confidential &bull; Prepared for ABS Consulting &bull; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF successfully created at:', outputPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
