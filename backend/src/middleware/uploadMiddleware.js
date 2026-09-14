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
    fileSize: Number(process.env.MANUAL_UPLOAD_MAX_MB || 512) * 1024 * 1024,
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

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const isAudio = String(file.mimetype || '').startsWith('audio/')
      || /\.(webm|mp3|mp4|m4a|wav|ogg)$/i.test(file.originalname || '');
    if (!isAudio) {
      callback(new ApiError(400, 'Only audio recordings can be uploaded.'));
      return;
    }
    callback(null, true);
  },
});

const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (!isPdf) {
      callback(new ApiError(400, 'Only PDF report files can be uploaded.'));
      return;
    }
    callback(null, true);
  },
});

const mediaAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per asset
    files: 1,
  },
  fileFilter(req, file, callback) {
    // Allow images, videos, audio, PDFs, design files (PSD, AI, FIG), and archives (ZIP, RAR)
    const allowedRegex = /\.(jpe?g|png|gif|webp|svg|mp4|mov|webm|avi|mkv|pdf|psd|ai|fig|zip|rar)$/i;
    const isMimeAllowed =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'application/octet-stream';

    if (!isMimeAllowed && !allowedRegex.test(file.originalname)) {
      callback(new ApiError(400, 'File format not supported for media asset uploads.'));
      return;
    }
    callback(null, true);
  },
});

module.exports = {
  manualUpload,
  audioUpload,
  reportUpload,
  mediaAssetUpload,
};

