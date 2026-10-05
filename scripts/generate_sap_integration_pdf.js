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
  <title>Dar Al Hai — Komatsu Parts Procurement &amp; SAP Business One PO API Integration Guide</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
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
      line-height: 1.48;
      font-size: 8.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Strict Physical Page Container */
    .pdf-page {
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
      height: 1025px;
      max-height: 1025px;
      padding: 0;
      margin: 0;
      position: relative;
    }

    .pdf-page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }

    /* Header Banner */
    .header-banner {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 7px;
      margin-bottom: 10px;
    }

    .org-badge {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2.5px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }

    h1.doc-title {
      font-size: 15.5pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.22;
      margin-bottom: 3px;
      letter-spacing: -0.2px;
    }

    p.doc-subtitle {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 500;
      line-height: 1.35;
    }

    /* Metadata Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
      margin-bottom: 11px;
      font-size: 7.6pt;
    }

    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 6.5pt;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 1.5px;
    }

    .meta-item span {
      color: #0f172a;
      font-weight: 600;
    }

    /* Headings */
    h2.section-title {
      font-size: 10.2pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin-top: 10px;
      margin-bottom: 5px;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 8.8pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 8px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 5px;
      color: #334155;
      font-size: 8.2pt;
      line-height: 1.45;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 6px;
      padding: 8px 11px;
      margin: 8px 0;
      font-size: 7.9pt;
      border-left: 3.5px solid;
      page-break-inside: avoid;
      line-height: 1.42;
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
      font-size: 8.3pt;
      margin-bottom: 2.5px;
    }

    /* Architecture Flow Diagram */
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin: 9px 0;
      padding: 9px 8px;
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
      font-size: 6.8pt;
      font-weight: 700;
      background: #0284c7;
      color: #ffffff;
      width: 15px;
      height: 15px;
      line-height: 15px;
      border-radius: 50%;
      margin-bottom: 2.5px;
    }

    .flow-step-title {
      font-size: 7.1pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 2px;
    }

    .flow-step-desc {
      font-size: 6.1pt;
      color: #64748b;
      line-height: 1.25;
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
      padding: 0.5px 4px;
      border-radius: 3px;
      font-size: 6.8pt;
      font-weight: 700;
      display: inline-block;
      vertical-align: baseline;
    }

    .badge-eo {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.5px 4px;
      border-radius: 3px;
      font-size: 6.8pt;
      font-weight: 700;
      display: inline-block;
      vertical-align: baseline;
    }

    .badge-kme {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 0.5px 4px;
      border-radius: 3px;
      font-size: 6.8pt;
      font-weight: 700;
      display: inline-block;
      vertical-align: baseline;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 8px 0;
      font-size: 7.6pt;
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
      font-size: 6.6pt;
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
      margin: 6px 0;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      text-align: center;
    }

    .figure-card img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      display: block;
      margin: 0 auto;
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
      padding: 8px 10px;
      margin: 6px 0;
      font-size: 7.6pt;
      page-break-inside: avoid;
    }

    .ui-mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 5px;
      font-weight: 700;
      color: #0f172a;
      font-size: 7.8pt;
    }

    /* Code & JSON block */
    pre.code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 6.9pt;
      padding: 7px 9px;
      border-radius: 5px;
      overflow-x: hidden;
      line-height: 1.36;
      margin: 5px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.2pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.5px 2px;
      border-radius: 3px;
    }

    ul, ol {
      margin-left: 15px;
      margin-bottom: 4px;
      font-size: 7.9pt;
    }

    li {
      margin-bottom: 2.5px;
      color: #334155;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 5px 0;
    }

    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 8px;
    }

    .feature-card h4 {
      font-size: 7.6pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .feature-card p {
      font-size: 7.2pt;
      color: #475569;
      margin-bottom: 0;
      line-height: 1.35;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: EXECUTIVE BRIEF & ARCHITECTURE ================= -->
  <div class="pdf-page" id="page-1">
    <div class="header-banner">
      <span class="org-badge">Dar Al Hai General Trading Co. W.L.L. &bull; Heavy Equipment Operations</span>
      <h1 class="doc-title">Komatsu Parts Procurement &amp; SAP Business One PO Automation</h1>
      <p class="doc-subtitle">Operational Fleet Context, Komatsu PDX Split Rules, and Unified SAP B1 Service Layer Integration Specification</p>
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
        <strong>Vendor Master</strong>
        <span>Komatsu Middle East (<code>V000006</code>)</span>
      </div>
      <div class="meta-item">
        <strong>Document Version</strong>
        <span>v2.2 (Enterprise RFC Specification)</span>
      </div>
    </div>

    <h2 class="section-title">1. Operational Fleet Context: Mission-Critical Asset Management</h2>
    <p>
      Dar Al Hai General Trading operates a premier fleet of heavy earthmoving and construction equipment deployed across major civil infrastructure, deep excavation, and coastal development projects throughout Kuwait. The operational core includes heavy <strong>Komatsu hydraulic excavators</strong> (such as <code>PC500LC-10R</code> and <code>PC400</code>), crawler bulldozers (<code>D375A</code>), and high-capacity wheel loaders (<code>WA470</code>). In continuous 24/7 operating environments, equipment availability directly governs project schedules, and unbudgeted downtime creates severe financial penalties and contractual delivery risks.
    </p>
    <p>
      To sustain maximum machine availability, the Maintenance &amp; Fleet Logistics division procures genuine OEM replacement components directly from the authorized regional distributor entity, <strong>Komatsu Middle East FZE (KME)</strong>, utilizing their digital B2B distributor portal (<strong>Komatsu PDX</strong>). In SAP Business One, Komatsu Middle East is configured as foreign Vendor <strong><code>V000006</code></strong>, transacting strictly in <strong>US Dollars (USD)</strong>.
    </p>

    <h2 class="section-title">2. Core Architectural Principle: Absolute Uniformity for SAP Business One</h2>
    <div class="callout callout-emerald">
      <span class="callout-title">Guiding Engineering Tenet for ABS Consultants &amp; Developers:</span>
      <strong>To SAP Business One, all incoming transactions are uniform, standard Purchase Orders (<code>OPOR</code>).</strong><br>
      Regardless of whether parts were allocated to routine warehouse replenishment or urgent machine breakdown repairs, and regardless of how orders were partitioned upstream on the manufacturer's portal, <strong>the SAP integration schema, business object, and financial posting process remain 100% identical</strong>:
      <ul style="margin-top: 4px;">
        <li><strong>Native Manufacturer Pricing (Automatic Passthrough):</strong> The unit price generated by Komatsu PDX on the confirmed Sales Order represents the final, binding price. For Emergency Orders (<span class="badge-eo">EO</span>), Komatsu automatically embeds emergency rates directly into the line-item unit price. For Daily Stock (<span class="badge-ds">DS</span>), it applies standard catalogue distributor rates.</li>
        <li><strong>Zero Surcharge Calculation in Middleware or SAP:</strong> Neither SAP Business One nor the API middleware calculates surcharges, markups, freight premiums, or custom pricing adjustments. SAP simply records the exact confirmed unit price received from Komatsu.</li>
        <li><strong>Deterministic 1:1 Document Mapping:</strong> Every confirmed Komatsu Sales Order (SO) creates exactly one standard Purchase Order in SAP B1 via the Service Layer REST API (<code>POST /b1s/v1/PurchaseOrders</code>).</li>
      </ul>
    </div>

    <h2 class="section-title">3. End-to-End System Architecture Flow</h2>
    <p>
      The workflow establishes an automated, auditable chain of custody from field technician requisition to SAP general ledger commitment:
    </p>

    <div class="flow-diagram">
      <div class="flow-step">
        <div class="flow-step-num">1</div>
        <div class="flow-step-title">Parts Entry</div>
        <div class="flow-step-desc">Enter part numbers &amp; requested quantities from maintenance.</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
        <div class="flow-step-num" style="background: #0284c7;">2</div>
        <div class="flow-step-title" style="color: #0369a1;">PDX Inquiry</div>
        <div class="flow-step-desc">Real-time stock check (Dubai KME physical stock vs factory).</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step" style="border-color: #f59e0b; background: #fffbeb;">
        <div class="flow-step-num" style="background: #f59e0b;">3</div>
        <div class="flow-step-title" style="color: #92400e;">Komatsu Split</div>
        <div class="flow-step-desc">Splits per manufacturer rules: Stock vs Emergency caps.</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step" style="border-color: #10b981; background: #ecfdf5;">
        <div class="flow-step-num" style="background: #10b981;">4</div>
        <div class="flow-step-title" style="color: #065f46;">Komatsu SO</div>
        <div class="flow-step-desc">Batch quotation approval converts to confirmed SOs with USD prices.</div>
      </div>
      <div class="flow-arrow">&rarr;</div>
      <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
        <div class="flow-step-num" style="background: #0284c7;">5</div>
        <div class="flow-step-title" style="color: #0369a1;">Uniform SAP PO</div>
        <div class="flow-step-desc"><code>POST /b1s/v1/PurchaseOrders</code> (Direct unit price entry).</div>
      </div>
    </div>

    <div class="grid-2col">
      <div class="feature-card">
        <h4>Strict Separation of Concerns</h4>
        <p>The EQP system handles all Komatsu OEM logistics logic, distributor sequencing (<code>R.../2026</code>), and multi-chassis quota allocation upstream, shielding SAP B1 from operational complexity.</p>
      </div>
      <div class="feature-card">
        <h4>Auditability &amp; Ledger Integrity</h4>
        <p>By capturing native manufacturer pricing and vendor order identifiers at origin, every purchase order maintains unbroken traceability through warehouse receipt to financial invoice settlement.</p>
      </div>
    </div>

    <div class="callout callout-blue" style="margin-top: 5px;">
      <span class="callout-title">Summary for ABS Integration Engineers:</span>
      SAP Business One acts exclusively as the authoritative financial ledger and inventory repository. No custom business logic, document types, or price recalculation rules are required inside SAP B1.
    </div>
  </div>

  <!-- ================= PAGE 2: WHY ORDERS ARE SPLIT & FINANCIAL RECONCILIATION ================= -->
  <div class="pdf-page" id="page-2">
    <h2 class="section-title">4. Operational Constraint: Why Orders Are Split on Komatsu PDX</h2>
    <p>
      In standard enterprise ERP configurations, ordering 50 units of a spare part is recorded as a single purchase requisition line. However, the <strong>Komatsu Middle East PDX Portal</strong> enforces strict manufacturer routing and anti-hoarding policies designed to safeguard factory inventory across the Middle East. Consequently, our EQP procurement middleware must partition requisitions into distinct sub-orders before submission.
    </p>

    <div class="callout callout-blue">
      <span class="callout-title">Crucial Distinction for the ABS Consulting Team:</span>
      <strong>Order splitting is strictly an external Komatsu manufacturer policy constraint, NOT an internal SAP data modeling requirement.</strong> Sub-order generation and machine allocation exist solely to comply with Komatsu PDX portal validation rules prior to order submission. Once Komatsu approves and confirms the sub-orders, each Sales Order maps cleanly 1:1 into standard SAP Purchase Orders.
    </div>

    <h3 class="subsection-title">Fulfillment Channels Comparison: Normal Daily Stock (DS/SO) vs. Emergency Breakdown (EO)</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 22%;">Operational Dimension</th>
          <th style="width: 39%;">Normal Daily Stock (<span class="badge-ds">DS</span> / <span class="badge-ds">SO</span>)</th>
          <th style="width: 39%;">Emergency Breakdown (<span class="badge-eo">EO</span>)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Physical Inventory Sourcing</strong></td>
          <td>Fulfilled directly from KME Dubai central distribution warehouse inventory.</td>
          <td>Sourced from Komatsu Ltd. (KLTD) Japan factory or global emergency reserve.</td>
        </tr>
        <tr>
          <td><strong>Ordering Quotas &amp; Caps</strong></td>
          <td><strong>Uncapped bulk ordering.</strong> No maximum line-item limits imposed by Komatsu.</td>
          <td><strong>Strictly capped per chassis serial.</strong> Komatsu restricts maximum quantity per machine (e.g., max 20 units/chassis) to prevent distributor stockpiling.</td>
        </tr>
        <tr>
          <td><strong>Equipment &amp; Asset Binding</strong></td>
          <td><strong>No machine or customer required.</strong> Treated as general inventory replenishment.</td>
          <td><strong>Mandatory equipment binding.</strong> Must specify verified machine model (e.g. <code>PC500LC-10R</code>) and valid chassis serial (e.g. <code>100433</code>).</td>
        </tr>
        <tr>
          <td><strong>Unit Pricing Mechanism</strong></td>
          <td>Base catalogue distributor rate, computed natively by Komatsu PDX.</td>
          <td>Emergency rate, computed natively by Komatsu PDX directly on the unit price.</td>
        </tr>
        <tr>
          <td><strong>Distributor Reference</strong></td>
          <td>Sequential distributor reference number (e.g., <code>R229/2026</code>).</td>
          <td>Sequential distributor reference numbers (e.g., <code>R230/2026</code>, <code>R231/2026</code>).</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">5. Concrete Walkthrough: Requisition for 50 EA Fuel Filters (Part 600-311-6742)</h2>
    <p>
      When field maintenance requests 50 fuel filters, the EQP system checks live PDX inventory and automatically executes a hybrid split across channels:
    </p>

    <div class="ui-mock-box">
      <div class="ui-mock-header">
        <span>Requisition: 50 EA &bull; Fuel Filter (600-311-6742)</span>
        <span>Komatsu PDX Status: KME Dubai Stock: 10 EA | Factory Shortage: 40 EA</span>
      </div>
      <div style="font-size: 7.4pt; color: #334155; line-height: 1.45;">
        <p style="margin-bottom: 3px;"><strong>&bull; Sub-Order #1 (<span class="badge-ds">DS Stock</span>) &bull; Ref <code>R229/2026</code>:</strong> 10 units fulfilled from Dubai physical stock &rarr; No machine required &rarr; Converted to <strong>Komatsu SO #0000278046</strong> at confirmed catalogue price &rarr; <strong>Triggers SAP PO #1</strong>.</p>
        <p style="margin-bottom: 3px;"><strong>&bull; Sub-Order #2 (<span class="badge-eo">EO Emergency</span>) &bull; Ref <code>R230/2026</code>:</strong> 20 units assigned to Excavator Chassis <code>100433</code> (capped at 20) &rarr; Converted to <strong>Komatsu SO #0000278047</strong> at confirmed PDX price &rarr; <strong>Triggers SAP PO #2</strong>.</p>
        <p style="margin-bottom: 0;"><strong>&bull; Sub-Order #3 (<span class="badge-eo">EO Emergency</span>) &bull; Ref <code>R231/2026</code>:</strong> 20 units assigned to Excavator Chassis <code>100434</code> (capped at 20) &rarr; Converted to <strong>Komatsu SO #0000278048</strong> at confirmed PDX price &rarr; <strong>Triggers SAP PO #3</strong>.</p>
      </div>
    </div>

    <h2 class="section-title">6. Financial Reconciliation &amp; Three-Way Matching Governance</h2>
    <div class="callout callout-emerald">
      <span class="callout-title">Flawless Accounting &amp; Warehouse Reconciliation in SAP Business One:</span>
      Each resulting SAP Purchase Order stores the exact Komatsu Sales Order Number in <code>NumAtCard</code> and <code>U_KomatsuSO</code>.<br>
      When Komatsu Middle East ships the goods, their shipping documents and commercial invoices correspond 1:1 with individual Komatsu SOs:
      <ul style="margin-top: 3px;">
        <li><strong>Goods Receipt PO (GRPO):</strong> Warehouse staff receive incoming parts in SAP B1 against the specific PO referencing Komatsu's shipping packing slip and delivery note.</li>
        <li><strong>A/P Invoice 3-Way Matching:</strong> Accounts Payable matches Komatsu's USD commercial invoice against the GRPO and PO with zero price variance, because SAP recorded the exact confirmed unit price certified by Komatsu.</li>
        <li><strong>Currency Realization:</strong> Foreign currency liability is recognized at transaction time, eliminating downstream ledger adjustments and manual credit memo reconciliations.</li>
      </ul>
    </div>
  </div>

  <!-- ================= PAGE 3: OPERATIONAL WORKFLOW PHASE I ================= -->
  <div class="pdf-page" id="page-3">
    <h2 class="section-title">7. Operational Workflow Phase I: Part Entry &amp; Fleet Allocation</h2>

    <h3 class="subsection-title">Step 1: Part Entry, Real-Time Master Stock &amp; Allocation</h3>
    <p>
      The maintenance engineer enters requested part numbers. The EQP engine verifies them against the Komatsu catalogue master, displays live inventory badges (<span class="badge-kme">KME Stock</span> in Dubai, <span class="badge-eo">EOR</span> emergency restriction, <span class="badge-ds">KLTD</span> factory stock), and calculates available quantities versus emergency shortage.
    </p>

    <div class="figure-card">
      <img src="${img1}" alt="Step 1: Requested Parts and Item Types" style="max-height: 235px; width: auto;" />
      <div class="figure-caption">Figure 1: Part Entry table showing catalogue verification (Verified Genuine PC500LC-10), unit prices, and line-item quantity breakdowns.</div>
    </div>

    <h3 class="subsection-title">Step 2: Target Fleet &amp; Multi-SN Allocation (Emergency Orders Only)</h3>
    <p>
      When items route through the Emergency breakdown channel, the dispatcher selects the target customer account (e.g. <em>Laala Al-Kuwait Real Estate Co.</em>) and selects compatible heavy equipment chassis serials (e.g. <em>PC500LC-10R</em> pool). For 100% Stock orders, machine allocation is completely bypassed.
    </p>

    <div class="figure-card">
      <img src="${img2}" alt="Step 2: Fleet Allocation and Sequence Setup" style="max-height: 245px; width: auto;" />
      <div class="figure-caption">Figure 2: Active Machine Pool Selection (filtered for compatible equipment) and continuous distributor reference setup (Starting DB Order No: <code>R229/2026</code>).</div>
    </div>

    <div class="callout callout-blue">
      <span class="callout-title">Automated Dispatch Preparation &amp; Dry-Run Simulation:</span>
      The system calculates estimated quotation counts and order values in real-time, allowing operators to run dry-run simulations before dispatching live records to Komatsu PDX. This guarantees full data validation prior to external transmission.
    </div>
  </div>

  <!-- ================= PAGE 4: OPERATIONAL WORKFLOW PHASE II ================= -->
  <div class="pdf-page" id="page-4">
    <h2 class="section-title">8. Operational Workflow Phase II: Planned Unified Quotations Manifest</h2>

    <h3 class="subsection-title">Step 3: Planned Unified Quotations Manifest &amp; Live Dispatch Queue</h3>
    <p>
      The EQP splitting engine bundles line items across assigned excavator chassis into unified distributor quotations within Komatsu sub-order caps. Each sub-order receives a sequential distributor reference number (<code>R229/2026</code> through <code>R238/2026</code>) ensuring continuous audit numbering.
    </p>

    <div class="figure-card">
      <img src="${img3}" alt="Step 3: Planned Unified Quotations and Live Dispatch Queue" style="max-height: 480px; width: auto;" />
      <div class="figure-caption">Figure 3: Planned Unified Quotations Manifest showing 10 sub-orders generated across 2 requested parts (22 units) assigned to excavators.</div>
    </div>

    <h3 class="subsection-title">Queue Structure &amp; Dispatch Governance Controls</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 20%;">Queue Attribute</th>
          <th style="width: 30%;">Operational Implementation</th>
          <th style="width: 50%;">Governance &amp; Audit Functionality</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>DB Order Number</strong></td>
          <td>Sequential format: <code>R&lt;Seq&gt;/2026</code></td>
          <td>Ensures non-gapping, continuous audit tracking across distributor submissions.</td>
        </tr>
        <tr>
          <td><strong>Target Asset Binding</strong></td>
          <td>Chassis SN + Model + Customer Account</td>
          <td>Enforces Komatsu's manufacturer requirement for emergency breakdown allocation.</td>
        </tr>
        <tr>
          <td><strong>Bundled Part Lines</strong></td>
          <td>Multi-part bundling per quote (e.g. 2 Hoses)</td>
          <td>Maximizes shipping efficiency and minimizes individual sub-order transaction count.</td>
        </tr>
        <tr>
          <td><strong>Export &amp; Audit Tools</strong></td>
          <td>CSV Export &bull; SAP Excel Export &bull; Audit Logs</td>
          <td>Provides immediate offline backup and full dispatch traceability for procurement supervisors.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-emerald" style="margin-top: 6px;">
      <span class="callout-title">Batch Dispatch Resilience:</span>
      The live dispatch queue provides granular inspection of each sub-order prior to execution, preventing accidental submissions and ensuring strict compliance with Komatsu Middle East ordering quotas.
    </div>
  </div>

  <!-- ================= PAGE 5: OPERATIONAL WORKFLOW PHASE III ================= -->
  <div class="pdf-page" id="page-5">
    <h2 class="section-title">9. Operational Workflow Phase III: Quotation-to-SO Conversion &amp; SAP Trigger</h2>

    <h3 class="subsection-title">Step 4: Komatsu Quotation to Sales Order (SO) Converter</h3>
    <p>
      Once submitted to Komatsu PDX, the portal confirms the sub-orders with official Komatsu Quotation Numbers (e.g. <code>0000282871</code>). The EQP procurement interface enables 1-Click batch conversion to certified <strong>Komatsu Sales Orders (SO)</strong> (e.g. <code>SO #0000278046</code>) carrying binding USD purchase prices.
    </p>

    <div class="figure-card">
      <img src="${img4}" alt="Step 4: Komatsu Quotation to Sales Order Converter and SAP PO Trigger" style="max-height: 440px; width: auto;" />
      <div class="figure-caption">Figure 4: Komatsu Quotation to Sales Order Converter showing official Komatsu SO numbers and the target "Create SAP PO" action button.</div>
    </div>

    <h3 class="subsection-title">The Exact SAP Integration Execution Trigger</h3>
    <div class="callout callout-emerald">
      <span class="callout-title">Direct Service Layer Execution Lifecycle:</span>
      At this stage, the Komatsu Sales Order is officially confirmed with certified USD pricing. Clicking <strong>"Create SAP PO"</strong> initiates the following automated sequence:
      <ol style="margin-top: 3px;">
        <li><strong>Payload Serialization:</strong> Middleware packages confirmed part numbers, quantities, certified unit prices, and tracking references into a standard Service Layer JSON document.</li>
        <li><strong>Service Layer Call:</strong> Sends <code>POST /b1s/v1/PurchaseOrders</code> to SAP Business One.</li>
        <li><strong>Response &amp; Persistence:</strong> On HTTP 201 Created, SAP returns the official <code>DocNum</code> (e.g., <code>20260481</code>) and <code>DocEntry</code>, which are permanently written to the database.</li>
        <li><strong>Idempotency Lock:</strong> The button updates to <strong>"SAP PO #20260481 &check;"</strong> and locks permanently, eliminating duplicate document creation.</li>
      </ol>
    </div>

    <div class="callout callout-blue" style="margin-top: 5px;">
      <span class="callout-title">Error Handling &amp; Retry Resilience:</span>
      In the event of network timeouts or temporary Service Layer unavailability, the system captures full diagnostic logs, preserves the quotation state, and permits single-click retry without risk of duplicate PO creation.
    </div>
  </div>

  <!-- ================= PAGE 6: TECHNICAL API SPECIFICATION FOR ABS ================= -->
  <div class="pdf-page" id="page-6">
    <h2 class="section-title">10. Technical API Specification for the ABS / SAP Team</h2>
    <p>
      Direct creation of Purchase Orders in SAP Business One will be executed via the <strong>SAP Business One Service Layer</strong> (REST / OData v4) over HTTPS (TLS 1.3), utilizing standard session-based authentication (<code>B1SESSION</code> + <code>ROUTEID</code>).
    </p>

    <h3 class="subsection-title">A. Header Field Mapping (Table: <code>OPOR</code> / Entity: <code>PurchaseOrders</code>)</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 17%;">SAP Field</th>
          <th style="width: 14%;">DB Field</th>
          <th style="width: 22%;">SAP Description</th>
          <th style="width: 25%;">Source from EQP System</th>
          <th style="width: 22%;">Example Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>CardCode</code></td>
          <td><code>CardCode</code></td>
          <td>Vendor Code</td>
          <td>Komatsu Middle East Vendor Code</td>
          <td><code>"V000006"</code></td>
        </tr>
        <tr>
          <td><code>DocDate</code></td>
          <td><code>DocDate</code></td>
          <td>Posting Date</td>
          <td>Order Date (YYYY-MM-DD)</td>
          <td><code>"2026-10-05"</code></td>
        </tr>
        <tr>
          <td><code>DocDueDate</code></td>
          <td><code>DocDueDate</code></td>
          <td>Delivery Due Date</td>
          <td>Required Delivery Date</td>
          <td><code>"2026-10-12"</code></td>
        </tr>
        <tr>
          <td><code>DocCurrency</code></td>
          <td><code>DocCur</code></td>
          <td>Document Currency</td>
          <td>Komatsu Billed Currency</td>
          <td><code>"USD"</code></td>
        </tr>
        <tr>
          <td><code>NumAtCard</code></td>
          <td><code>NumAtCard</code></td>
          <td>BP Reference No</td>
          <td>Komatsu SO Number + DB Ref</td>
          <td><code>"SO #0000278046 / R229/2026"</code></td>
        </tr>
        <tr>
          <td><code>Comments</code></td>
          <td><code>Comments</code></td>
          <td>Document Remarks</td>
          <td>Order context &amp; reference notes</td>
          <td><code>"Komatsu Ref: R229/2026 | Quote: 0000282871"</code></td>
        </tr>
        <tr>
          <td><code>U_KomatsuSO</code></td>
          <td><code>U_KomatsuSO</code></td>
          <td>UDF: Komatsu SO No</td>
          <td>Official Komatsu Sales Order No</td>
          <td><code>"0000278046"</code></td>
        </tr>
        <tr>
          <td><code>U_KomatsuQuote</code></td>
          <td><code>U_KomatsuQuote</code></td>
          <td>UDF: Komatsu Quote No</td>
          <td>Official Komatsu Quotation No</td>
          <td><code>"0000282871"</code></td>
        </tr>
        <tr>
          <td><code>U_MachineSerial</code></td>
          <td><code>U_MachineSerial</code></td>
          <td>UDF: Machine Serial</td>
          <td>Asset Serial (if EO) or blank (Stock)</td>
          <td><code>"100433"</code> <em>(or null)</em></td>
        </tr>
        <tr>
          <td><code>U_MachineModel</code></td>
          <td><code>U_MachineModel</code></td>
          <td>UDF: Machine Model</td>
          <td>Equipment Model (if EO) or blank</td>
          <td><code>"PC500LC-10R"</code> <em>(or null)</em></td>
        </tr>
      </tbody>
    </table>

    <h3 class="subsection-title">B. Line Item Field Mapping (Table: <code>POR1</code> / Entity: <code>DocumentLines</code>)</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 17%;">SAP Field</th>
          <th style="width: 14%;">DB Field</th>
          <th style="width: 22%;">SAP Description</th>
          <th style="width: 25%;">Source from EQP System</th>
          <th style="width: 22%;">Example Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ItemCode</code></td>
          <td><code>ItemCode</code></td>
          <td>Item Number</td>
          <td>Genuine Komatsu Part Number</td>
          <td><code>"600-311-6742"</code></td>
        </tr>
        <tr>
          <td><code>ItemDescription</code></td>
          <td><code>Dscription</code></td>
          <td>Item Description</td>
          <td>Part Description from Komatsu Master</td>
          <td><code>"FUEL FILTER"</code></td>
        </tr>
        <tr>
          <td><code>Quantity</code></td>
          <td><code>Quantity</code></td>
          <td>Quantity</td>
          <td>Confirmed order line quantity</td>
          <td><code>10.00</code></td>
        </tr>
        <tr>
          <td><code>UnitPrice</code></td>
          <td><code>Price</code></td>
          <td>Unit Price (USD)</td>
          <td><strong>Confirmed unit price directly from Komatsu SO</strong></td>
          <td><code>25.00</code></td>
        </tr>
        <tr>
          <td><code>WarehouseCode</code></td>
          <td><code>WhsCode</code></td>
          <td>Warehouse</td>
          <td>Receiving Warehouse</td>
          <td><code>"003"</code> <em>(or per ABS)</em></td>
        </tr>
        <tr>
          <td><code>TaxCode</code></td>
          <td><code>TaxCode</code></td>
          <td>Tax Code</td>
          <td>Import Zero / Exempt Tax Code</td>
          <td><code>"P0"</code> <em>(or per ABS)</em></td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue">
      <span class="callout-title">Currency Valuation &amp; Foreign Exchange Integrity:</span>
      Specifying <code>DocCurrency: "USD"</code> ensures SAP Business One records vendor liability in foreign currency (USD) while automatically calculating book values in Kuwaiti Dinar (KWD) based on SAP's official daily exchange rate table (<code>ORTT</code>). Financial ledger integrity is preserved without custom scripting.
    </div>

    <div class="callout callout-emerald" style="margin-top: 5px;">
      <span class="callout-title">Session Management &amp; Authentication Protocol:</span>
      The middleware performs automated session logon via <code>POST /b1s/v1/Login</code>, manages HTTP cookies (<code>B1SESSION</code> and <code>ROUTEID</code>), pools active sessions across requests, and automatically handles re-authentication if an expired session token is encountered.
    </div>
  </div>

  <!-- ================= PAGE 7: JSON PAYLOADS & ACTION ITEMS FOR ABS ================= -->
  <div class="pdf-page" id="page-7">
    <h2 class="section-title">11. Service Layer Payload Contract &amp; Item Master Protocol</h2>

    <h3 class="subsection-title">Standard Request (<code>POST /b1s/v1/PurchaseOrders</code>) &amp; Response Contract</h3>
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

    <div style="display: flex; gap: 8px; margin: 4px 0;">
      <div style="flex: 1;">
        <p style="font-size: 7.2pt; font-weight: 700; color: #065f46; margin-bottom: 2px;">Expected SAP Response (HTTP 201 Created):</p>
        <pre class="code-block" style="margin: 0;">{
  "DocEntry": 14205,
  "DocNum": 20260481,
  "DocDate": "2026-10-05",
  "CardCode": "V000006",
  "DocTotal": 250.00,
  "DocCurrency": "USD"
}</pre>
      </div>
      <div style="flex: 1.2;">
        <p style="font-size: 7.2pt; font-weight: 700; color: #0369a1; margin-bottom: 2px;">Item Master Data Handling (<code>OITM</code>):</p>
        <p style="font-size: 7.1pt; color: #475569; line-height: 1.38;">
          With over 500,000 Komatsu part numbers, occasionally a requested item is not yet registered in SAP B1. The EQP middleware checks <code>GET /b1s/v1/Items('{ItemCode}')</code> prior to PO creation. If HTTP 404 is returned, our API automatically provisions the item via <code>POST /b1s/v1/Items</code> using verified Komatsu catalogue data before dispatching the PO.
        </p>
      </div>
    </div>

    <h2 class="section-title">12. Actionable Alignment Checklist &amp; RFC Questions for ABS</h2>
    <ol style="margin-left: 14px;">
      <li>
        <strong>Service Layer Endpoint URL &amp; Connectivity:</strong><br>
        Please provide the official Service Layer URL (e.g. <code>https://sap.daralhai.com:50000/b1s/v1/</code>) and confirm firewall whitelisting for the EQP backend IP.
      </li>
      <li>
        <strong>Dedicated Technical API User:</strong><br>
        We request a dedicated API service user (e.g. <code>B1_API_EQP</code>) with permissions restricted to <code>PurchaseOrders</code> (Create/Read) and <code>Items</code> (Read/Create) to avoid reliance on named user accounts.
      </li>
      <li>
        <strong>Handling New Part Numbers (Item Master <code>OITM</code>):</strong><br>
        With over 500,000 Komatsu parts in the catalogue, occasionally a component does not yet exist in SAP B1. What is ABS's preferred procedure?
        <ul style="margin-top: 2px;">
          <li><em>Option 1 (Recommended):</em> Allow our API to auto-create missing parts via <code>POST /b1s/v1/Items</code> using Komatsu catalogue master data before creating the PO.</li>
          <li><em>Option 2:</em> Use a standard non-inventory item master with explicit line-item descriptions.</li>
        </ul>
      </li>
      <li>
        <strong>Document Status Workflow (Active PO vs. Draft):</strong><br>
        Should the API create approved open POs (<code>PurchaseOrders</code>) directly, or create Drafts (<code>PurchaseOrderDrafts</code>) for accounting verification during the initial sandbox pilot?
      </li>
      <li>
        <strong>Warehouse &amp; Tax Defaults Confirmation:</strong><br>
        Please confirm that receiving Warehouse Code <code>003</code> and Tax Code <code>P0</code> (0% import tax) are the appropriate system defaults for Vendor <code>V000006</code>.
      </li>
      <li>
        <strong>User-Defined Field (UDF) Setup:</strong><br>
        Please confirm if user-defined fields (<code>U_KomatsuSO</code>, <code>U_KomatsuQuote</code>, <code>U_MachineSerial</code>, <code>U_MachineModel</code>) are already configured on <code>OPOR</code>, or if ABS will provision them.
      </li>
    </ol>

    <div class="callout callout-emerald" style="margin-top: 5px;">
      <span class="callout-title">Testing SLA &amp; Next Steps:</span>
      Upon receipt of ABS sandbox credentials, EQP engineering will execute end-to-end test transactions within 24 hours to validate bidirectional document generation and trace logging.
    </div>
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
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">Dar Al Hai &bull; Komatsu Parts Procurement &amp; SAP B1 PO API Integration Guide</div>',
    footerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;">Confidential &bull; Prepared for ABS Consulting &bull; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF successfully created at:', outputPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
