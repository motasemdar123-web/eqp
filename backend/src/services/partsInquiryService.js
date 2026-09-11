const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const pdfParse = require('pdf-parse');
const { getPrisma } = require('../config/prisma');
const { fetchOutlookInquiries } = require('./outlookService');

function requirePrisma() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error('Prisma database client is not available.');
  }
  return prisma;
}

const PART_REGEX = /\b([0-9]{2}[0-9A-Z]-[0-9]{2}-[0-9]{5}|[0-9]{4}-[0-9]{2}-[0-9]{5}|[0-9]{5}-[0-9]{5})\b/gi;

/**
 * Heuristic regex parser to extract Komatsu and heavy equipment part numbers from text
 */
function extractPartsFromText(text) {
  if (!text) return [];

  const items = [];
  const lines = text.split(/\r?\n/);
  const seen = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match;
    const regex = new RegExp(PART_REGEX);
    while ((match = regex.exec(trimmed)) !== null) {
      const pNo = match[1].toUpperCase();
      if (seen.has(pNo)) continue;
      seen.add(pNo);

      // Attempt to extract quantity from the remainder of the line
      let quantity = 1;
      const afterPart = trimmed.substring(match.index + pNo.length);
      const qtyMatch = afterPart.match(/(?:[,:\s-xX*]|\bqty\b|\bquantity\b)*\s*(\d{1,4})/i);
      if (qtyMatch && qtyMatch[1]) {
        const parsedQty = parseInt(qtyMatch[1], 10);
        if (parsedQty > 0 && parsedQty < 10000) {
          quantity = parsedQty;
        }
      }

      // Check if there's description text
      let desc = null;
      const descMatch = afterPart.replace(/(?:[,:\s-xX*]|\bqty\b|\bquantity\b)*\s*\d{1,4}/i, '').trim();
      if (descMatch && descMatch.length > 2 && descMatch.length < 80) {
        desc = descMatch.replace(/^[-–:,]\s*/, '').trim();
      }

      items.push({
        partNumber: pNo,
        description: desc,
        quantity,
      });
    }
  }

  return items;
}

/**
 * Automatically scan attached Excel (.xlsx) and PDF quotation requests for parts
 */
async function extractPartsFromAttachmentFile(filePath, fileName = '') {
  const items = [];
  const lowerName = fileName.toLowerCase();

  try {
    if (!fs.existsSync(filePath)) return items;

    if (lowerName.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const seen = new Set();
      workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
          const values = row.values;
          if (!Array.isArray(values)) return;

          let rowPart = null;
          let rowQty = 1;
          let rowDesc = null;

          for (let i = 1; i < values.length; i++) {
            const cellVal = String(values[i] ?? '').trim();
            if (!cellVal) continue;

            const matches = cellVal.match(PART_REGEX);
            if (matches && matches.length > 0 && !rowPart) {
              rowPart = matches[0].toUpperCase();
            } else if (/^\d{1,4}$/.test(cellVal) && rowPart) {
              const q = parseInt(cellVal, 10);
              if (q > 0 && q < 10000) rowQty = q;
            } else if (cellVal.length > 3 && cellVal.length < 80 && !rowDesc && !matches) {
              rowDesc = cellVal;
            }
          }

          if (rowPart && !seen.has(rowPart)) {
            seen.add(rowPart);
            items.push({
              partNumber: rowPart,
              description: rowDesc,
              quantity: rowQty,
            });
          }
        });
      });
    } else if (lowerName.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      if (pdfData && pdfData.text) {
        const parsed = extractPartsFromText(pdfData.text);
        items.push(...parsed);
      }
    }
  } catch (err) {
    console.warn(`[PARSER] Failed parsing parts from attachment ${fileName}:`, err.message);
  }

  return items;
}

function deriveCompanyName(email, name = '') {
  if (!email || !email.includes('@')) return name || 'Unknown Customer';
  const domain = email.split('@')[1].toLowerCase();

  const freeDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
  if (freeDomains.includes(domain)) {
    return name || email.split('@')[0];
  }

  const parts = domain.split('.');
  const company = parts[0];
  return company.charAt(0).toUpperCase() + company.slice(1);
}

async function getNextInquiryNo(prisma) {
  const count = await prisma.partsInquiry.count();
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `INQ-${year}-${seq}`;
}

/**
 * Sync inquiries from Outlook "Parts Inquiries" folder into PostgreSQL
 */
async function syncInquiriesFromOutlook({ markSynced = true, limit = 50 } = {}) {
  const prisma = requirePrisma();
  const result = await fetchOutlookInquiries({ unsyncedOnly: false, markSynced, limit });

  if (!result || !Array.isArray(result.items)) {
    return {
      syncedCount: 0,
      newCount: 0,
      totalInFolder: result?.totalInFolder || 0,
      message: result?.message || 'No items returned from Outlook.',
    };
  }

  let newCount = 0;
  let updatedCount = 0;

  for (const mail of result.items) {
    if (!mail.entryID) continue;

    let inquiry = await prisma.partsInquiry.findUnique({
      where: { sourceMessageId: mail.entryID },
      include: { attachments: true, items: true },
    });

    if (!inquiry) {
      const inquiryNo = await getNextInquiryNo(prisma);
      const customerEmail = (mail.senderEmail || 'unknown@customer.com').toLowerCase();
      const customerName = mail.senderName || customerEmail.split('@')[0];
      const companyName = deriveCompanyName(customerEmail, customerName);

      // Attribution: Detect if sent to Mohammad Qraein vs Motasem Ghanem
      const assignedToName = mail.assignedToName || 'Motasem Ghanem';
      const recipientEmail = mail.recipientEmail || 'motasem.ghanem@daralhai.com';

      // 1. Extract parts from email body
      const extractedParts = extractPartsFromText(mail.body || '');
      const partsSet = new Set(extractedParts.map((p) => p.partNumber));

      // 2. Extract parts from attached Excel (.xlsx) or PDF RFQs
      if (Array.isArray(mail.attachments)) {
        for (const att of mail.attachments) {
          if (att.filePath) {
            const attParts = await extractPartsFromAttachmentFile(att.filePath, att.fileName);
            for (const ap of attParts) {
              if (!partsSet.has(ap.partNumber)) {
                partsSet.add(ap.partNumber);
                extractedParts.push(ap);
              }
            }
          }
        }
      }

      inquiry = await prisma.partsInquiry.create({
        data: {
          inquiryNo,
          sourceMessageId: mail.entryID,
          conversationId: mail.conversationID,
          recipientEmail,
          assignedToName,
          customerEmail,
          customerName,
          companyName,
          subject: mail.subject || '(No Subject)',
          bodyText: mail.body || '',
          status: 'NEW',
          receivedAt: mail.receivedAt ? new Date(mail.receivedAt) : new Date(),
          items: {
            create: extractedParts.map((p) => ({
              partNumber: p.partNumber,
              description: p.description,
              quantity: p.quantity,
            })),
          },
          attachments: {
            create: (mail.attachments || []).map((att) => ({
              fileName: att.fileName,
              fileSize: att.fileSize,
              filePath: att.filePath,
              fileUrl: att.relativePath ? `/${att.relativePath.replace(/\\/g, '/')}` : null,
            })),
          },
        },
      });

      newCount++;
    } else {
      // Sync any newly added attachments if they were missing
      if (mail.attachments && mail.attachments.length > (inquiry.attachments?.length || 0)) {
        for (const att of mail.attachments) {
          const exists = inquiry.attachments?.some((a) => a.fileName === att.fileName);
          if (!exists) {
            await prisma.partsInquiryAttachment.create({
              data: {
                inquiryId: inquiry.id,
                fileName: att.fileName,
                fileSize: att.fileSize,
                filePath: att.filePath,
                fileUrl: att.relativePath ? `/${att.relativePath.replace(/\\/g, '/')}` : null,
              },
            });
          }
        }
        updatedCount++;
      }
    }
  }

  return {
    success: true,
    totalInFolder: result.totalInFolder || 0,
    newInquiriesCreated: newCount,
    existingUpdated: updatedCount,
    account: result.account,
    folder: result.folder,
  };
}

async function listInquiries({ status, search, assignedTo, limit = 50, page = 1 } = {}) {
  const prisma = requirePrisma();
  const where = { deletedAt: null };

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (assignedTo && assignedTo !== 'ALL') {
    where.assignedToName = { contains: assignedTo, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { inquiryNo: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { quotationNo: { contains: search, mode: 'insensitive' } },
      { sapOrderNo: { contains: search, mode: 'insensitive' } },
      { assignedToName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [total, inquiries, statusCounts] = await Promise.all([
    prisma.partsInquiry.count({ where }),
    prisma.partsInquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { receivedAt: 'desc' },
      include: {
        items: true,
        attachments: true,
      },
    }),
    prisma.partsInquiry.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const countsMap = {
    NEW: 0,
    IN_REVIEW: 0,
    PRICED: 0,
    QUOTED: 0,
    PO_RECEIVED: 0,
    CONVERTED_TO_SO: 0,
    CLOSED_LOST: 0,
  };

  for (const sc of statusCounts) {
    countsMap[sc.status] = sc._count.id;
  }

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    counts: countsMap,
    inquiries,
  };
}

async function getInquiryById(id) {
  const prisma = requirePrisma();
  const inquiry = await prisma.partsInquiry.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
      attachments: true,
    },
  });

  if (!inquiry || inquiry.deletedAt) {
    throw new Error('Inquiry not found.');
  }

  return inquiry;
}

async function updateInquiryStatus(id, {
  status,
  quotationNo,
  sapOrderNo,
  priority,
  assignedToId,
  assignedToName,
  customerCode,
  markupPercentage,
}) {
  const prisma = requirePrisma();
  const data = {};
  if (status) data.status = status;
  if (quotationNo !== undefined) data.quotationNo = quotationNo;
  if (sapOrderNo !== undefined) data.sapOrderNo = sapOrderNo;
  if (priority) data.priority = priority;
  if (assignedToId !== undefined) data.assignedToId = assignedToId;
  if (assignedToName !== undefined) data.assignedToName = assignedToName;
  if (customerCode !== undefined) data.customerCode = customerCode;
  if (markupPercentage !== undefined) data.markupPercentage = parseFloat(markupPercentage) || 15.0;

  return await prisma.partsInquiry.update({
    where: { id },
    data,
    include: { items: true, attachments: true },
  });
}

async function addInquiryItem(inquiryId, { partNumber, description, quantity = 1, costPrice, sellingPrice, unitPrice, notes }) {
  const prisma = requirePrisma();
  const cleanPart = String(partNumber || '').trim().toUpperCase();
  if (!cleanPart) throw new Error('Part number is required.');

  const qty = parseInt(quantity, 10) || 1;
  const cost = costPrice !== undefined && costPrice !== null ? parseFloat(costPrice) : null;
  const unit = (sellingPrice !== undefined && sellingPrice !== null)
    ? parseFloat(sellingPrice)
    : (unitPrice !== undefined && unitPrice !== null ? parseFloat(unitPrice) : cost);
  const totalPrice = unit !== null ? unit * qty : null;

  return await prisma.partsInquiryItem.create({
    data: {
      inquiryId,
      partNumber: cleanPart,
      description: description || null,
      quantity: qty,
      costPrice: cost,
      sellingPrice: unit,
      unitPrice: unit,
      totalPrice,
      notes: notes || null,
    },
  });
}

async function updateInquiryItem(itemId, { partNumber, description, quantity, costPrice, sellingPrice, unitPrice, komatsuStock, notes }) {
  const prisma = requirePrisma();
  const data = {};
  if (partNumber) data.partNumber = String(partNumber).trim().toUpperCase();
  if (description !== undefined) data.description = description;
  if (quantity !== undefined) data.quantity = parseInt(quantity, 10) || 1;
  if (costPrice !== undefined) data.costPrice = costPrice !== null ? parseFloat(costPrice) : null;
  if (sellingPrice !== undefined) data.sellingPrice = sellingPrice !== null ? parseFloat(sellingPrice) : null;
  if (unitPrice !== undefined) data.unitPrice = unitPrice !== null ? parseFloat(unitPrice) : null;
  if (komatsuStock !== undefined) data.komatsuStock = komatsuStock;
  if (notes !== undefined) data.notes = notes;

  const existing = await prisma.partsInquiryItem.findUnique({ where: { id: itemId } });
  if (existing) {
    const finalQty = data.quantity !== undefined ? data.quantity : existing.quantity;
    const finalUnit = data.sellingPrice !== undefined
      ? data.sellingPrice
      : (data.unitPrice !== undefined ? data.unitPrice : existing.unitPrice);
    data.totalPrice = finalUnit !== null ? finalUnit * finalQty : null;
  }

  return await prisma.partsInquiryItem.update({
    where: { id: itemId },
    data,
  });
}

async function deleteInquiryItem(itemId) {
  const prisma = requirePrisma();
  return await prisma.partsInquiryItem.delete({
    where: { id: itemId },
  });
}

module.exports = {
  syncInquiriesFromOutlook,
  listInquiries,
  getInquiryById,
  updateInquiryStatus,
  addInquiryItem,
  updateInquiryItem,
  deleteInquiryItem,
  extractPartsFromText,
  extractPartsFromAttachmentFile,
};
