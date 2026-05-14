const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
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

function converterCommands() {
  return [...new Set([
    process.env.LIBREOFFICE_BIN,
    'soffice',
    'libreoffice',
  ].filter(Boolean))];
}

function getConvertApiConfig() {
  return {
    token: process.env.CONVERTAPI_TOKEN || process.env.CONVERTAPI_API_TOKEN || null,
    legacySecret: process.env.CONVERTAPI_SECRET || null,
    endpoint: process.env.CONVERTAPI_ENDPOINT || 'https://v2.convertapi.com/convert/xlsx/to/pdf',
    timeoutMs: Number(process.env.CONVERTAPI_TIMEOUT_MS) || 90000,
  };
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
  const probes = await Promise.all(commands.map((command) => probeConverterCommand(command)));
  const localAvailable = probes.some((probe) => probe.available);
  const convertApiConfig = getConvertApiConfig();
  const convertApiConfigured = Boolean(convertApiConfig.token || convertApiConfig.legacySecret);

  return {
    available: localAvailable || convertApiConfigured,
    localAvailable,
    commands: probes,
    configuredBinary: process.env.LIBREOFFICE_BIN || null,
    remoteProviders: {
      convertApi: {
        configured: convertApiConfigured,
        authMode: convertApiConfig.token ? 'bearer-token' : 'legacy-secret',
        endpoint: convertApiConfig.endpoint,
      },
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

function parseConvertApiError(responseBuffer) {
  const raw = responseBuffer.toString('utf8').trim();

  if (!raw) return 'empty response';

  try {
    const parsed = JSON.parse(raw);
    return parsed.Message || parsed.message || parsed.Code || raw;
  } catch (_error) {
    return raw.slice(0, 500);
  }
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

async function tryConvertWorkbookWithConvertApi(workbookBuffer) {
  const convertApiConfig = getConvertApiConfig();

  if (!convertApiConfig.token && !convertApiConfig.legacySecret) return null;

  const url = new URL(convertApiConfig.endpoint);
  if (convertApiConfig.legacySecret && !convertApiConfig.token) {
    url.searchParams.set('Secret', convertApiConfig.legacySecret);
  }

  let response;
  const headers = {
    Accept: 'application/json, application/pdf, application/octet-stream',
    'Content-Type': 'application/json',
  };

  if (convertApiConfig.token) {
    headers.Authorization = `Bearer ${convertApiConfig.token}`;
  }

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(convertApiConfig.timeoutMs),
      body: JSON.stringify({
        Parameters: [
          {
            Name: 'StoreFile',
            Value: false,
          },
          {
            Name: 'File',
            FileValue: {
              Name: 'report.xlsx',
              Data: Buffer.from(workbookBuffer).toString('base64'),
            },
          },
        ],
      }),
    });
  } catch (error) {
    throw new ApiError(502, `ConvertAPI Excel-to-PDF request failed: ${error.message}`);
  }

  const responseBuffer = Buffer.from(await response.arrayBuffer());

  if (!response.ok) {
    throw new ApiError(502, `ConvertAPI Excel-to-PDF conversion failed: ${parseConvertApiError(responseBuffer)}`);
  }

  if (bufferLooksLikePdf(responseBuffer)) {
    return responseBuffer;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = JSON.parse(responseBuffer.toString('utf8'));
    const resultFile = payload.Files && payload.Files[0];

    if (resultFile && resultFile.FileData) {
      const pdfBuffer = Buffer.from(resultFile.FileData, 'base64');
      if (bufferLooksLikePdf(pdfBuffer)) return pdfBuffer;
    }

    if (resultFile && resultFile.Url) {
      const fileResponse = await fetch(resultFile.Url, {
        signal: AbortSignal.timeout(convertApiConfig.timeoutMs),
      });
      const pdfBuffer = Buffer.from(await fileResponse.arrayBuffer());
      if (fileResponse.ok && bufferLooksLikePdf(pdfBuffer)) return pdfBuffer;
    }
  }

  throw new ApiError(502, 'ConvertAPI returned a response, but it was not a valid PDF file.');
}

async function workbookToPdfBuffer(workbookBuffer) {
  const convertedBuffer = await tryConvertWorkbookToPdf(workbookBuffer);
  if (convertedBuffer) return convertedBuffer;

  const remoteConvertedBuffer = await tryConvertWorkbookWithConvertApi(workbookBuffer);
  if (remoteConvertedBuffer) return remoteConvertedBuffer;

  throw new ApiError(
    503,
    'Excel-to-PDF conversion is not available. Install LibreOffice/soffice, deploy the backend Docker image, or configure CONVERTAPI_SECRET.'
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
      const pdfBuffer = await workbookToPdfBuffer(workbookBuffer);
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
