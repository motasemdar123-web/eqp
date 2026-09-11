const partsInquiryService = require('../services/partsInquiryService');
const { fetchOutlookInquiries } = require('../services/outlookService');
const { priceInquiryWithPdx } = require('../services/pdxPricingService');

async function syncInquiries(req, res) {
  const { markSynced = true, limit = 50 } = req.body || {};
  const result = await partsInquiryService.syncInquiriesFromOutlook({
    markSynced: Boolean(markSynced),
    limit: Number(limit) || 50,
  });
  res.json({ success: true, ...result });
}

async function listInquiries(req, res) {
  const { status, search, assignedTo, limit, page } = req.query;
  const result = await partsInquiryService.listInquiries({
    status,
    search,
    assignedTo,
    limit: limit ? Number(limit) : 50,
    page: page ? Number(page) : 1,
  });
  res.json({ success: true, ...result });
}

async function getInquiry(req, res) {
  const { id } = req.params;
  const inquiry = await partsInquiryService.getInquiryById(id);
  res.json({ success: true, inquiry });
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const {
    status,
    quotationNo,
    sapOrderNo,
    priority,
    assignedToId,
    assignedToName,
    customerCode,
    markupPercentage,
  } = req.body;

  const updated = await partsInquiryService.updateInquiryStatus(id, {
    status,
    quotationNo,
    sapOrderNo,
    priority,
    assignedToId,
    assignedToName,
    customerCode,
    markupPercentage,
  });
  res.json({ success: true, inquiry: updated });
}

async function addItem(req, res) {
  const { id } = req.params;
  const item = await partsInquiryService.addInquiryItem(id, req.body);
  res.status(201).json({ success: true, item });
}

async function updateItem(req, res) {
  const { itemId } = req.params;
  const item = await partsInquiryService.updateInquiryItem(itemId, req.body);
  res.json({ success: true, item });
}

async function deleteItem(req, res) {
  const { itemId } = req.params;
  await partsInquiryService.deleteInquiryItem(itemId);
  res.json({ success: true, message: 'Item deleted.' });
}

async function priceWithPdx(req, res) {
  const { id } = req.params;
  const { markupPercentage } = req.body || {};
  const result = await priceInquiryWithPdx(id, { markupPercentage });
  res.json(result);
}

async function getOutlookStatus(req, res) {
  try {
    const data = await fetchOutlookInquiries({ limit: 1 });
    res.json({
      success: true,
      online: true,
      account: data.account,
      folder: data.folder,
      totalInFolder: data.totalInFolder,
    });
  } catch (err) {
    res.json({
      success: false,
      online: false,
      error: err.message,
    });
  }
}

module.exports = {
  syncInquiries,
  listInquiries,
  getInquiry,
  updateStatus,
  addItem,
  updateItem,
  deleteItem,
  priceWithPdx,
  getOutlookStatus,
};
