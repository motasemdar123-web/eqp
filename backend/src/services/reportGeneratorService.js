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
  const commands = [...new Set([
    process.env.LIBREOFFICE_BIN,
    'soffice',
    'libreoffice',
  ].filter(Boolean))];
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

async function workbookToPdfBuffer(workbookBuffer) {
  const convertedBuffer = await tryConvertWorkbookToPdf(workbookBuffer);
  if (convertedBuffer) return convertedBuffer;

  throw new ApiError(
    503,
    'Excel-to-PDF conversion is not available. Install LibreOffice/soffice on the backend environment or deploy the backend Docker image.'
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

module.exports = { generateReports };
