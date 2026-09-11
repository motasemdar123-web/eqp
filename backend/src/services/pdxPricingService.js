const { getPrisma } = require('../config/prisma');
const { runBulkInquiry } = require('./komatsuInquiryService');

function requirePrisma() {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Prisma database client is not available.');
  return prisma;
}

/**
 * Fetch PDX prices & stock for all items in an inquiry, and calculate customer selling prices
 */
async function priceInquiryWithPdx(inquiryId, { markupPercentage = 15.0 } = {}) {
  const prisma = requirePrisma();

  const inquiry = await prisma.partsInquiry.findUnique({
    where: { id: inquiryId },
    include: { items: true },
  });

  if (!inquiry) throw new Error('Inquiry not found.');
  if (!inquiry.items || inquiry.items.length === 0) {
    throw new Error('No line items found in this inquiry to query in PDX.');
  }

  const effectiveMarkup = markupPercentage !== undefined ? Number(markupPercentage) : (inquiry.markupPercentage || 15.0);

  // Prepare records for PDX bulk query
  const partRecords = inquiry.items.map((it) => ({
    part_no: it.partNumber,
    quantity: it.quantity || 1,
  }));

  // Execute bulk inquiry against Komatsu portal
  const pdxResult = await runBulkInquiry(partRecords);
  const results = pdxResult?.results || [];

  // Map results by rawPartNumber
  const resultMap = new Map();
  for (const r of results) {
    const cleanKey = (r.rawPartNumber || r.partNumber || '').toUpperCase().trim();
    if (cleanKey && !resultMap.has(cleanKey)) {
      resultMap.set(cleanKey, r);
    }
  }

  const updatedItems = [];

  for (const item of inquiry.items) {
    const match = resultMap.get(item.partNumber.toUpperCase().trim());
    if (match) {
      const rawPrice = parseFloat(match.dnetPrice || '0') || 0;
      const stockDesc = `KME: ${match.kmeStock || 0} | Japan: ${match.kltdTotal || 0}${match.leadTime ? ` | Lead: ${match.leadTime}` : ''}`;
      
      const costPrice = rawPrice;
      const sellingPrice = costPrice > 0 ? costPrice * (1 + effectiveMarkup / 100) : 0;
      const totalPrice = sellingPrice * item.quantity;

      const updated = await prisma.partsInquiryItem.update({
        where: { id: item.id },
        data: {
          description: item.description || match.description || null,
          costPrice,
          sellingPrice,
          unitPrice: sellingPrice,
          totalPrice,
          komatsuStock: stockDesc,
        },
      });
      updatedItems.push(updated);
    } else {
      updatedItems.push(item);
    }
  }

  // Update inquiry status to PRICED and save markup
  const updatedInquiry = await prisma.partsInquiry.update({
    where: { id: inquiryId },
    data: {
      status: inquiry.status === 'NEW' ? 'PRICED' : inquiry.status,
      markupPercentage: effectiveMarkup,
    },
    include: { items: true, attachments: true },
  });

  return {
    success: true,
    inquiry: updatedInquiry,
    totalPriced: updatedItems.filter((i) => (i.costPrice || 0) > 0).length,
    totalItems: inquiry.items.length,
    pdxRawResult: pdxResult,
  };
}

module.exports = {
  priceInquiryWithPdx,
};
