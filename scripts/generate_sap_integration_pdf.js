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
      line-height: 1.42;
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
      font-size: 15.5pt;
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
      margin-top: 12px;
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
      padding: 7px 11px;
      margin: 7px 0;
      font-size: 8pt;
      border-left: 3.5px solid;
      page-break-inside: avoid;
      line-height: 1.38;
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
      font-size: 6.8pt;
      padding: 7px 9px;
      border-radius: 5px;
      overflow-x: auto;
      line-height: 1.35;
      margin: 5px 0;
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

  <!-- ================= PAGE 1: EXECUTIVE BRIEF & DUAL-CHANNEL ARCHITECTURE ================= -->
  <div class="header-banner">
    <span class="org-badge">Dar Al Hai General Trading • Heavy Equipment Operations</span>
    <h1 class="doc-title">Parts Inquiry &amp; SAP Business One PO API Integration</h1>
    <p class="doc-subtitle">Extended Integration Guide: Normal Stock Orders (DS / SO), Emergency Orders (EO), and Automated Hybrid Routing</p>
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
      <span>v2.0 (Hybrid DS/SO + EO RFC)</span>
    </div>
  </div>

  <h2 class="section-title">1. Executive Summary &amp; Business Objective</h2>
  <p>
    Dar Al Hai is the authorized Komatsu equipment operator and service organization managing an extensive fleet of excavators, bulldozers, and heavy earthmoving machinery across major infrastructure projects in Kuwait. To maintain operational readiness and rapidly replenish replacement components, the Maintenance &amp; Spare Parts department orders directly from <strong>Komatsu Middle East (KME / PDX Portal)</strong>.
  </p>
  <p>
    The system now supports <strong>Dual-Channel Procurement</strong>:
  </p>
  <ul>
    <li><strong>Normal Stock Orders (<span class="badge-ds">DS</span> / <span class="badge-ds">SO</span>):</strong> Used for routine stock replenishment when components are physically in stock at KME Dubai warehouse. These orders carry <strong>0.00% surcharge</strong>, use <strong>DDU</strong> terms, and require <strong>no machine serial numbers or customer assignments</strong>.</li>
    <li><strong>Emergency Orders (<span class="badge-eo">EO</span>):</strong> Used for urgent breakdown recovery where parts are restricted or backordered. These orders require <strong>13.30% surcharge</strong>, use <strong>EXW</strong> terms, and strictly mandate <strong>genuine machine model &amp; serial binding</strong> with line-item caps.</li>
    <li><strong>Automated Hybrid Splitting:</strong> When an order contains high quantities, the EQP system automatically splits requested parts between available KME stock (<span class="badge-ds">DS</span>) and breakdown shortages (<span class="badge-eo">EO</span>).</li>
  </ul>

  <div class="callout callout-blue">
    <span class="callout-title">The Objective for the ABS (SAP Team):</span>
    We need to enable the EQP system to automatically create corresponding <strong>Purchase Orders (POs)</strong> in <strong>SAP Business One</strong> for Vendor <strong><code>V000006</code> (Komatsu Middle East)</strong> via the <strong>SAP B1 Service Layer (REST API)</strong>. Both Stock Orders (<span class="badge-ds">DS</span>/<span class="badge-ds">SO</span>) and Emergency Orders (<span class="badge-eo">EO</span>) must be recorded in SAP B1 with the appropriate commercial terms, surcharges, and machine metadata.
  </div>

  <h2 class="section-title">2. End-to-End System Architecture &amp; Hybrid Flow</h2>
  <p>
    The updated operational flow connects field requisitions directly to SAP Business One through an intelligent stock-routing engine:
  </p>

  <div class="flow-diagram">
    <div class="flow-step">
      <div class="flow-step-num">1</div>
      <div class="flow-step-title">Parts Entry</div>
      <div class="flow-step-desc">Enter part numbers &amp; total quantities required.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #0284c7; background: #f0f9ff;">
      <div class="flow-step-num" style="background: #0284c7;">2</div>
      <div class="flow-step-title" style="color: #0369a1;">Stock Inquiry</div>
      <div class="flow-step-desc">Query live PDX stock (KME Dubai, EOR, KLTD).</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #10b981; background: #ecfdf5;">
      <div class="flow-step-num" style="background: #10b981;">3</div>
      <div class="flow-step-title" style="color: #065f46;">Hybrid Routing</div>
      <div class="flow-step-desc">Split into DS (KME Stock) &amp; EO (Shortage/Fleet).</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step">
      <div class="flow-step-num">4</div>
      <div class="flow-step-title">Komatsu PDX</div>
      <div class="flow-step-desc">Submit sub-orders &amp; convert quotes to SOs.</div>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step" style="border-color: #f59e0b; background: #fffbeb;">
      <div class="flow-step-num" style="background: #f59e0b;">5</div>
      <div class="flow-step-title" style="color: #b45309;">SAP Service Layer</div>
      <div class="flow-step-desc"><code>POST /b1s/v1/PurchaseOrders</code> (DS &amp; EO POs).</div>
    </div>
  </div>

  <!-- ================= PAGE 2: COMMERCIAL POLICIES & ORDER MATRIX ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">3. Order Types &amp; Commercial Policies Matrix (Essential for SAP)</h2>
  <p>
    Komatsu PDX enforces radically different commercial terms and data requirements depending on the order type. SAP Business One must record each PO according to its specific classification:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 18%;">Feature / Dimension</th>
        <th style="width: 41%;">Normal Stock Orders (<span class="badge-ds">DS</span> / <span class="badge-ds">SO</span>)</th>
        <th style="width: 41%;">Emergency Orders (<span class="badge-eo">EO</span>)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Definition &amp; Purpose</strong></td>
        <td><strong>DS:</strong> Daily Stock Shipment • <strong>SO:</strong> Stock Order.<br>General warehouse replenishment.</td>
        <td><strong>EO:</strong> Emergency Order.<br>Urgent breakdown recovery for halted equipment.</td>
      </tr>
      <tr>
        <td><strong>Fulfilled From</strong></td>
        <td><strong>KME Stock</strong> (Dubai local warehouse physical stock).</td>
        <td><strong>KME EOR</strong> (Dubai restricted) or <strong>KLTD</strong> (Japan factory).</td>
      </tr>
      <tr>
        <td><strong>Premium Surcharge</strong></td>
        <td><strong>0.00% Premium</strong> (Base DNet catalogue pricing).</td>
        <td><strong>+13.30% Emergency Surcharge</strong> added to total line value.</td>
      </tr>
      <tr>
        <td><strong>Incoterms / Delivery</strong></td>
        <td><strong>DDU</strong> (Delivery Duty Unpaid — Delivered to Kuwait).</td>
        <td><strong>EXW</strong> (Ex Works — Picked up at KME PDC Dubai).</td>
      </tr>
      <tr>
        <td><strong>Machine Model &amp; Serial</strong></td>
        <td><strong>NOT REQUIRED</strong> (Model: Blank, Serial: Blank).<br>Komatsu PDX disables machine fields.</td>
        <td><strong>STRICTLY MANDATORY</strong> (e.g. Model <code>PC500LC-10R</code>, SN <code>100433</code>).<br>Chassis validated against Komatsu worldwide database.</td>
      </tr>
      <tr>
        <td><strong>Customer Account</strong></td>
        <td><strong>NOT REQUIRED / BLANK</strong> (General Stock).<br>Order belongs to dealership distributor account.</td>
        <td><strong>MANDATORY</strong> (e.g. <code>LAALA AL KUWAIT REAL ESTATE CO.</code>).</td>
      </tr>
      <tr>
        <td><strong>Line Item Caps</strong></td>
        <td><strong>NO CAP PER ITEM</strong> (e.g. 50 or 500 units allowed on 1 PO).</td>
        <td><strong>STRICTLY CAPPED</strong> (e.g. max 1, 2, or 5 EA per machine asset).</td>
      </tr>
      <tr>
        <td><strong>SAP Receiving Warehouse</strong></td>
        <td>Central General Spare Parts Warehouse (e.g. <code>001</code> / <code>003</code>).</td>
        <td>Project / Job-Site Breakdown Warehouse (e.g. <code>003</code> / Project).</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section-title">4. Real-World Hybrid Ordering Scenario: 50 Units Requested</h2>
  <p>
    Consider an engineer requesting <strong>50 units of Fuel Filter (Part <code>600-311-6742</code>)</strong>:
  </p>

  <div class="callout callout-amber">
    <span class="callout-title">The Problem if Ordered Purely via Emergency Channel (EO):</span>
    Komatsu caps Fuel Filters at <strong>20 units per machine</strong> on EO. Furthermore, placing 50 units on EO incurs an unnecessary <strong>13.30% premium surcharge</strong> across the entire batch, even on parts already sitting in Dubai!
  </div>

  <div class="callout callout-emerald">
    <span class="callout-title">The Intelligent EQP Hybrid Solution:</span>
    The EQP system checks live PDX availability:
    <ul style="margin-top: 3px;">
      <li><strong>KME Stock available:</strong> 10 units.</li>
      <li><strong>Remaining shortage:</strong> 40 units (factory backorder).</li>
    </ul>
    <strong>Automated Order Generation:</strong>
    <ol style="margin-top: 3px;">
      <li><strong>Sub-Order #1 (<span class="badge-ds">DS</span>) — Ref <code>R229/2026</code>:</strong> 10 units routed to Daily Stock. <strong>0% premium, DDU, no machine serial, no customer name</strong>. Consolidates into <strong>1 PO in SAP</strong>.</li>
      <li><strong>Sub-Order #2 (<span class="badge-eo">EO</span>) — Ref <code>R230/2026</code>:</strong> 20 units routed to Machine #1 (Model <code>PC500LC-10R</code>, SN <code>100433</code>). 13.3% premium, EXW. Generates <strong>1 PO in SAP</strong>.</li>
      <li><strong>Sub-Order #3 (<span class="badge-eo">EO</span>) — Ref <code>R231/2026</code>:</strong> 20 units routed to Machine #2 (Model <code>PC500LC-10R</code>, SN <code>100434</code>). 13.3% premium, EXW. Generates <strong>1 PO in SAP</strong>.</li>
    </ol>
    <strong>Financial Benefit:</strong> Dar Al Hai saves the 13.3% surcharge on the 10 local units and ensures 100% portal compliance without rejections.
  </div>

  <!-- ================= PAGE 3: STEP 1 & STEP 2 SCREENSHOTS & UI FLOW ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">5. Step-by-Step Functional Workflow &amp; UI Verification</h2>

  <h3 class="subsection-title">Step 1: Part Entry, Real-Time Stock Badges &amp; Routing Split Inputs</h3>
  <p>
    The maintenance dispatcher enters part numbers. The system instantly queries the Komatsu PDX master and renders real-time stock availability badges: <strong>KME Stock</strong> (Dubai), <strong>EOR</strong> (Emergency Restriction), and <strong>KLTD</strong> (Factory). The user can toggle between <span class="badge-ds">DS (Daily)</span> and <span class="badge-ds">SO (Stock)</span> as the default normal order type.
  </p>

  <div class="ui-mock-box">
    <div class="ui-mock-header">
      <span>Part Number &amp; Real-Time Master Stock</span>
      <span>Routing Split Configuration (Auto &amp; Manual)</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
      <div>
        <strong style="font-family: monospace; font-size: 8.5pt;">600-311-6742</strong> &bull; FUEL FILTER
        <div style="margin-top: 3px; display: flex; gap: 4px;">
          <span class="badge-kme">KME Stock: 10</span>
          <span class="badge-eo" style="font-size: 6.5pt;">EOR: 40</span>
          <span class="badge-ds" style="font-size: 6.5pt;">KLTD: 0</span>
        </div>
      </div>
      <div style="text-align: right; font-family: monospace;">
        Requested Qty: <strong>50 EA</strong> &rarr;
        <span class="badge-ds" style="font-size: 8pt;">DS (Stock): 10</span> +
        <span class="badge-eo" style="font-size: 8pt;">EO (Emergency): 40</span>
        <span style="display: block; font-size: 6.5pt; color: #64748b; margin-top: 2px;">EO Max/Order: 20 EA per SN</span>
      </div>
    </div>
  </div>

  <div class="figure-card">
    <img src="${img1}" alt="Step 1: Requested Parts and Item Types" />
    <div class="figure-caption">Figure 1: Baseline Parts Entry table showing part verification, catalogue descriptions, and sub-order caps.</div>
  </div>

  <h3 class="subsection-title">Step 2: Intelligent Fleet Allocation &amp; 100% Stock Bypass</h3>
  <p>
    If an order is <strong>100% Stock (<span class="badge-ds">DS</span>/<span class="badge-ds">SO</span>)</strong>, Step 2 automatically displays a <em>"Machine Details Not Required — Bypassed"</em> banner and skips fleet selection entirely. If the order is <strong>Hybrid</strong>, the fleet selector is activated <em>strictly for the EO portion</em> (40 units divided across 2 machines).
  </p>

  <div class="figure-card">
    <img src="${img2}" alt="Step 2 and 3: Fleet Allocation and Sequence Setup" />
    <div class="figure-caption">Figure 2: Active Machine Pool Selection (filtered for compatible PC500LC-10R models) with sequential distributor references.</div>
  </div>

  <!-- ================= PAGE 4: DISPATCH MANIFEST & SO CONVERSION ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">Step 3: Unified Quotations Manifest (Clear Stock vs Emergency Visual Badging)</h3>
  <p>
    The EQP engine generates the unified manifest, clearly differentiating normal stock from emergency breakdown sub-orders:
  </p>
  <ul>
    <li><strong>Sub-Order #1:</strong> Displays <span class="badge-ds">DS &bull; Direct Stock</span> badge, Asset: <em>"KME Direct Stock • No Machine Required • DDU"</em>, uncapped.</li>
    <li><strong>Sub-Order #2 &amp; #3:</strong> Displays <span class="badge-eo">EO &bull; Emergency</span> badge, Asset: <em>"SN: 100433 • PC500LC-10R • Laala Al-Kuwait"</em>, capped at 20 EA.</li>
    <li><strong>Continuous Distributor Sequence:</strong> <code>R229/2026</code> &rarr; <code>R230/2026</code> &rarr; <code>R231/2026</code>.</li>
  </ul>

  <div class="figure-card">
    <img src="${img3}" alt="Step 4: Planned Unified Quotations and Live Dispatch Queue" />
    <div class="figure-caption">Figure 3: Planned Unified Dispatch Queue showing sub-order references, target asset serial numbers, and line items.</div>
  </div>

  <!-- ================= PAGE 5: SO CONVERSION & SAP TRIGGER ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">Step 4: Komatsu Quotation to Sales Order (SO) Conversion &amp; SAP Trigger</h3>
  <p>
    Once submitted to Komatsu PDX, the portal returns official Komatsu Quotation Numbers (e.g. <code>0000282871</code>). The EQP system batch-confirms these quotations and converts them into official <strong>Komatsu Sales Orders (SO)</strong> (e.g., <code>SO #0000278046</code>, <code>SO #0000278047</code>...).
  </p>

  <div class="figure-card">
    <img src="${img4}" alt="Komatsu Quotation to SO Converter and SAP PO Trigger" />
    <div class="figure-caption">Figure 4: Komatsu Quotation to Sales Order Converter showing official Komatsu SO numbers and the target "Create SAP PO" action.</div>
  </div>

  <div class="callout callout-emerald">
    <span class="callout-title">The Exact Integration Trigger:</span>
    When the Komatsu Sales Order is confirmed, clicking <strong>"Create SAP PO"</strong> calls the SAP Service Layer API to instantly create the approved Purchase Order in SAP B1 for Vendor <code>V000006</code>, returning the SAP <code>DocNum</code> directly into this screen.
  </div>

  <!-- ================= PAGE 5: TECHNICAL API SPECIFICATION FOR ABS ================= -->
  <div class="page-break"></div>

  <h2 class="section-title">6. Technical API Specification for the ABS / SAP Team</h2>
  <p>
    We propose integrating directly with the <strong>SAP Business One Service Layer</strong> (OData v4 REST API).
  </p>

  <h3 class="subsection-title">A. Header Field Mapping (Table: <code>OPOR</code> / Entity: <code>PurchaseOrders</code>)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 17%;">SAP Field</th>
        <th style="width: 22%;">SAP Description</th>
        <th style="width: 31%;">Stock Order (<span class="badge-ds">DS</span> / <span class="badge-ds">SO</span>)</th>
        <th style="width: 30%;">Emergency Order (<span class="badge-eo">EO</span>)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>CardCode</code></td>
        <td>Vendor Code</td>
        <td><code>V000006</code> (Komatsu Middle East)</td>
        <td><code>V000006</code> (Komatsu Middle East)</td>
      </tr>
      <tr>
        <td><code>DocDate</code></td>
        <td>Posting Date</td>
        <td>Current Date (<code>2026-10-05</code>)</td>
        <td>Current Date (<code>2026-10-05</code>)</td>
      </tr>
      <tr>
        <td><code>DocDueDate</code></td>
        <td>Delivery Due Date</td>
        <td>Expected Delivery Date</td>
        <td>Expected Delivery Date (Urgent)</td>
      </tr>
      <tr>
        <td><code>DocCurrency</code></td>
        <td>Document Currency</td>
        <td><code>USD</code></td>
        <td><code>USD</code></td>
      </tr>
      <tr>
        <td><code>NumAtCard</code></td>
        <td>Vendor Ref / BP Ref</td>
        <td><code>SO #0000278046 / R229/2026</code></td>
        <td><code>SO #0000278047 / R230/2026</code></td>
      </tr>
      <tr>
        <td><code>Comments</code></td>
        <td>Remarks</td>
        <td><code>Komatsu DS Stock Replenishment (KME)</code></td>
        <td><code>Komatsu EO: PC500LC-10R (SN: 100433)</code></td>
      </tr>
      <tr>
        <td><code>U_OrderType</code></td>
        <td>UDF: Order Type</td>
        <td><code>DS</code> (or <code>SO</code>)</td>
        <td><code>EO</code></td>
      </tr>
      <tr>
        <td><code>U_KomatsuSO</code></td>
        <td>UDF: Komatsu SO No</td>
        <td>Official Komatsu SO Number</td>
        <td>Official Komatsu SO Number</td>
      </tr>
      <tr>
        <td><code>U_DeliveryTerms</code></td>
        <td>UDF: Delivery Terms</td>
        <td><code>DDU</code></td>
        <td><code>EXW</code></td>
      </tr>
      <tr>
        <td><code>U_PremiumRate</code></td>
        <td>UDF: Surcharge Rate</td>
        <td><code>0.00</code> (0% surcharge)</td>
        <td><code>13.30</code> (13.3% surcharge)</td>
      </tr>
      <tr>
        <td><code>U_MachineSerial</code></td>
        <td>UDF: Machine Serial</td>
        <td><em>null / empty string</em> (Not applicable)</td>
        <td><code>100433</code> (Chassis Serial)</td>
      </tr>
      <tr>
        <td><code>U_MachineModel</code></td>
        <td>UDF: Machine Model</td>
        <td><em>null / empty string</em> (Not applicable)</td>
        <td><code>PC500LC-10R</code> (Model Code)</td>
      </tr>
      <tr>
        <td><code>U_Customer</code></td>
        <td>UDF: End Customer</td>
        <td><em>null / empty string</em> (General Stock)</td>
        <td><code>LAALA AL KUWAIT REAL ESTATE CO.</code></td>
      </tr>
    </tbody>
  </table>

  <h3 class="subsection-title">B. Concrete JSON Payload Comparison: Normal Stock vs Emergency Breakdown</h3>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7px;">
    <div>
      <span style="font-size: 7.5pt; font-weight: 700; color: #0369a1;">Example 1: Normal Stock PO (DS) — No Machine Details</span>
      <pre class="code-block">{
  "CardCode": "V000006",
  "DocDate": "2026-10-05",
  "DocDueDate": "2026-10-12",
  "DocCurrency": "USD",
  "NumAtCard": "SO #0000278046 / R229/2026",
  "Comments": "Komatsu DS Stock Replenishment",
  "U_OrderType": "DS",
  "U_KomatsuSO": "0000278046",
  "U_KomatsuQuote": "0000282871",
  "U_DeliveryTerms": "DDU",
  "U_PremiumRate": 0.0,
  "U_MachineSerial": null,
  "U_MachineModel": null,
  "U_Customer": null,
  "DocumentLines": [
    {
      "ItemCode": "600-311-6742",
      "ItemDescription": "FUEL FILTER",
      "Quantity": 10.0,
      "UnitPrice": 25.00,
      "WarehouseCode": "001",
      "TaxCode": "P0"
    }
  ]
}</pre>
    </div>

    <div>
      <span style="font-size: 7.5pt; font-weight: 700; color: #b45309;">Example 2: Emergency Breakdown PO (EO) — With Machine Details</span>
      <pre class="code-block">{
  "CardCode": "V000006",
  "DocDate": "2026-10-05",
  "DocDueDate": "2026-10-08",
  "DocCurrency": "USD",
  "NumAtCard": "SO #0000278047 / R230/2026",
  "Comments": "Komatsu EO: PC500LC-10R (SN: 100433)",
  "U_OrderType": "EO",
  "U_KomatsuSO": "0000278047",
  "U_KomatsuQuote": "0000282872",
  "U_DeliveryTerms": "EXW",
  "U_PremiumRate": 13.3,
  "U_MachineSerial": "100433",
  "U_MachineModel": "PC500LC-10R",
  "U_Customer": "LAALA AL KUWAIT",
  "DocumentLines": [
    {
      "ItemCode": "600-311-6742",
      "ItemDescription": "FUEL FILTER",
      "Quantity": 20.0,
      "UnitPrice": 28.325,
      "WarehouseCode": "003",
      "TaxCode": "P0"
    }
  ]
}</pre>
    </div>
  </div>

  <!-- ================= PAGE 6: SAP RESPONSE & ALIGNMENT QUESTIONS ================= -->
  <div class="page-break"></div>

  <h3 class="subsection-title">C. Expected SAP Response &amp; Cross-System Traceability</h3>
  <p>
    Upon successful creation, the SAP B1 Service Layer returns HTTP 201 Created with document numbers:
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
    The EQP database saves <code>DocNum: 20260481</code> and <code>DocEntry: 14205</code> directly onto the Komatsu quotation record, giving maintenance, procurement, and accounting teams complete end-to-end traceability across both systems.
  </p>

  <h2 class="section-title">7. Key Questions &amp; Alignment Needed from the ABS Team</h2>
  <ol>
    <li>
      <strong>Service Layer Endpoint URL &amp; Firewall Whitelisting:</strong><br>
      Please provide the official Service Layer URL (e.g. <code>https://daralhai.b1pro.com:50000/b1s/v1/</code>) and confirm network access for the EQP server.
    </li>
    <li>
      <strong>Dedicated Technical API User:</strong><br>
      We request a dedicated API service account (e.g. <code>B1_API_EQP</code>) with permissions restricted to <code>PurchaseOrders</code> (Create/Read) and <code>Items</code> (Read/Create).
    </li>
    <li>
      <strong>Warehouse Code Mapping for Stock vs Emergency:</strong><br>
      Should normal stock orders (<span class="badge-ds">DS</span>/<span class="badge-ds">SO</span>) route to the Central Stock Warehouse (e.g. <code>001</code>) while emergency breakdown parts (<span class="badge-eo">EO</span>) route to the Job-Site/Transit Warehouse (e.g. <code>003</code>)?
    </li>
    <li>
      <strong>Pricing &amp; 13.30% Surcharge Representation:</strong><br>
      For Emergency Orders, should the 13.30% Komatsu surcharge be incorporated into the line-item unit price (e.g. $\$25.00 \times 1.133 = \$28.325$) or recorded as an additional document freight/charge expense?
    </li>
    <li>
      <strong>Handling New Part Numbers (Item Master <code>OITM</code>):</strong><br>
      With over 500,000 Komatsu parts, an urgent breakdown item may not yet exist in SAP B1. What is ABS's preferred procedure?
      <ul style="margin-top: 2px;">
        <li><em>Option 1 (Recommended):</em> Allow our API to auto-create missing parts via <code>POST /b1s/v1/Items</code> using Komatsu catalogue master data before creating the PO.</li>
        <li><em>Option 2:</em> Use a generic non-inventory item master with explicit line-item descriptions.</li>
      </ul>
    </li>
    <li>
      <strong>PO Approval Status (Active vs Draft):</strong><br>
      Should the API create approved open POs (<code>PurchaseOrders</code>) directly, or create Drafts (<code>PurchaseOrderDrafts</code>) during the pilot validation period?
    </li>
    <li>
      <strong>Existing UDF Alignment on <code>OPOR</code>:</strong><br>
      Please confirm if user-defined fields already exist on <code>OPOR</code> for <code>U_OrderType</code>, <code>U_KomatsuSO</code>, <code>U_MachineSerial</code>, and <code>U_DeliveryTerms</code>, or if ABS will create them.
    </li>
  </ol>

  <div class="callout callout-emerald" style="margin-top: 8px;">
    <span class="callout-title">Next Steps &amp; Testing Plan:</span>
    Once ABS provides the Service Layer connection credentials and confirms the UDF structure, the EQP engineering team will execute sample test transactions in the SAP sandbox environment within 24 hours.
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
    headerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 12mm; font-family: sans-serif;">Dar Al Hai &bull; Parts Inquiry &amp; SAP B1 PO API Integration Guide (v2.0)</div>',
    footerTemplate: '<div style="font-size: 7pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;">Confidential &bull; Prepared for ABS Consulting &bull; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF successfully created at:', outputPath);
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
