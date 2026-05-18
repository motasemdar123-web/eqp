const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { ApiError } = require('../utils/ApiError');

const uploadRoot = path.join(os.tmpdir(), 'eqp-manual-uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadRoot);
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/[^a-z0-9._-]+/gi, '-').slice(-120);
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const manualUpload = multer({
  storage,
  limits: {
    fileSize: 180 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (!isPdf) {
      callback(new ApiError(400, 'Only PDF shop manuals can be uploaded.'));
      return;
    }
    callback(null, true);
  },
});

module.exports = {
  manualUpload,
};
