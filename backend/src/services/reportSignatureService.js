const fs = require('fs-extra');
const path = require('path');

const DEFAULT_SIGNATURE_ROOT = path.join(__dirname, '..', '..', 'signatures');

function normalizeSignatureKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function signatureKeys(user) {
  const fullName = user?.full_name || user?.fullName || '';
  const firstName = String(fullName).trim().split(/\s+/)[0] || '';
  const emailName = String(user?.email || '').split('@')[0];
  const values = [
    fullName,
    emailName,
    firstName,
    user?.user_number || user?.userNumber,
    user?.id,
  ];

  return [...new Set(values.map(normalizeSignatureKey).filter(Boolean))];
}

function findSignaturePath(user, signatureRoot = DEFAULT_SIGNATURE_ROOT) {
  if (!fs.existsSync(signatureRoot)) return null;

  const files = fs
    .readdirSync(signatureRoot)
    .filter((fileName) => fileName.toLowerCase().endsWith('.png'));
  const filesByLowerName = new Map(files.map((fileName) => [fileName.toLowerCase(), fileName]));
  const prefixes = signatureKeys(user).map((key) => `${key}-signature`);

  for (const prefix of prefixes) {
    const exactFile = filesByLowerName.get(`${prefix}.png`);
    if (exactFile) return path.join(signatureRoot, exactFile);
  }

  for (const prefix of prefixes) {
    const legacyFile = files.find((fileName) => fileName.toLowerCase().startsWith(prefix));
    if (legacyFile) return path.join(signatureRoot, legacyFile);
  }

  return null;
}

function getSignatureStatus(user, signatureRoot = DEFAULT_SIGNATURE_ROOT) {
  const signaturePath = findSignaturePath(user, signatureRoot);

  return {
    available: Boolean(signaturePath),
    path: signaturePath,
    fileName: signaturePath ? path.basename(signaturePath) : null,
  };
}

module.exports = {
  findSignaturePath,
  getSignatureStatus,
  normalizeSignatureKey,
};
