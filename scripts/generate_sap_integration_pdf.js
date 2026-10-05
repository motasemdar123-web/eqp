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
  <title>Dar Al Hai — Komatsu Parts Procurement &amp; SAP Business One Integration Specification</title>
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
      line-height: 1.44;
      font-size: 8.2pt;
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
      overflow: hidden;
    }

    .pdf-page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }

    /* Header Banner */
    .header-banner {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .org-badge {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0369a1;
      background: #e0f2fe;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }

    h1.doc-title {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.22;
      margin-bottom: 3px;
      letter-spacing: -0.2px;
    }

    p.doc-subtitle {
      font-size: 8.1pt;
      color: #475569;
      font-weight: 500;
      line-height: 1.35;
    }

    /* Metadata Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6.5px 10px;
      margin-bottom: 8px;
      font-size: 7.4pt;
    }

    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 6.3pt;
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
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      border-left: 3.5px solid #0284c7;
      padding-left: 8px;
      margin-top: 8px;
      margin-bottom: 4.5px;
      page-break-after: avoid;
    }

    h3.subsection-title {
      font-size: 8.4pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 6px;
      margin-bottom: 3px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 4.5px;
      color: #334155;
      font-size: 7.9pt;
      line-height: 1.42;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 6px;
      padding: 7px 10px;
      margin: 5.5px 0;
      font-size: 7.7pt;
      border-left: 3.5px solid;
      page-break-inside: avoid;
      line-height: 1.41;
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
      font-size: 8pt;
      margin-bottom: 2px;
    }

    /* Highlights 3-Card Grid */
    .metric-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 6px 0;
      page-break-inside: avoid;
    }

    .metric-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 8px;
      text-align: center;
    }

    .metric-val {
      font-size: 10pt;
      font-weight: 800;
      color: #0284c7;
      display: block;
      line-height: 1.2;
    }

    .metric-label {
      font-size: 6.5pt;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1.5px;
      display: block;
    }

    /* Architecture Flow Diagram */
    .flow-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin: 6px 0;
      padding: 6.5px 8px;
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
      padding: 5px 4px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .flow-step-num {
      display: inline-block;
      font-size: 6.5pt;
      font-weight: 700;
      background: #0284c7;
      color: #ffffff;
      width: 14px;
      height: 14px;
      line-height: 14px;
      border-radius: 50%;
      margin-bottom: 2px;
    }

    .flow-step-title {
      font-size: 6.9pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 1.5px;
    }

    .flow-step-desc {
      font-size: 6pt;
      color: #64748b;
      line-height: 1.2;
    }

    .flow-arrow {
      color: #94a3b8;
      font-size: 10pt;
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
      font-size: 6.6pt;
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
      font-size: 6.6pt;
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
      font-size: 6.6pt;
      font-weight: 700;
      display: inline-block;
      vertical-align: baseline;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0;
      font-size: 7.3pt;
      page-break-inside: avoid;
    }

    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
    }

    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 6.3pt;
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
      margin: 5px 0;
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
      font-size: 6.9pt;
      color: #475569;
      margin-top: 3.5px;
      font-style: italic;
      text-align: center;
    }

    /* UI Simulation Widget */
    .ui-mock-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 9px;
      margin: 5px 0;
      font-size: 7.3pt;
      page-break-inside: avoid;
    }

    .ui-mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 3.5px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 4px;
      font-weight: 700;
      color: #0f172a;
      font-size: 7.5pt;
    }

    /* Code & JSON block */
    pre.code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 6.7pt;
      padding: 7px 10px;
      border-radius: 5px;
      overflow-x: hidden;
      line-height: 1.34;
      margin: 5px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.5px 2.5px;
      border-radius: 3px;
    }

    ul, ol {
      margin-left: 14px;
      margin-bottom: 3.5px;
      font-size: 7.6pt;
    }

    li {
      margin-bottom: 2px;
      color: #334155;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin: 5px 0;
    }

    .grid-3col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin: 4.5px 0;
      page-break-inside: avoid;
    }

    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 5px 7.5px;
    }

    .feature-card h4 {
      font-size: 7.3pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .feature-card p {
      font-size: 6.9pt;
      color: #475569;
      margin-bottom: 0;
      line-height: 1.32;
    }

    .rfc-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0284c7;
      border-radius: 5px;
      padding: 5px 8.5px;
      margin-bottom: 5px;
      page-break-inside: avoid;
    }

    .rfc-item h4 {
      font-size: 7.7pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1.5px;
    }

    .rfc-item p {
      font-size: 7.4pt;
      color: #334155;
      margin-bottom: 1.5px;
      line-height: 1.36;
    }

    .rfc-item ul {
      margin-left: 14px;
      margin-top: 1.5px;
      margin-bottom: 0;
      font-size: 7.2pt;
    }

    .rfc-item li {
      margin-bottom: 1.5px;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: OPERATIONAL FLEET CONTEXT & INTEGRATION ARCHITECTURE ================= -->
  <div class="pdf-page" id="page-1">
    <div class="header-banner">
      <span class="org-badge">Dar Al Hai General Trading Co. W.L.L. &bull; Heavy Equipment Operations</span>
      <h1 class="doc-title">Komatsu Parts Procurement &amp; SAP Business One Integration Specification</h1>
      <p class="doc-subtitle">Operational Fleet Context, Komatsu PDX Manufacturer Ordering Rules, and Order Data Delivery Specification for ABS Consulting</p>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Target Partner</strong>
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
        <span>v3.0 (Operational RFC &amp; Data Manifest)</span>
      </div>
    </div>

    <h2 class="section-title">1. Operational Fleet Context: Mission-Critical Asset Management</h2>
    <p>
      Dar Al Hai General Trading operates a major heavy equipment fleet deployed across Kuwait's civil infrastructure, deep earthmoving, pipeline installation, and marine reclamation projects. The core operational fleet comprises heavy <strong>Komatsu hydraulic excavators</strong> (including <code>PC500LC-10R</code> and <code>PC400-8R</code>), high-tonnage crawler bulldozers (<code>D375A-6</code>), and heavy wheel loaders (<code>WA470-6</code>). In Kuwait's extreme operating conditions—where ambient summer temperatures consistently exceed 50&deg;C and abrasive desert silica dust accelerates component wear—heavy earthmoving assets operate on continuous multi-shift production cycles. Machine uptime directly governs critical infrastructure contract milestones.
    </p>
    <p>
      Maintenance and overhaul operations are centered at Dar Al Hai's <strong>Shuwaikh Central Maintenance Workshop</strong>, supported by the <strong>Sulaibiya Logistics Staging Depot</strong>. Genuine OEM replacement parts are procured directly from the regional manufacturer hub, <strong>Komatsu Middle East FZE (KME)</strong> in Dubai JAFZA, via their B2B digital portal (<strong>Komatsu PDX</strong>). In SAP Business One, Komatsu Middle East is registered as foreign Vendor <strong><code>V000006</code></strong>, transacting exclusively in <strong>US Dollars (USD)</strong>.
    </p>

    <div class="metric-strip">
      <div class="metric-box">
        <span class="metric-val">500,000+</span>
        <span class="metric-label">Komatsu Part Master Catalog</span>
      </div>
      <div class="metric-box">
        <span class="metric-val">100% Native</span>
        <span class="metric-label">Automated Pricing Passthrough</span>
      </div>
      <div class="metric-box">
        <span class="metric-val">Zero Clerical</span>
        <span class="metric-label">Dual Data Entry into SAP B1</span>
      </div>
    </div>

    <h2 class="section-title">2. Guiding Integration Philosophy: Respecting Domain Boundaries</h2>
    <div class="callout callout-emerald">
      <span class="callout-title">Guiding Principle for ABS Consultants &amp; Developers:</span>
      <strong>ABS are the recognized SAP Business One implementation experts. We do not dictate SAP internal database schemas, table structures, or system triggers.</strong><br>
      Our objective is to present our operational reality, manufacturer constraints, and the clean data manifests produced by our EQP procurement engine, then collaborate with ABS to determine the optimal delivery mechanism:
      <ul style="margin-top: 3px;">
        <li><strong>Native Manufacturer Pricing (Automatic Passthrough):</strong> The unit price generated by Komatsu PDX on each confirmed Sales Order represents the final, binding price. For Emergency Orders (<span class="badge-eo">EO</span>), Komatsu automatically embeds emergency rates directly into the line-item unit price. For Daily Stock (<span class="badge-ds">DS</span>), it applies catalogue distributor rates.</li>
        <li><strong>Zero Surcharge Calculation in Middleware or SAP:</strong> Neither SAP Business One nor the integration middleware calculates surcharges, markups, freight premiums, or custom pricing adjustments. SAP simply records the exact confirmed unit price certified by Komatsu.</li>
        <li><strong>Deterministic 1:1 Document Alignment:</strong> Every confirmed Komatsu Sales Order (SO) corresponds to exactly one standard Purchase Order in SAP B1.</li>
        <li><strong>Upstream Manufacturer Isolation:</strong> All Komatsu portal quirks, multi-chassis anti-hoarding limits, and sequential distributor references (<code>R.../2026</code>) are managed entirely inside EQP, shielding SAP B1 from operational complexity.</li>
      </ul>
    </div>

    <h3 class="subsection-title">Operational Responsibility Matrix</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Domain Area</th>
          <th style="width: 37%;">EQP Procurement Middleware (Dar Al Hai)</th>
          <th style="width: 38%;">SAP Business One (ABS Consulting Domain)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>OEM Portal Logistics</strong></td>
          <td>Komatsu PDX live inventory check, anti-hoarding quotas, chassis binding.</td>
          <td>Completely isolated from portal mechanics; receives verified order data.</td>
        </tr>
        <tr>
          <td><strong>Pricing &amp; Surcharges</strong></td>
          <td>Captures binding USD unit prices with emergency premiums pre-baked.</td>
          <td>Records exact certified unit prices; zero surcharge logic required in ERP.</td>
        </tr>
        <tr>
          <td><strong>Financial Ledger</strong></td>
          <td>Provides clean header &amp; line manifests with unbroken audit references.</td>
          <td>Authoritative book of accounts, inventory valuation, GRPO, and A/P matching.</td>
        </tr>
        <tr>
          <td><strong>System Governance</strong></td>
          <td>Manages quotation-to-SO lifecycle, retry queues, and idempotency locks.</td>
          <td>Governs purchasing approvals, warehouse receipts, and vendor ledger postings.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-title">3. End-to-End System Workflow Architecture</h2>
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
        <div class="flow-step-title" style="color: #0369a1;">SAP B1 Delivery</div>
        <div class="flow-step-desc">Structured manifest delivered to ABS-designated interface.</div>
      </div>
    </div>

    <div class="grid-2col">
      <div class="feature-card">
        <h4>Separation of Concerns: Upstream Shielding</h4>
        <p>The EQP system handles all Komatsu OEM logistics logic, distributor sequencing (<code>R.../2026</code>), and multi-chassis quota allocation upstream, shielding SAP B1 from operational complexity.</p>
      </div>
      <div class="feature-card">
        <h4>Ledger Integrity &amp; End-to-End Auditability</h4>
        <p>By capturing native manufacturer pricing and vendor order identifiers at origin, every purchase order maintains unbroken traceability through warehouse receipt to financial invoice settlement.</p>
      </div>
    </div>

    <div class="callout callout-blue" style="margin-top: 4px;">
      <span class="callout-title">Summary for ABS Integration Engineers:</span>
      SAP Business One acts exclusively as the authoritative financial ledger and inventory repository. No custom business logic, special document types, or price recalculation rules are required inside SAP B1.
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

    <h3 class="subsection-title">Manufacturer Allocation Logistics: Dubai JAFZA Hub vs. KLTD Japan Factory</h3>
    <p>
      Komatsu operates a two-tiered fulfillment strategy: fast-moving maintenance consumables are held at the regional distribution center in JAFZA (Dubai, UAE), whereas specialized mechanical, hydraulic, and structural assemblies are manufactured and held at Komatsu Ltd. (KLTD) factories in Japan. To ensure equitable parts distribution across GCC dealers and prevent speculative stockpiling, Komatsu strictly caps emergency order quantities per verified machine chassis serial.
    </p>

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
        <tr>
          <td><strong>Shipping &amp; Logistics Mode</strong></td>
          <td>Consolidated sea/land freight to Shuwaikh Workshop receiving bay.</td>
          <td>Expedited air freight directly to Kuwait International Airport clearance.</td>
        </tr>
        <tr>
          <td><strong>Target Delivery Due Date</strong></td>
          <td><strong>DS: 10 Days</strong> (Dubai stock) &bull; <strong>SO: 120 Days</strong> (Factory stock order)</td>
          <td><strong>EO: 30 Days</strong> (Emergency order turnaround)</td>
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
      <table class="data-table" style="margin: 3px 0 3px 0;">
        <thead>
          <tr>
            <th style="width: 12%;">Sub-Order</th>
            <th style="width: 11%;">Channel</th>
            <th style="width: 16%;">Source</th>
            <th style="width: 18%;">Asset Binding</th>
            <th style="width: 15%;">Komatsu SO #</th>
            <th style="width: 13%;">Unit Price</th>
            <th style="width: 15%;">SAP PO Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>R229/2026</code></td>
            <td><span class="badge-ds">DS Stock</span></td>
            <td>KME Dubai (10 EA)</td>
            <td>None (General Stock)</td>
            <td><code>SO #0000278046</code></td>
            <td>$25.00 <em>(Base)</em></td>
            <td><strong>Generates SAP PO #1</strong></td>
          </tr>
          <tr>
            <td><code>R230/2026</code></td>
            <td><span class="badge-eo">EO Emerg.</span></td>
            <td>KLTD Japan (20 EA)</td>
            <td>Excavator <code>100433</code></td>
            <td><code>SO #0000278047</code></td>
            <td>$28.75 <em>(EO Rate)</em></td>
            <td><strong>Generates SAP PO #2</strong></td>
          </tr>
          <tr>
            <td><code>R231/2026</code></td>
            <td><span class="badge-eo">EO Emerg.</span></td>
            <td>KLTD Japan (20 EA)</td>
            <td>Excavator <code>100434</code></td>
            <td><code>SO #0000278048</code></td>
            <td>$28.75 <em>(EO Rate)</em></td>
            <td><strong>Generates SAP PO #3</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 6.9pt; color: #475569; margin-top: 2.5px; margin-bottom: 0;">
        <strong>Pricing Passthrough Verification:</strong> Notice that the $28.75 emergency rate is computed natively by Komatsu PDX and certified directly on the Sales Order. Neither EQP nor SAP B1 performs surcharge calculations.
      </p>
    </div>

    <h2 class="section-title">6. Financial Reconciliation &amp; Three-Way Matching Governance</h2>
    <div class="callout callout-emerald">
      <span class="callout-title">Flawless Accounting &amp; Warehouse Reconciliation in SAP Business One:</span>
      Each resulting SAP Purchase Order captures the exact Komatsu Sales Order Number and Distributor Reference in SAP PO reference fields.<br>
      When Komatsu Middle East ships the goods, their shipping documents and commercial invoices correspond 1:1 with individual Komatsu SOs:
      <ul style="margin-top: 3px;">
        <li><strong>Goods Receipt PO (GRPO):</strong> Warehouse staff receive incoming parts in SAP B1 against the specific PO referencing Komatsu's shipping packing slip and delivery note.</li>
        <li><strong>A/P Invoice 3-Way Matching:</strong> Accounts Payable matches Komatsu's USD commercial invoice against the GRPO and PO with zero price variance, because SAP recorded the exact confirmed unit price certified by Komatsu.</li>
        <li><strong>Currency Realization:</strong> Foreign currency liability is recognized at transaction time, eliminating downstream ledger adjustments and manual credit memo reconciliations.</li>
      </ul>
    </div>

    <h3 class="subsection-title">Three-Way Matching Financial Workflow in SAP B1</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 20%;">ERP Process Stage</th>
          <th style="width: 25%;">Matching Reference Key</th>
          <th style="width: 30%;">Operational &amp; Financial Action</th>
          <th style="width: 25%;">Variance Governance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Purchase Order Creation</strong></td>
          <td>Komatsu SO # + Distributor Ref</td>
          <td>Encumbers budget commitment in foreign currency (USD).</td>
          <td>Zero variance; price is certified by OEM.</td>
        </tr>
        <tr>
          <td><strong>Goods Receipt PO (GRPO)</strong></td>
          <td>Komatsu Packing Slip / B/L</td>
          <td>Receives physical stock into Warehouse <code>003</code>.</td>
          <td>Validates quantity against packing slip.</td>
        </tr>
        <tr>
          <td><strong>A/P Invoice Verification</strong></td>
          <td>Komatsu Commercial Invoice</td>
          <td>Posts vendor liability in USD; converts to KWD book value.</td>
          <td>100% price match; zero credit memos.</td>
        </tr>
        <tr>
          <td><strong>Banking &amp; Settlement</strong></td>
          <td>SAP Outgoing Payment Ref</td>
          <td>Executes foreign currency telegraphic transfer to KME.</td>
          <td>Realizes FX difference natively in SAP.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ================= PAGE 3: OPERATIONAL WORKFLOW PHASE I ================= -->
  <div class="pdf-page" id="page-3">
    <h2 class="section-title">7. Operational Workflow Phase I: Part Entry &amp; Fleet Allocation</h2>

    <h3 class="subsection-title">Step 1: Part Entry, Real-Time Master Stock &amp; Allocation</h3>
    <p>
      The maintenance engineer enters requested part numbers. The EQP engine verifies them against the Komatsu catalogue master, displays live inventory badges (<span class="badge-kme">KME Stock</span> in Dubai, <span class="badge-eo">EOR</span> emergency restriction, <span class="badge-ds">KLTD</span> factory stock), and automatically calculates available quantities versus emergency shortage. The system also verifies part supersession numbers, ensuring superseded items are seamlessly replaced with current genuine factory specifications.
    </p>

    <div class="grid-3col">
      <div class="feature-card">
        <h4>Genuine Verification</h4>
        <p>Validates part numbers instantly against the 500,000+ Komatsu catalogue master database.</p>
      </div>
      <div class="feature-card">
        <h4>Live Stock Partitioning</h4>
        <p>Distinguishes immediate Dubai JAFZA hub inventory from Japan factory lead-time items.</p>
      </div>
      <div class="feature-card">
        <h4>Supersession Control</h4>
        <p>Automatically flags superseded items and upgrades part numbers to current active revisions.</p>
      </div>
    </div>

    <div class="figure-card">
      <img src="${img1}" alt="Step 1: Requested Parts and Item Types" style="max-height: 250px; width: auto;" />
      <div class="figure-caption">Figure 1: Part Entry table showing catalogue verification (Verified Genuine PC500LC-10), unit prices, and line-item quantity breakdowns.</div>
    </div>

    <h3 class="subsection-title">Step 2: Target Fleet &amp; Multi-SN Allocation (Emergency Orders Only)</h3>
    <p>
      When items route through the Emergency breakdown channel, the dispatcher selects the target customer account (e.g. <em>Laala Al-Kuwait Real Estate Co.</em>) and selects compatible heavy equipment chassis serials (e.g. <em>PC500LC-10R</em> pool). Active equipment pools are filtered by machine model and maintenance schedule. For 100% Stock orders, machine allocation is completely bypassed.
    </p>

    <div class="grid-3col">
      <div class="feature-card">
        <h4>Active Fleet Pools</h4>
        <p>Filters compatible machinery by customer contract, model code, and active jobsite location.</p>
      </div>
      <div class="feature-card">
        <h4>Quota Balancing</h4>
        <p>Enforces Komatsu's strict chassis serial caps to prevent anti-hoarding portal submission errors.</p>
      </div>
      <div class="feature-card">
        <h4>Continuous Audit Keys</h4>
        <p>Maintains uninterrupted distributor reference sequencing (Starting DB Order No: <code>R229/2026</code>).</p>
      </div>
    </div>

    <div class="figure-card">
      <img src="${img2}" alt="Step 2: Fleet Allocation and Sequence Setup" style="max-height: 250px; width: auto;" />
      <div class="figure-caption">Figure 2: Active Machine Pool Selection (filtered for compatible equipment) and continuous distributor reference setup (Starting DB Order No: <code>R229/2026</code>).</div>
    </div>

    <div class="callout callout-blue" style="margin-top: 3px;">
      <span class="callout-title">Automated Dispatch Preparation &amp; Dry-Run Simulation:</span>
      The system calculates estimated quotation counts and order values in real-time, allowing operators to run dry-run simulations before dispatching live records to Komatsu PDX. This guarantees full data validation prior to external transmission, eliminating rejected orders and ensuring continuous distributor audit numbering.
    </div>
  </div>

  <!-- ================= PAGE 4: OPERATIONAL WORKFLOW PHASE II ================= -->
  <div class="pdf-page" id="page-4">
    <h2 class="section-title">8. Operational Workflow Phase II: Planned Unified Quotations Manifest</h2>

    <h3 class="subsection-title">Step 3: Planned Unified Quotations Manifest &amp; Live Dispatch Queue</h3>
    <p>
      The EQP splitting engine bundles line items across assigned excavator chassis into unified distributor quotations within Komatsu sub-order caps. Each sub-order receives a sequential distributor reference number (<code>R229/2026</code> through <code>R238/2026</code>) ensuring continuous audit numbering. This bundling optimizes freight efficiency and minimizes paperwork overhead.
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

    <div class="grid-2col" style="margin-top: 4px;">
      <div class="feature-card">
        <h4>Dry-Run Pre-Flight Validation</h4>
        <p>Simulates entire submission payloads to confirm chassis compatibility and quota adherence before transmitting to Komatsu Middle East.</p>
      </div>
      <div class="feature-card">
        <h4>Automated Re-Packaging Logic</h4>
        <p>If Komatsu adjusts line-item allocations, EQP re-packages affected orders seamlessly while maintaining distributor reference integrity.</p>
      </div>
    </div>

    <div class="callout callout-emerald" style="margin-top: 4px;">
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

    <h3 class="subsection-title">The SAP Order Delivery Execution Lifecycle</h3>
    <div class="callout callout-emerald">
      <span class="callout-title">Order Delivery &amp; Confirmation Lifecycle:</span>
      At this stage, the Komatsu Sales Order is officially confirmed with certified USD pricing. Clicking <strong>"Create SAP PO"</strong> initiates the following automated sequence:
      <ol style="margin-top: 3px;">
        <li><strong>Manifest Serialization:</strong> EQP middleware packages confirmed part numbers, quantities, certified unit prices, and tracking references into a structured order manifest.</li>
        <li><strong>Transmission to SAP B1:</strong> Data is dispatched to the integration interface defined and configured by ABS.</li>
        <li><strong>Response &amp; Persistence:</strong> Upon successful document creation in SAP, the returned SAP PO document number is recorded in the EQP database for complete auditability.</li>
        <li><strong>Idempotency Lock:</strong> The button updates to <strong>"SAP PO #[DocNum] &check;"</strong> and locks permanently, eliminating duplicate document creation.</li>
      </ol>
    </div>

    <h3 class="subsection-title">Integration State Machine &amp; Governance Statuses</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 22%;">System State</th>
          <th style="width: 23%;">UI Indicator</th>
          <th style="width: 55%;">Operational Behavior &amp; Safeguards</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>PDX_CONFIRMED</code></td>
          <td><span class="badge-ds">SO Confirmed</span></td>
          <td>Official Komatsu Sales Order confirmed with binding USD prices; ready for delivery to SAP.</td>
        </tr>
        <tr>
          <td><code>TRANSMITTING</code></td>
          <td><span class="badge-eo">Transmitting...</span></td>
          <td>Payload dispatched to ABS interface; retry lock engaged to prevent duplicate concurrent submissions.</td>
        </tr>
        <tr>
          <td><code>COMMITTED_IN_SAP</code></td>
          <td><span class="badge-kme">SAP PO #Confirmed &check;</span></td>
          <td>PO confirmed by SAP B1; official DocNum stored permanently; UI locked against duplicate posting.</td>
        </tr>
        <tr>
          <td><code>RETRY_QUEUED</code></td>
          <td><span class="badge-eo">Retry Pending</span></td>
          <td>Temporary network timeout captured; payload safely staged for one-click operator retry without data corruption.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-blue" style="margin-top: 4px;">
      <span class="callout-title">Enterprise Idempotency Protection &amp; Error Handling:</span>
      EQP utilizes unique idempotency hashing combining Vendor Code, Komatsu SO Number, and Distributor Reference. In the event of transient network failure or SAP endpoint unavailability, subsequent attempts cannot produce duplicate documents in SAP Business One.
    </div>
  </div>

  <!-- ================= PAGE 6: DATA MANIFEST PROVIDED BY EQP SYSTEM ================= -->
  <div class="pdf-page" id="page-6">
    <h2 class="section-title">10. EQP Order Data Manifest: Structured Data Delivered to SAP B1</h2>
    <p>
      For every confirmed Komatsu Sales Order, our EQP procurement engine produces a clean, validated, and complete order manifest. We do not prescribe internal SAP table structures or dictate database fields; rather, we provide our exact operational business data below so that ABS consultants can determine the optimal mapping and ingestion logic in SAP Business One.
    </p>

    <div class="callout callout-emerald">
      <span class="callout-title">Automatic Pricing Passthrough Guarantee:</span>
      <strong>All line-item unit prices supplied in this manifest are final, legally binding manufacturer prices certified directly by Komatsu Middle East.</strong> Surcharges (whether emergency breakdown premiums or standard catalogue rates) are already fully incorporated into the unit price by Komatsu PDX. No pricing recalculation, surcharge calculation, or freight markup logic is needed in the integration middleware or inside SAP B1.
    </div>

    <h3 class="subsection-title">A. Order Header Data Manifest</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 22%;">Business Field</th>
          <th style="width: 12%;">Data Type</th>
          <th style="width: 32%;">Operational Context &amp; Purpose</th>
          <th style="width: 17%;">Emergency Order</th>
          <th style="width: 17%;">Stock Order</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Vendor Code</strong></td>
          <td>String</td>
          <td>Komatsu Middle East vendor account in SAP</td>
          <td><code>"V000006"</code></td>
          <td><code>"V000006"</code></td>
        </tr>
        <tr>
          <td><strong>Komatsu SO No.</strong></td>
          <td>String</td>
          <td>Official confirmed Sales Order issued by Komatsu PDX</td>
          <td><code>"0000278047"</code></td>
          <td><code>"0000278046"</code></td>
        </tr>
        <tr>
          <td><strong>Distributor Ref No.</strong></td>
          <td>String</td>
          <td>Sequential distributor reference tracking number</td>
          <td><code>"R230/2026"</code></td>
          <td><code>"R229/2026"</code></td>
        </tr>
        <tr>
          <td><strong>Komatsu Quote No.</strong></td>
          <td>String</td>
          <td>Preceding quote reference issued by Komatsu portal</td>
          <td><code>"0000282872"</code></td>
          <td><code>"0000282871"</code></td>
        </tr>
        <tr>
          <td><strong>Fulfillment Channel</strong></td>
          <td>String</td>
          <td>Procurement channel (<span class="badge-eo">EO</span> vs <span class="badge-ds">DS</span>)</td>
          <td><code>"EMERGENCY"</code></td>
          <td><code>"STOCK"</code></td>
        </tr>
        <tr>
          <td><strong>Order Date / Due Date</strong></td>
          <td>Date (ISO)</td>
          <td>Order placement date &amp; target delivery date</td>
          <td><code>2026-10-05 &rarr; 2026-11-04 (30d)</code></td>
          <td><code>2026-10-05 &rarr; 2026-10-15 (10d)</code><br><span style="font-size: 6.8pt; color: #64748b;">(SO: +120d &rarr; 2027-02-02)</span></td>
        </tr>
        <tr>
          <td><strong>Currency</strong></td>
          <td>String (ISO)</td>
          <td>Billing currency for Komatsu Middle East</td>
          <td><code>"USD"</code></td>
          <td><code>"USD"</code></td>
        </tr>
        <tr>
          <td><strong>Equipment Serial</strong></td>
          <td>String / null</td>
          <td>Machine chassis serial (Mandatory for EO; null for Stock)</td>
          <td><code>"100433"</code></td>
          <td><code>null</code> <em>(Stock)</em></td>
        </tr>
        <tr>
          <td><strong>Equipment Model</strong></td>
          <td>String / null</td>
          <td>Equipment model code (e.g. <code>PC500LC-10R</code>)</td>
          <td><code>"PC500LC-10R"</code></td>
          <td><code>null</code> <em>(Stock)</em></td>
        </tr>
        <tr>
          <td><strong>Document Remarks</strong></td>
          <td>String</td>
          <td>Distributor reference tracking number</td>
          <td><code>"R230/2026"</code></td>
          <td><code>"R229/2026"</code></td>
        </tr>
      </tbody>
    </table>

    <h3 class="subsection-title">B. Line Items Data Manifest</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 7%;">Line</th>
          <th style="width: 18%;">OEM Part Number</th>
          <th style="width: 25%;">Part Description</th>
          <th style="width: 10%;">Qty</th>
          <th style="width: 15%;">Unit Price (USD)</th>
          <th style="width: 13%;">Line Total</th>
          <th style="width: 12%;">Suggested Whs</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><code>600-311-6742</code></td>
          <td>FUEL FILTER</td>
          <td>20.00</td>
          <td><strong>$28.75</strong> <em>(Certified EO)</em></td>
          <td>$575.00</td>
          <td><code>003</code> (Optional)</td>
        </tr>
        <tr>
          <td>2</td>
          <td><code>07000-12015</code></td>
          <td>O-RING</td>
          <td>5.00</td>
          <td><strong>$4.20</strong> <em>(Certified EO)</em></td>
          <td>$21.00</td>
          <td><code>003</code> (Optional)</td>
        </tr>
      </tbody>
    </table>

    <h3 class="subsection-title">C. Clean Order Manifest Structure (Sample JSON Provided by EQP System)</h3>
    <pre class="code-block">{
  "orderHeader": {
    "vendorCode": "V000006",
    "komatsuSalesOrderNo": "0000278047",
    "distributorRefNo": "R230/2026",
    "komatsuQuotationNo": "0000282872",
    "fulfillmentChannel": "EMERGENCY_ORDER",
    "orderDate": "2026-10-05",
    "deliveryDueDate": "2026-11-04",
    "currency": "USD",
    "targetEquipmentSerial": "100433",
    "targetEquipmentModel": "PC500LC-10R",
    "comments": "R230/2026"
  },
  "lineItems": [
    {
      "lineNumber": 1,
      "partNumber": "600-311-6742",
      "description": "FUEL FILTER",
      "quantity": 20.0,
      "unitPriceUSD": 28.75,
      "lineTotalUSD": 575.00,
      "suggestedWarehouse": "003",
      "suggestedTaxCode": "P0"
    }
  ]
}</pre>
    <p style="font-size: 6.9pt; color: #64748b; margin-top: 2px; margin-bottom: 0;">
      <em>Note on Warehouse and Tax Defaults:</em> Warehouse (<code>003</code> - Shuwaikh Central Workshop) and Tax Code (<code>P0</code> - 0% Import) can either be delivered in payload or determined natively by SAP B1 Business Partner defaulting rules, per ABS's guidance.
    </p>
  </div>

  <!-- ================= PAGE 7: CONSULTATIVE RFC & QUESTIONS FOR ABS ================= -->
  <div class="pdf-page" id="page-7">
    <h2 class="section-title">11. Consultative Technical Request for ABS Consulting (RFC)</h2>
    <p>
      ABS brings specialized domain expertise in Dar Al Hai's SAP Business One configuration, financial workflows, and database governance. We respect your architectural ownership of the SAP environment and invite your team to define how our EQP procurement engine should interface with SAP B1. Please review the following technical points and advise on your preferred approach:
    </p>

    <div class="rfc-item">
      <h4>1. Preferred Ingestion Architecture &amp; Communication Interface</h4>
      <p>How would ABS prefer our system to deliver confirmed order manifests to SAP B1?</p>
      <ul>
        <li><strong>Option A:</strong> Standard SAP B1 Service Layer REST API (direct HTTP POST from EQP backend).</li>
        <li><strong>Option B:</strong> Dedicated integration staging table with an automated SAP B1 transactional service.</li>
        <li><strong>Option C:</strong> ABS custom API connector or intermediate middleware gateway.</li>
      </ul>
    </div>

    <div class="rfc-item">
      <h4>2. Preferred Payload Schema &amp; Reference Field Mapping</h4>
      <p>Does ABS prefer our system to format payloads directly into a specific SAP B1 document structure, or would you prefer our clean JSON manifest shown on Page 6? Where should our tracking references (Komatsu SO #, Distributor Ref <code>R.../2026</code>, and Machine Chassis Serial) be stored in SAP Purchase Orders (e.g. BP Reference No., Remarks, or custom User-Defined Fields)?</p>
    </div>

    <div class="rfc-item">
      <h4>3. Item Master Onboarding Preference (Handling New Komatsu Part Numbers)</h4>
      <p>With over 500,000 Komatsu parts in the catalogue, occasionally a requested part is not yet registered in SAP B1. What is ABS's preferred procedure when an incoming order line references an unregistered part number?</p>
      <ul>
        <li><strong>Recommendation A:</strong> Provide an Item Master onboarding endpoint / capability allowing EQP to pre-create missing part numbers using verified Komatsu catalogue descriptions and item groups prior to PO generation.</li>
        <li><strong>Recommendation B:</strong> Map unregistered items to a designated non-stock / service item code with explicit line text descriptions.</li>
        <li><strong>Recommendation C:</strong> Queue unlinked items for purchasing officer review before PO creation.</li>
      </ul>
    </div>

    <div class="rfc-item">
      <h4>4. Dedicated API Service User &amp; Authentication Protocol</h4>
      <p>What authentication protocol does ABS recommend for our automated service (e.g. dedicated API service user credentials, session cookies, OAuth tokens)? We request a dedicated service user with scoped permissions to avoid dependence on individual employee accounts.</p>
    </div>

    <div class="rfc-item">
      <h4>5. Sandbox Connectivity &amp; Access Provisioning</h4>
      <p>Please provide sandbox/test environment access details (endpoint URL, test company database name, credentials, and firewall whitelisting requirements) so that connectivity and schema validation can begin.</p>
    </div>

    <h3 class="subsection-title">ABS Technical Configuration Matrix</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Integration Parameter</th>
          <th style="width: 22%;">Responsible Party</th>
          <th style="width: 28%;">Suggested Baseline</th>
          <th style="width: 25%;">ABS Specification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Ingestion Interface</strong></td>
          <td>ABS Consulting</td>
          <td>Service Layer / Staging / API</td>
          <td><em>[To be specified by ABS]</em></td>
        </tr>
        <tr>
          <td><strong>Endpoint URL &amp; Port</strong></td>
          <td>ABS Consulting</td>
          <td><code>https://sap.daralhai.com:[port]/...</code></td>
          <td><em>[To be provided by ABS]</em></td>
        </tr>
        <tr>
          <td><strong>Dedicated API User</strong></td>
          <td>ABS Consulting</td>
          <td>Scoped service account</td>
          <td><em>[To be provisioned by ABS]</em></td>
        </tr>
        <tr>
          <td><strong>Item Master Policy</strong></td>
          <td>Joint Technical Decision</td>
          <td>API Auto-creation (Rec. A)</td>
          <td><em>[ABS preferred method]</em></td>
        </tr>
      </tbody>
    </table>
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
    headerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">Dar Al Hai &bull; Komatsu Parts Procurement &amp; SAP B1 PO Integration Specification</div>',
    footerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;">Confidential &bull; Prepared for ABS Consulting (SAP B1 Team) &bull; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF successfully created at:', outputPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
