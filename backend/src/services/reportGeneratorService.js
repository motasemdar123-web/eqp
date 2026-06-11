const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFDocument: PdfLibDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const { promisify } = require('util');

const userRepository = require('../repositories/userRepository');
const machineRepository = require('../repositories/machineRepository');
const commentRepository = require('../repositories/commentRepository');
const reportRepository = require('../repositories/reportRepository');
const storageService = require('./storageService');
const { ApiError } = require('../utils/ApiError');

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', 'templates');
const SIGNATURE_ROOT = path.join(__dirname, '..', '..', 'signatures');
const execFileAsync = promisify(execFile);
const EMUS_PER_PIXEL = 9525;
const POINTS_TO_PIXELS = 96 / 72;
const A4_PRINTABLE_WIDTH_PX = 748;
const A4_PRINTABLE_HEIGHT_PX = 1055;
const DEFAULT_PDF_PAGE_HEIGHT_RATIO = 0.84;
const DEFAULT_TEMPLATE_MODEL = 'D155A';
const TEMPLATE_MODELS = new Set(['D155A', 'HM400']);
const TEMPLATE_FIELD_CONFIG = {
  D155A: {
    reportNo: 'AN1',
    machineNumber: 'L9',
    engineNumber: 'AD9',
    serviceDate: 'B13',
    smr: 'L13',
    inspector: 'AP4',
    randomValueCells: [
      { address: 'AX43', min: 750, max: 800 },
      { address: 'AX44', min: 2050, max: 2110 },
    ],
    commentColumns: [
      'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ],
    commentRows: [77, 78, 79],
    signature: {
      topLeft: { col: 48, row: 78 },
      size: { width: 140, height: 60 },
    },
  },
  HM400: {
    reportNo: 'AN1',
    machineNumber: 'L9',
    engineNumber: 'AD9',
    serviceDate: 'B13',
    smr: 'L13',
    inspector: 'AP4',
    randomValueCells: [],
    commentColumns: [
      'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG',
      'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN',
      'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU',
      'AV', 'AW', 'AX', 'AY', 'AZ', 'BA', 'BB',
      'BC', 'BD', 'BE', 'BF', 'BG', 'BH',
    ],
    commentRows: [79, 80, 81],
    signature: {
      topLeft: { col: 42, row: 81 },
      size: { width: 140, height: 60 },
    },
  },
};

function converterCommands() {
  return [...new Set([
    process.env.LIBREOFFICE_BIN,
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'soffice',
    'libreoffice',
  ].filter(Boolean))];
}

function htmlPdfCommands() {
  return [...new Set([
    process.env.PRINCE_BIN,
    'prince',
    'princexml',
  ].filter(Boolean))];
}

async function probeConverterCommand(command) {
  try {
    const { stdout, stderr } = await execFileAsync(command, ['--version'], { timeout: 10000 });
    return {
      command,
      available: true,
      version: String(stdout || stderr || '').trim(),
    };
  } catch (error) {
    return {
      command,
      available: false,
      error: error.code === 'ENOENT' ? 'Command not found' : error.message,
    };
  }
}

async function getPdfConverterStatus() {
  const commands = converterCommands();
  const htmlCommands = htmlPdfCommands();
  const [probes, htmlProbes] = await Promise.all([
    Promise.all(commands.map((command) => probeConverterCommand(command))),
    Promise.all(htmlCommands.map((command) => probeConverterCommand(command))),
  ]);
  const localAvailable = probes.some((probe) => probe.available);
  const htmlPdfAvailable = htmlProbes.some((probe) => probe.available);

  return {
    available: localAvailable,
    localAvailable,
    commands: probes,
    configuredBinary: process.env.LIBREOFFICE_BIN || null,
    htmlPdfFallback: {
      available: htmlPdfAvailable,
      commands: htmlProbes,
      configuredBinary: process.env.PRINCE_BIN || null,
    },
    nodePdfFallback: {
      available: false,
      engine: 'pdfkit',
      reason: 'Disabled for EQP reports because it cannot preserve the Excel template layout.',
    },
    runtime: {
      platform: process.platform,
      release: os.release(),
      render: process.env.RENDER === 'true',
      nodeEnv: process.env.NODE_ENV || null,
    },
  };
}

function bufferLooksLikePdf(buffer) {
  return Buffer.isBuffer(buffer) && buffer.subarray(0, 4).toString('utf8') === '%PDF';
}

function pdfPageHeightRatio() {
  const configuredRatio = Number(process.env.EQP_PDF_PAGE_HEIGHT_RATIO);

  if (Number.isFinite(configuredRatio) && configuredRatio > 0.6 && configuredRatio <= 1) {
    return configuredRatio;
  }

  return DEFAULT_PDF_PAGE_HEIGHT_RATIO;
}

async function cropPdfBottomWhitespace(pdfBuffer) {
  const ratio = pdfPageHeightRatio();
  if (ratio >= 1) return pdfBuffer;

  const pdf = await PdfLibDocument.load(pdfBuffer);

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const croppedHeight = height * ratio;
    const cropBottom = height - croppedHeight;

    page.setMediaBox(0, cropBottom, width, croppedHeight);
    page.setCropBox(0, cropBottom, width, croppedHeight);
    page.setTrimBox(0, cropBottom, width, croppedHeight);
    page.setBleedBox(0, cropBottom, width, croppedHeight);
    page.setArtBox(0, cropBottom, width, croppedHeight);
  });

  return Buffer.from(await pdf.save());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function columnLettersToNumber(letters) {
  return letters.toUpperCase().split('').reduce((total, char) => (
    total * 26 + char.charCodeAt(0) - 64
  ), 0);
}

function parseCellAddress(address) {
  const match = String(address).replace(/\$/g, '').match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  return {
    col: columnLettersToNumber(match[1]),
    row: Number(match[2]),
  };
}

function parseRange(range) {
  const cleanRange = String(range).replace(/\$/g, '').split('!').pop();
  const [startAddress, endAddress = startAddress] = cleanRange.split(':');
  const start = parseCellAddress(startAddress);
  const end = parseCellAddress(endAddress);

  if (!start || !end) return null;

  return {
    top: Math.min(start.row, end.row),
    left: Math.min(start.col, end.col),
    bottom: Math.max(start.row, end.row),
    right: Math.max(start.col, end.col),
  };
}

function getPrintBounds(sheet) {
  const printArea = sheet.pageSetup && sheet.pageSetup.printArea;
  const parsed = printArea ? parseRange(String(printArea).split('&&')[0]) : null;

  return parsed || {
    top: 1,
    left: 1,
    bottom: Math.max(sheet.rowCount, 1),
    right: Math.max(sheet.columnCount, 1),
  };
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function getMergeMaps(sheet) {
  const topLeft = new Map();
  const covered = new Set();

  (sheet.model.merges || []).forEach((mergeRange) => {
    const range = parseRange(mergeRange);
    if (!range) return;

    const key = cellKey(range.top, range.left);
    topLeft.set(key, {
      rowspan: range.bottom - range.top + 1,
      colspan: range.right - range.left + 1,
    });

    for (let row = range.top; row <= range.bottom; row += 1) {
      for (let col = range.left; col <= range.right; col += 1) {
        if (row !== range.top || col !== range.left) {
          covered.add(cellKey(row, col));
        }
      }
    }
  });

  return { topLeft, covered };
}

function excelColorToCss(color) {
  if (!color) return null;

  const raw = color.argb || color.rgb;
  if (!raw) return null;

  const hex = raw.length === 8 ? raw.slice(2) : raw;
  if (!hex || hex.toUpperCase() === '000000') return '#000000';

  return `#${hex}`;
}

function borderToCss(border) {
  if (!border || !border.style) return null;

  const widthMap = {
    hair: '0.5pt',
    thin: '0.75pt',
    dotted: '0.75pt',
    dashed: '0.75pt',
    medium: '1.25pt',
    thick: '1.8pt',
    double: '1.5pt',
  };
  const styleMap = {
    dotted: 'dotted',
    dashed: 'dashed',
    double: 'double',
  };
  const width = widthMap[border.style] || '0.75pt';
  const lineStyle = styleMap[border.style] || 'solid';
  const color = excelColorToCss(border.color) || '#1f2937';

  return `${width} ${lineStyle} ${color}`;
}

function formatCellValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toLocaleDateString('en-US');

  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || '').join('');
    }

    if (Object.prototype.hasOwnProperty.call(value, 'result')) {
      return formatCellValue(value.result);
    }

    if (value.text) return value.text;
    if (value.hyperlink) return value.hyperlink;
  }

  return value;
}

function buildCellStyle(cell) {
  const style = [];
  const font = cell.font || {};
  const alignment = cell.alignment || {};
  const fill = cell.fill || {};
  const border = cell.border || {};
  const background = fill.fgColor && fill.fgColor.argb !== '00000000'
    ? excelColorToCss(fill.fgColor)
    : null;
  const fontColor = excelColorToCss(font.color);

  if (background && background !== '#FFFFFF') style.push(`background:${background}`);
  if (font.name) style.push(`font-family:${JSON.stringify(font.name)}, Arial, sans-serif`);
  if (font.size) style.push(`font-size:${font.size}pt`);
  if (font.bold) style.push('font-weight:700');
  if (font.italic) style.push('font-style:italic');
  if (font.underline) style.push('text-decoration:underline');
  if (fontColor) style.push(`color:${fontColor}`);
  if (alignment.horizontal) style.push(`text-align:${alignment.horizontal}`);
  if (alignment.vertical) style.push(`vertical-align:${alignment.vertical === 'middle' ? 'middle' : alignment.vertical}`);
  if (alignment.wrapText) {
    style.push('white-space:normal');
    style.push('word-break:break-word');
  } else {
    style.push('white-space:nowrap');
  }

  const top = borderToCss(border.top);
  const right = borderToCss(border.right);
  const bottom = borderToCss(border.bottom);
  const left = borderToCss(border.left);
  if (top) style.push(`border-top:${top}`);
  if (right) style.push(`border-right:${right}`);
  if (bottom) style.push(`border-bottom:${bottom}`);
  if (left) style.push(`border-left:${left}`);

  return style.join(';');
}

function getColumnWidthPx(sheet, col) {
  const width = sheet.getColumn(col).width || sheet.properties.defaultColWidth || 8.43;
  return Math.max(4, width * 7.2);
}

function getRowHeightPx(sheet, row) {
  const height = sheet.getRow(row).height || sheet.properties.defaultRowHeight || 15;
  return Math.max(4, height * POINTS_TO_PIXELS);
}

async function workbookImageToDataUri(workbook, imageId) {
  const mediaItems = workbook.model.media || [];
  const media = mediaItems.find((item) => item.index === imageId) || mediaItems[imageId];
  if (!media) return null;

  const extension = media.extension || 'png';
  const buffer = media.buffer || (media.filename ? await fs.readFile(media.filename) : null);
  if (!buffer) return null;

  return `data:image/${extension};base64,${Buffer.from(buffer).toString('base64')}`;
}

async function workbookImageToBuffer(workbook, imageId) {
  const mediaItems = workbook.model.media || [];
  const media = mediaItems.find((item) => item.index === imageId) || mediaItems[imageId];
  if (!media) return null;

  return media.buffer || (media.filename ? await fs.readFile(media.filename) : null);
}

function makeGridMetrics(sheet, bounds) {
  const colWidths = new Map();
  const rowHeights = new Map();
  let totalWidth = 0;
  let totalHeight = 0;

  for (let col = bounds.left; col <= bounds.right; col += 1) {
    const width = getColumnWidthPx(sheet, col);
    colWidths.set(col, width);
    totalWidth += width;
  }

  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    const height = getRowHeightPx(sheet, row);
    rowHeights.set(row, height);
    totalHeight += height;
  }

  return { colWidths, rowHeights, totalWidth, totalHeight };
}

function anchorToPixels(anchor, bounds, metrics) {
  const colNumber = anchor.nativeCol + 1;
  const rowNumber = anchor.nativeRow + 1;
  let x = 0;
  let y = 0;

  for (let col = bounds.left; col < colNumber; col += 1) {
    x += metrics.colWidths.get(col) || 0;
  }

  for (let row = bounds.top; row < rowNumber; row += 1) {
    y += metrics.rowHeights.get(row) || 0;
  }

  return {
    x: x + ((anchor.nativeColOff || 0) / EMUS_PER_PIXEL),
    y: y + ((anchor.nativeRowOff || 0) / EMUS_PER_PIXEL),
  };
}

async function buildImageTags(workbook, sheet, bounds, metrics) {
  if (!sheet.getImages) return '';

  const tags = [];
  for (const image of sheet.getImages()) {
    const dataUri = await workbookImageToDataUri(workbook, image.imageId);
    if (!dataUri || !image.range || !image.range.tl) continue;

    const topLeft = anchorToPixels(image.range.tl, bounds, metrics);
    const bottomRight = image.range.br ? anchorToPixels(image.range.br, bounds, metrics) : null;
    const width = image.range.ext ? image.range.ext.width : Math.max((bottomRight ? bottomRight.x - topLeft.x : 120), 1);
    const height = image.range.ext ? image.range.ext.height : Math.max((bottomRight ? bottomRight.y - topLeft.y : 60), 1);

    tags.push(`<img class="sheet-image" src="${dataUri}" style="left:${topLeft.x}px;top:${topLeft.y}px;width:${width}px;height:${height}px" />`);
  }

  return tags.join('\n');
}

async function workbookToHtml(workbook) {
  const sheet = workbook.worksheets[0];
  const bounds = getPrintBounds(sheet);
  const metrics = makeGridMetrics(sheet, bounds);
  const mergeMaps = getMergeMaps(sheet);
  const scale = Math.min(
    1,
    A4_PRINTABLE_WIDTH_PX / metrics.totalWidth,
    A4_PRINTABLE_HEIGHT_PX / metrics.totalHeight
  );
  const colGroup = [];
  const rows = [];

  for (let col = bounds.left; col <= bounds.right; col += 1) {
    colGroup.push(`<col style="width:${metrics.colWidths.get(col)}px" />`);
  }

  for (let rowNumber = bounds.top; rowNumber <= bounds.bottom; rowNumber += 1) {
    const cells = [];
    const row = sheet.getRow(rowNumber);

    for (let colNumber = bounds.left; colNumber <= bounds.right; colNumber += 1) {
      const key = cellKey(rowNumber, colNumber);
      if (mergeMaps.covered.has(key)) continue;

      const merge = mergeMaps.topLeft.get(key);
      const cell = row.getCell(colNumber);
      const attrs = [];
      const style = buildCellStyle(cell);
      const value = escapeHtml(formatCellValue(cell.value));

      if (merge && merge.rowspan > 1) attrs.push(`rowspan="${merge.rowspan}"`);
      if (merge && merge.colspan > 1) attrs.push(`colspan="${merge.colspan}"`);
      if (style) attrs.push(`style="${style}"`);

      cells.push(`<td ${attrs.join(' ')}>${value}</td>`);
    }

    rows.push(`<tr style="height:${metrics.rowHeights.get(rowNumber)}px">${cells.join('')}</tr>`);
  }

  const imageTags = await buildImageTags(workbook, sheet, bounds, metrics);
  const frameWidth = metrics.totalWidth * scale;
  const frameHeight = metrics.totalHeight * scale;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 portrait; margin: 6mm 4mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .sheet-frame { width: ${frameWidth}px; height: ${frameHeight}px; overflow: hidden; }
    .sheet-canvas {
      position: relative;
      width: ${metrics.totalWidth}px;
      height: ${metrics.totalHeight}px;
      transform: scale(${scale});
      transform-origin: top left;
    }
    table { border-collapse: collapse; table-layout: fixed; width: ${metrics.totalWidth}px; }
    td {
      box-sizing: border-box;
      padding: 0 2px;
      overflow: hidden;
      line-height: 1.05;
      font-size: 7.5pt;
      vertical-align: middle;
    }
    .sheet-image { position: absolute; object-fit: contain; z-index: 2; }
  </style>
</head>
<body>
  <div class="sheet-frame">
    <div class="sheet-canvas">
      <table>
        <colgroup>${colGroup.join('')}</colgroup>
        <tbody>${rows.join('')}</tbody>
      </table>
      ${imageTags}
    </div>
  </div>
</body>
</html>`;
}

function buildWeightedCommentPicker(comments) {
  const pool = [];

  comments.forEach((comment) => {
    const frequency = Math.max(Number(comment.frequency) || 0, 0);

    for (let index = 0; index < frequency; index += 1) {
      pool.push(comment.comment_text);
    }
  });

  return function randomComment() {
    if (pool.length === 0) return '';

    return pool[Math.floor(Math.random() * pool.length)];
  };
}

function normalizeTemplateModel(value) {
  if (!value) return DEFAULT_TEMPLATE_MODEL;

  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (normalized.startsWith('HM400')) return 'HM400';
  if (normalized.startsWith('D155')) return 'D155A';

  return null;
}

function buildTemplateCandidates(reportType, serviceType, templateModel) {
  const safeServiceType = serviceType
    .replace(/\./g, '')
    .replace(/\s+/g, '_');
  const baseFileName = `${reportType}_${safeServiceType}.xlsx`;
  const model = normalizeTemplateModel(templateModel);

  return [path.join(TEMPLATE_ROOT, model, baseFileName)];
}

function resolveTemplatePath(reportType, serviceType, templateModel) {
  const candidates = buildTemplateCandidates(reportType, serviceType, templateModel);
  const templatePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!templatePath) {
    const expectedFiles = candidates
      .map((candidate) => path.relative(TEMPLATE_ROOT, candidate))
      .join(', ');

    throw new ApiError(
      400,
      `Template not found for ${normalizeTemplateModel(templateModel)} ${reportType} ${serviceType}. Expected: ${expectedFiles}`
    );
  }

  return templatePath;
}

function buildFormattedDate(serviceDate) {
  return new Date(serviceDate).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTemplateFieldConfig(templateModel) {
  return TEMPLATE_FIELD_CONFIG[templateModel] || TEMPLATE_FIELD_CONFIG[DEFAULT_TEMPLATE_MODEL];
}

function getRandomCommentCell(config) {
  const column = config.commentColumns[Math.floor(Math.random() * config.commentColumns.length)];
  const row = config.commentRows[Math.floor(Math.random() * config.commentRows.length)];

  return `${column}${row}`;
}

function addSignature(workbook, sheet, userName, config) {
  const signatureName = userName.split(' ')[0].toLowerCase();
  const signaturePath = path.join(SIGNATURE_ROOT, `${signatureName}-signature.png`);

  if (!fs.existsSync(signaturePath)) {
    console.log(`Signature not found: ${signaturePath}`);
    return;
  }

  const signatureImage = workbook.addImage({
    filename: signaturePath,
    extension: 'png',
  });

  sheet.addImage(signatureImage, {
    tl: config.signature.topLeft,
    ext: config.signature.size,
  });

  console.log(`Signature added for ${signatureName}`);
}

async function tryConvertWorkbookToPdf(workbookBuffer) {
  const commands = converterCommands();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'eqp-report-'));
  const profileRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'eqp-libreoffice-profile-'));
  const workbookPath = path.join(tempRoot, 'report.xlsx');
  const pdfPath = path.join(tempRoot, 'report.pdf');

  try {
    await fs.writeFile(workbookPath, Buffer.from(workbookBuffer));

    for (const command of commands) {
      try {
        await execFileAsync(
          command,
          [
            '--headless',
            '--invisible',
            '--nodefault',
            '--nolockcheck',
            '--nofirststartwizard',
            '--norestore',
            `-env:UserInstallation=file:///${profileRoot.replace(/\\/g, '/')}`,
            '--convert-to',
            'pdf:calc_pdf_Export',
            '--outdir',
            tempRoot,
            workbookPath,
          ],
          { timeout: 60000 }
        );

        if (await fs.pathExists(pdfPath)) {
          const pdfBuffer = await fs.readFile(pdfPath);
          if (bufferLooksLikePdf(pdfBuffer)) return cropPdfBottomWhitespace(pdfBuffer);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Excel to PDF conversion failed with ${command}: ${error.message}`);
        }
      }
    }

    return null;
  } finally {
    await Promise.all([
      fs.remove(tempRoot),
      fs.remove(profileRoot),
    ]);
  }
}

async function tryRenderWorkbookToPdfWithPrince(workbook) {
  const commands = htmlPdfCommands();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'eqp-report-html-'));
  const htmlPath = path.join(tempRoot, 'report.html');
  const pdfPath = path.join(tempRoot, 'report.pdf');

  try {
    await fs.writeFile(htmlPath, await workbookToHtml(workbook), 'utf8');

    for (const command of commands) {
      try {
        await execFileAsync(command, [htmlPath, '-o', pdfPath], { timeout: 60000 });

        if (await fs.pathExists(pdfPath)) {
          const pdfBuffer = await fs.readFile(pdfPath);
          if (bufferLooksLikePdf(pdfBuffer)) return pdfBuffer;
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`HTML to PDF fallback failed with ${command}: ${error.message}`);
        }
      }
    }

    return null;
  } finally {
    await fs.remove(tempRoot);
  }
}

function buildOffsetMap(bounds, sizes, start, end) {
  const offsets = new Map();
  let current = 0;

  for (let index = start; index <= end + 1; index += 1) {
    offsets.set(index, current);
    current += sizes.get(index) || 0;
  }

  return offsets;
}

function pdfColor(color, fallback = '#111827') {
  return color || fallback;
}

function pdfLineWidth(style) {
  const widthMap = {
    hair: 0.35,
    thin: 0.5,
    dotted: 0.5,
    dashed: 0.5,
    medium: 0.9,
    thick: 1.3,
    double: 1.1,
  };

  return widthMap[style] || 0.5;
}

function pdfFontName(font) {
  if (font.bold && font.italic) return 'Helvetica-BoldOblique';
  if (font.bold) return 'Helvetica-Bold';
  if (font.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

function pdfAlign(alignment) {
  const value = alignment && alignment.horizontal;
  if (['center', 'right', 'justify'].includes(value)) return value;
  return 'left';
}

function cellBackground(cell) {
  const fill = cell.fill || {};
  if (!fill.fgColor || fill.fgColor.argb === '00000000') return null;

  const color = excelColorToCss(fill.fgColor);
  return color === '#FFFFFF' ? null : color;
}

function drawPdfBorder(doc, side, x, y, width, height, border, scale) {
  if (!border || !border.style) return;

  const color = excelColorToCss(border.color) || '#1f2937';
  const lineWidth = pdfLineWidth(border.style) * scale;

  doc.save();
  doc.strokeColor(color).lineWidth(lineWidth);
  if (border.style === 'dashed') doc.dash(2 * scale, { space: 2 * scale });
  if (border.style === 'dotted') doc.dash(0.5 * scale, { space: 1.5 * scale });

  if (side === 'top') doc.moveTo(x, y).lineTo(x + width, y).stroke();
  if (side === 'right') doc.moveTo(x + width, y).lineTo(x + width, y + height).stroke();
  if (side === 'bottom') doc.moveTo(x, y + height).lineTo(x + width, y + height).stroke();
  if (side === 'left') doc.moveTo(x, y).lineTo(x, y + height).stroke();

  doc.restore();
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function sheetText(sheet, address) {
  return String(formatCellValue(sheet.getCell(address).value)).trim();
}

function findSignaturePath(userName) {
  const signatureName = userName.split(' ')[0].toLowerCase();
  const exactPath = path.join(SIGNATURE_ROOT, `${signatureName}-signature.png`);

  if (fs.existsSync(exactPath)) return exactPath;
  if (!fs.existsSync(SIGNATURE_ROOT)) return null;

  const matchingFile = fs
    .readdirSync(SIGNATURE_ROOT)
    .find((file) => file.toLowerCase().startsWith(`${signatureName}-signature`));

  return matchingFile ? path.join(SIGNATURE_ROOT, matchingFile) : null;
}

function drawKomatsuHeader(doc, logoBuffer, context) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.y;

  if (logoBuffer) {
    doc.image(Buffer.from(logoBuffer), left, top, { width: 145 });
  } else {
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#1234c8').text('KOMATSU', left, top);
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor('#111827')
    .text('Equipment Preventive Maintenance Report', left + 170, top + 4, {
      width: 250,
    });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#52525b')
    .text('Generated by Dar Al HAI Maintenance Management System', left + 170, top + 39, {
      width: 260,
    });

  doc
    .roundedRect(right - 136, top, 136, 54, 6)
    .fillAndStroke('#fef3c7', '#facc15')
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('REPORT NO.', right - 124, top + 10)
    .fontSize(10)
    .text(context.reportNo || 'Pending', right - 124, top + 25, { width: 112 });

  doc
    .moveTo(left, top + 70)
    .lineTo(right, top + 70)
    .lineWidth(0.8)
    .strokeColor('#d4d4d8')
    .stroke();

  doc.y = top + 86;
}

function drawSectionTitle(doc, title) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;

  doc
    .roundedRect(left, y, width, 22, 4)
    .fill('#111827')
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(title.toUpperCase(), left + 10, y + 6);
  doc.y = y + 32;
}

function drawKeyValueGrid(doc, items, columns = 3) {
  const left = doc.page.margins.left;
  const gap = 8;
  const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = (totalWidth - (gap * (columns - 1))) / columns;
  const rowHeight = 38;
  const startY = doc.y;

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    const x = left + (column * (columnWidth + gap));
    const y = startY + (row * (rowHeight + 8));

    doc
      .roundedRect(x, y, columnWidth, rowHeight, 4)
      .fillAndStroke('#fafafa', '#e4e4e7')
      .fillColor('#71717a')
      .font('Helvetica-Bold')
      .fontSize(6.8)
      .text(String(item.label).toUpperCase(), x + 8, y + 7, { width: columnWidth - 16 })
      .fillColor('#111827')
      .font('Helvetica')
      .fontSize(9)
      .text(item.value || '-', x + 8, y + 20, { width: columnWidth - 16, ellipsis: true });
  });

  doc.y = startY + (Math.ceil(items.length / columns) * (rowHeight + 8)) + 8;
}

function markerSummary(sheet, rowNumber, startCol) {
  const labels = ['Pre-Delivery', 'Delivery', 'Discuss', 'Service', 'Discuss'];
  const cells = [startCol, startCol + 1, startCol + 2, startCol + 3, startCol + 4];

  return cells
    .map((col, index) => ({ label: labels[index], value: sheet.getRow(rowNumber).getCell(col).value }))
    .filter((entry) => String(formatCellValue(entry.value)).trim().toLowerCase() === 'x')
    .map((entry) => entry.label)
    .join(', ');
}

function extractChecklistItems(sheet) {
  const items = [];

  for (let rowNumber = 32; rowNumber <= 64; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const leftItem = String(formatCellValue(row.getCell(3).value)).trim();
    const rightItem = String(formatCellValue(row.getCell(34).value)).trim();
    const leftStatus = String(formatCellValue(row.getCell(29).value)).trim();
    const rightStatus = String(formatCellValue(row.getCell(60).value)).trim();
    const leftNumber = String(formatCellValue(row.getCell(2).value)).trim();
    const rightNumber = String(formatCellValue(row.getCell(33).value)).trim();

    if (leftItem && !['SERVICE', 'FLUID COMPARTMENT CHECK'].includes(leftItem.toUpperCase())) {
      items.push({
        no: /^\d+$/.test(leftNumber) ? leftNumber : '',
        item: leftItem,
        scope: markerSummary(sheet, rowNumber, 24),
        condition: ['G', 'B', 'C'].includes(leftStatus) ? leftStatus : '',
      });
    }

    if (rightItem && !['OPERATION', 'GUIDANCE', 'OTHERS'].includes(rightItem.toUpperCase())) {
      items.push({
        no: /^\d+$/.test(rightNumber) ? rightNumber : '',
        item: rightItem,
        scope: markerSummary(sheet, rowNumber, 55),
        condition: ['G', 'B', 'C'].includes(rightStatus) ? rightStatus : '',
      });
    }
  }

  return items;
}

function ensureSpace(doc, neededHeight) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) {
    doc.addPage();
  }
}

function drawChecklistTable(doc, items) {
  const left = doc.page.margins.left;
  const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columns = {
    no: 34,
    item: totalWidth - 206,
    scope: 118,
    condition: 54,
  };

  const drawHeader = () => {
    ensureSpace(doc, 32);
    const y = doc.y;
    doc.rect(left, y, totalWidth, 22).fill('#f4f4f5');
    doc
      .fillColor('#27272a')
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('NO.', left + 6, y + 7, { width: columns.no - 8 })
      .text('CHECK ITEM', left + columns.no + 6, y + 7, { width: columns.item - 8 })
      .text('SCOPE', left + columns.no + columns.item + 6, y + 7, { width: columns.scope - 8 })
      .text('COND.', left + columns.no + columns.item + columns.scope + 6, y + 7, { width: columns.condition - 8 });
    doc.y = y + 22;
  };

  drawHeader();

  items.forEach((entry, index) => {
    const rowWidth = columns.item - 10;
    const itemHeight = doc.heightOfString(entry.item, {
      width: rowWidth,
      lineGap: 1,
    });
    const scopeHeight = doc.heightOfString(entry.scope || '-', {
      width: columns.scope - 10,
      lineGap: 1,
    });
    const height = Math.max(24, itemHeight + 12, scopeHeight + 12);

    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeader();
    }

    const y = doc.y;
    const background = index % 2 === 0 ? '#ffffff' : '#fafafa';

    doc.rect(left, y, totalWidth, height).fill(background);
    doc.strokeColor('#e4e4e7').lineWidth(0.5).rect(left, y, totalWidth, height).stroke();

    doc
      .fillColor('#111827')
      .font('Helvetica')
      .fontSize(7.5)
      .text(entry.no || '-', left + 6, y + 7, { width: columns.no - 10 })
      .text(entry.item, left + columns.no + 6, y + 7, { width: rowWidth, lineGap: 1 })
      .fillColor('#52525b')
      .fontSize(6.8)
      .text(entry.scope || '-', left + columns.no + columns.item + 6, y + 7, { width: columns.scope - 10, lineGap: 1 })
      .fillColor(entry.condition === 'G' ? '#166534' : '#111827')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(entry.condition || '-', left + columns.no + columns.item + columns.scope + 6, y + 7, {
        width: columns.condition - 10,
        align: 'center',
      });

    doc.y = y + height;
  });

  doc.y += 16;
}

function drawNotesAndSignatures(doc, context) {
  const left = doc.page.margins.left;
  const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const half = (totalWidth - 12) / 2;

  ensureSpace(doc, 172);
  drawSectionTitle(doc, 'Comments and Closure');

  const notesY = doc.y;
  doc
    .roundedRect(left, notesY, totalWidth, 60, 5)
    .fillAndStroke('#fffdf5', '#fde68a')
    .fillColor('#92400e')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('Inspector Comments', left + 10, notesY + 9)
    .fillColor('#111827')
    .font('Helvetica')
    .fontSize(9)
    .text(context.selectedComment || '-', left + 10, notesY + 24, {
      width: totalWidth - 20,
      height: 28,
    });

  doc.y = notesY + 78;

  const sigY = doc.y;
  doc.roundedRect(left, sigY, half, 70, 5).stroke('#d4d4d8');
  doc.roundedRect(left + half + 12, sigY, half, 70, 5).stroke('#d4d4d8');

  doc
    .fillColor('#71717a')
    .font('Helvetica-Bold')
    .fontSize(7)
    .text('CUSTOMER SIGNATURE', left + 10, sigY + 10)
    .text('INSPECTOR SIGNATURE', left + half + 22, sigY + 10);

  const signaturePath = findSignaturePath(context.createdBy || '');
  if (signaturePath) {
    try {
      doc.image(signaturePath, left + half + 22, sigY + 28, { width: 110, height: 34, fit: [110, 34] });
    } catch (_error) {
      // Signature image is optional in the fallback renderer.
    }
  }

  doc
    .fillColor('#111827')
    .font('Helvetica')
    .fontSize(9)
    .text(context.createdBy || '-', left + half + 145, sigY + 39, { width: half - 155 });

  doc.y = sigY + 88;
}

async function renderWorkbookToPdfWithPdfKit(workbook, context = {}) {
  const sheet = workbook.worksheets[0];
  const doc = new PDFDocument({
    size: 'A4',
    margin: 28,
    autoFirstPage: true,
    compress: true,
  });
  const bufferPromise = collectPdfBuffer(doc);
  const logoBuffer = await workbookImageToBuffer(workbook, 0);
  const machine = context.machine || {};
  const checklistItems = extractChecklistItems(sheet);
  const infoItems = [
    { label: 'Machine Model', value: sheetText(sheet, 'B9') || machine.machine_type },
    { label: 'Machine No.', value: sheetText(sheet, 'L9') || machine.machine_number },
    { label: 'Machine Type', value: sheetText(sheet, 'I9') || machine.machine_type },
    { label: 'Engine Model', value: sheetText(sheet, 'V9') },
    { label: 'Engine Serial No.', value: sheetText(sheet, 'AD9') || machine.engine_number },
    { label: 'Service Date', value: sheetText(sheet, 'B13') || context.serviceDate },
    { label: 'SMR', value: sheetText(sheet, 'L13') || context.smr },
    { label: 'Customer', value: sheetText(sheet, 'R13') },
    { label: 'Distributor', value: sheetText(sheet, 'AS13') },
    { label: 'Service Type', value: context.serviceType },
    { label: 'Report Type', value: context.reportType },
    { label: 'Inspector', value: sheetText(sheet, 'AP4') || context.createdBy },
  ];

  drawKomatsuHeader(doc, logoBuffer, context);
  drawSectionTitle(doc, 'Machine and Service Details');
  drawKeyValueGrid(doc, infoItems);

  drawSectionTitle(doc, 'Condition Legend');
  drawKeyValueGrid(doc, [
    { label: 'X', value: 'Item to be serviced' },
    { label: 'G', value: 'Good condition' },
    { label: 'B', value: 'Bad condition' },
    { label: 'C', value: 'Correction made' },
    { label: 'Local Fallback', value: 'Structured PDF generated by Node renderer' },
    { label: 'Source Template', value: `${context.reportType || ''} ${context.serviceType || ''}`.trim() },
  ], 3);

  drawSectionTitle(doc, 'Inspection Checklist');
  drawChecklistTable(doc, checklistItems);

  drawNotesAndSignatures(doc, context);

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor('#71717a')
    .text('Form No. SEKC250101 | Local PDF fallback output. LibreOffice Docker export remains the exact-template renderer when available.', doc.page.margins.left, doc.page.height - 36, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: 'center',
    });

  doc.end();
  return bufferPromise;
}

async function workbookToPdfBuffer(workbookBuffer, workbook, context) {
  const convertedBuffer = await tryConvertWorkbookToPdf(workbookBuffer);
  if (convertedBuffer) return convertedBuffer;

  throw new ApiError(
    503,
    'Exact Excel template PDF export is unavailable. Install LibreOffice/soffice on the backend or deploy the Docker image that includes LibreOffice.'
  );
}

function prepareFilledWorkbookForPdfExport(workbook, sheet) {
  workbook.creator = workbook.creator || 'EQP System';
  workbook.lastModifiedBy = 'EQP System';
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  workbook.eachSheet((worksheet) => {
    worksheet.state = worksheet === sheet ? 'visible' : 'hidden';
  });

  sheet.pageSetup = {
    ...sheet.pageSetup,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
  };
}

async function exportFilledExcelTemplateToPdf(workbook, sheet, context) {
  prepareFilledWorkbookForPdfExport(workbook, sheet);

  const workbookBuffer = await workbook.xlsx.writeBuffer();
  return workbookToPdfBuffer(workbookBuffer, workbook, context);
}

async function generateReports(payload) {
  const templateModel = normalizeTemplateModel(payload.machineModel);

  if (!TEMPLATE_MODELS.has(templateModel)) {
    throw new ApiError(400, 'Machine model must be D155A or HM400');
  }

  const user = payload.userNumber
    ? await userRepository.findByUserNumber(payload.userNumber)
    : await userRepository.findById(payload.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const machines = await machineRepository.findByIds(payload.selectedMachines);

  if (machines.length === 0) {
    throw new ApiError(404, 'No machines found');
  }

  const comments = await commentRepository.findAll();
  const randomComment = buildWeightedCommentPicker(comments);
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const generatedFiles = [];
  let reportIndex = 1;

  for (const machine of machines) {
    let currentSMR = Number(machine.last_smr);
    let currentStep = Number(machine.smr_step);
    let currentCounter = Number(machine.report_counter);

    for (const serviceDate of payload.reportDates) {
      const safeDate = serviceDate.replace(/-/g, '');

      currentStep += 1;
      currentCounter += 1;

      if (currentStep >= 4) {
        currentSMR += 1;
        currentStep = 0;
      }

      const templatePath = resolveTemplatePath(payload.reportType, payload.serviceType, templateModel);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);

      const sheet = workbook.worksheets[0];
      const reportNo = `${safeDate}-${hh}${mm}-${String(reportIndex).padStart(3, '0')}`;
      const selectedComment = randomComment();
      const fieldConfig = getTemplateFieldConfig(templateModel);

      sheet.getCell(fieldConfig.machineNumber).value = machine.machine_number;
      sheet.getCell(fieldConfig.engineNumber).value = machine.engine_number;
      sheet.getCell(fieldConfig.reportNo).value = reportNo;
      sheet.getCell(fieldConfig.serviceDate).value = buildFormattedDate(serviceDate);
      sheet.getCell(fieldConfig.smr).value = currentSMR;
      sheet.getCell(fieldConfig.inspector).value = user.full_name;

      fieldConfig.randomValueCells.forEach((cell) => {
        sheet.getCell(cell.address).value = getRandomInt(cell.min, cell.max);
      });

      sheet.getCell(getRandomCommentCell(fieldConfig)).value = selectedComment;

      addSignature(workbook, sheet, user.full_name, fieldConfig);

      const fileName = `${machine.machine_type} ${machine.machine_number} ex${currentCounter}.pdf`;
      const pdfBuffer = await exportFilledExcelTemplateToPdf(workbook, sheet, {
        reportNo,
        machine,
        reportType: payload.reportType,
        serviceType: payload.serviceType,
        templateModel,
        serviceDate,
        smr: currentSMR,
        createdBy: user.full_name,
        selectedComment,
      });
      const fileUrl = await storageService.uploadReport(fileName, pdfBuffer, 'application/pdf');

      await reportRepository.create({
        reportNo,
        machineType: machine.machine_type,
        machineId: machine.id,
        engineNumber: machine.engine_number,
        smr: currentSMR,
        serviceDate,
        comments: selectedComment,
        createdBy: user.full_name,
        machineNumber: machine.machine_number,
        reportType: payload.reportType,
        serviceType: payload.serviceType,
        fileName,
        fileUrl,
        createdById: payload.userId,
      });

      await machineRepository.updateCounters(machine.id, {
        lastSmr: currentSMR,
        smrStep: currentStep,
        reportCounter: currentCounter,
      });

      generatedFiles.push({
        machine: machine.machine_number,
        report: reportNo,
        file: fileName,
        fileUrl,
        format: 'PDF',
        templateModel,
      });

      reportIndex += 1;
    }
  }

  return {
    totalMachines: machines.length,
    generatedFiles,
  };
}

module.exports = { generateReports, getPdfConverterStatus };
