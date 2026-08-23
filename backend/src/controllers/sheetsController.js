const sheetsRepository = require('../repositories/sheetsRepository');

async function manifest(req, res) {
  const data = sheetsRepository.getManifest();
  res.json({ success: true, data });
}

async function getSheet(req, res) {
  const { sheetId } = req.params;
  const { query, page, limit, sortField, sortOrder } = req.query;
  const data = sheetsRepository.getSheetData(sheetId, { query, page, limit, sortField, sortOrder });
  res.json({ success: true, data });
}

async function sapSearch(req, res) {
  const { query, page, limit, sortField, sortOrder } = req.query;
  const data = sheetsRepository.searchSap({ query, page, limit, sortField, sortOrder });
  res.json({ success: true, data });
}

async function customers(req, res) {
  const { query, page, limit, sortField, sortOrder } = req.query;
  const data = sheetsRepository.getCustomers({ query, page, limit, sortField, sortOrder });
  res.json({ success: true, data });
}

async function people(req, res) {
  const { query, page, limit, sortField, sortOrder } = req.query;
  const data = sheetsRepository.getPeopleDirectory({ query, page, limit, sortField, sortOrder });
  res.json({ success: true, data });
}

async function toolCustody(req, res) {
  const { query, page, limit, sortField, sortOrder } = req.query;
  const data = sheetsRepository.getToolCustody({ query, page, limit, sortField, sortOrder });
  res.json({ success: true, data });
}

module.exports = {
  manifest,
  getSheet,
  sapSearch,
  customers,
  people,
  toolCustody,
};
