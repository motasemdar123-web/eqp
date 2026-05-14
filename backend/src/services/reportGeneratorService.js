const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
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

function converterCommands() {
  return [...new Set([
    process.env.LIBREOFFICE_BIN,
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
    available: true,
    localAvailable,
    commands: probes,
    configuredBinary: process.env.LIBREOFFICE_BIN || null,
    htmlPdfFallback: {
      available: htmlPdfAvailable,
      commands: htmlProbes,
      configuredBinary: process.env.PRINCE_BIN || null,
    },
    nodePdfFallback: {
      available: true,
      engine: 'pdfkit',
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

function buildTemplatePath(reportType, serviceType) {
  const safeServiceType = serviceType
    .replace(/\./g, '')
    .replace(/\s+/g, '_');

  return path.join(TEMPLATE_ROOT, `${reportType}_${safeServiceType}.xlsx`);
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

function getRandomCommentCell() {
  const columns = [
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];
  const rows = [77, 78, 79];

  const column = columns[Math.floor(Math.random() * columns.length)];
  const row = rows[Math.floor(Math.random() * rows.length)];

  return `${column}${row}`;
}

function addSignature(workbook, sheet, userName) {
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
    tl: {
      col: 48,
      row: 78,
    },
    ext: {
      width: 140,
      height: 60,
    },
  });

  console.log(`Signature added for ${signatureName}`);
}

async function tryConvertWorkbookToPdf(workbookBuffer) {
  const commands = converterCommands();
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'eqp-report-'));
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
            '--convert-to',
            'pdf',
            '--outdir',
            tempRoot,
            workbookPath,
          ],
          { timeout: 60000 }
        );

        if (await fs.pathExists(pdfPath)) {
          return await fs.readFile(pdfPath);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Excel to PDF conversion failed with ${command}: ${error.message}`);
        }
      }
    }

    return null;
  } finally {
    await fs.remove(tempRoot);
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

async function renderWorkbookToPdfWithPdfKit(workbook) {
  const sheet = workbook.worksheets[0];
  const bounds = getPrintBounds(sheet);
  const metrics = makeGridMetrics(sheet, bounds);
  const mergeMaps = getMergeMaps(sheet);
  const colOffsets = buildOffsetMap(bounds, metrics.colWidths, bounds.left, bounds.right);
  const rowOffsets = buildOffsetMap(bounds, metrics.rowHeights, bounds.top, bounds.bottom);
  const doc = new PDFDocument({
    size: 'A4',
    margin: 12,
    autoFirstPage: true,
    compress: true,
  });
  const bufferPromise = collectPdfBuffer(doc);
  const availableWidth = doc.page.width - (doc.page.margins.left + doc.page.margins.right);
  const availableHeight = doc.page.height - (doc.page.margins.top + doc.page.margins.bottom);
  const naturalWidthPt = metrics.totalWidth * 0.75;
  const naturalHeightPt = metrics.totalHeight * 0.75;
  const scale = Math.min(1, availableWidth / naturalWidthPt, availableHeight / naturalHeightPt);
  const originX = doc.page.margins.left;
  const originY = doc.page.margins.top;

  for (let rowNumber = bounds.top; rowNumber <= bounds.bottom; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);

    for (let colNumber = bounds.left; colNumber <= bounds.right; colNumber += 1) {
      const key = cellKey(rowNumber, colNumber);
      if (mergeMaps.covered.has(key)) continue;

      const merge = mergeMaps.topLeft.get(key) || { rowspan: 1, colspan: 1 };
      const cell = row.getCell(colNumber);
      const x = originX + ((colOffsets.get(colNumber) || 0) * 0.75 * scale);
      const y = originY + ((rowOffsets.get(rowNumber) || 0) * 0.75 * scale);
      const widthPx = (colOffsets.get(colNumber + merge.colspan) || 0) - (colOffsets.get(colNumber) || 0);
      const heightPx = (rowOffsets.get(rowNumber + merge.rowspan) || 0) - (rowOffsets.get(rowNumber) || 0);
      const width = widthPx * 0.75 * scale;
      const height = heightPx * 0.75 * scale;
      const background = cellBackground(cell);

      if (background) {
        doc.save().fillColor(background).rect(x, y, width, height).fill().restore();
      }

      drawPdfBorder(doc, 'top', x, y, width, height, cell.border && cell.border.top, scale);
      drawPdfBorder(doc, 'right', x, y, width, height, cell.border && cell.border.right, scale);
      drawPdfBorder(doc, 'bottom', x, y, width, height, cell.border && cell.border.bottom, scale);
      drawPdfBorder(doc, 'left', x, y, width, height, cell.border && cell.border.left, scale);

      const text = String(formatCellValue(cell.value));
      if (!text) continue;

      const font = cell.font || {};
      const alignment = cell.alignment || {};
      const fontSize = Math.max((font.size || 7.5) * scale, 3.6);
      const padding = 1.4 * scale;
      const textWidth = Math.max(width - (padding * 2), 1);
      const textHeight = Math.max(height - (padding * 2), 1);

      doc.save();
      doc.rect(x, y, width, height).clip();
      doc.font(pdfFontName(font)).fontSize(fontSize).fillColor(pdfColor(excelColorToCss(font.color)));

      const measuredHeight = Math.min(doc.heightOfString(text, { width: textWidth }), textHeight);
      const verticalOffset = alignment.vertical === 'middle'
        ? Math.max((textHeight - measuredHeight) / 2, 0)
        : 0;

      doc.text(text, x + padding, y + padding + verticalOffset, {
        width: textWidth,
        height: textHeight,
        align: pdfAlign(alignment),
        lineBreak: Boolean(alignment.wrapText),
        ellipsis: false,
      });
      doc.restore();
    }
  }

  if (sheet.getImages) {
    for (const image of sheet.getImages()) {
      const buffer = await workbookImageToBuffer(workbook, image.imageId);
      if (!buffer || !image.range || !image.range.tl) continue;

      const topLeft = anchorToPixels(image.range.tl, bounds, metrics);
      const bottomRight = image.range.br ? anchorToPixels(image.range.br, bounds, metrics) : null;
      const widthPx = image.range.ext ? image.range.ext.width : Math.max((bottomRight ? bottomRight.x - topLeft.x : 120), 1);
      const heightPx = image.range.ext ? image.range.ext.height : Math.max((bottomRight ? bottomRight.y - topLeft.y : 60), 1);

      doc.image(
        Buffer.from(buffer),
        originX + (topLeft.x * 0.75 * scale),
        originY + (topLeft.y * 0.75 * scale),
        {
          width: widthPx * 0.75 * scale,
          height: heightPx * 0.75 * scale,
        }
      );
    }
  }

  doc.end();
  return bufferPromise;
}

async function workbookToPdfBuffer(workbookBuffer, workbook) {
  const convertedBuffer = await tryConvertWorkbookToPdf(workbookBuffer);
  if (convertedBuffer) return convertedBuffer;

  if (workbook) {
    const localRenderedBuffer = await tryRenderWorkbookToPdfWithPrince(workbook);
    if (localRenderedBuffer) return localRenderedBuffer;

    return renderWorkbookToPdfWithPdfKit(workbook);
  }

  throw new ApiError(
    503,
    'Local PDF conversion is not available. Install LibreOffice/soffice, deploy the backend Docker image, or enable the built-in Node PDF renderer.'
  );
}

async function generateReports(payload) {
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

      const templatePath = buildTemplatePath(payload.reportType, payload.serviceType);

      if (!fs.existsSync(templatePath)) {
        throw new ApiError(400, `Template not found: ${path.basename(templatePath)}`);
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);

      const sheet = workbook.worksheets[0];
      const reportNo = `${safeDate}-${hh}${mm}-${String(reportIndex).padStart(3, '0')}`;
      const selectedComment = randomComment();

      sheet.getCell('L9').value = machine.machine_number;
      sheet.getCell('AD9').value = machine.engine_number;
      sheet.getCell('AN1').value = reportNo;
      sheet.getCell('B13').value = buildFormattedDate(serviceDate);
      sheet.getCell('L13').value = currentSMR;
      sheet.getCell('AP4').value = user.full_name;
      sheet.getCell('AX43').value = getRandomInt(750, 800);
      sheet.getCell('AX44').value = getRandomInt(2050, 2110);
      sheet.getCell(getRandomCommentCell()).value = selectedComment;

      addSignature(workbook, sheet, user.full_name);

      const fileName = `${machine.machine_type} ${machine.machine_number} ex${currentCounter}.pdf`;
      const workbookBuffer = await workbook.xlsx.writeBuffer();
      const pdfBuffer = await workbookToPdfBuffer(workbookBuffer, workbook);
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
