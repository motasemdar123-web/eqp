const fs = require('fs');
const path = require('path');

const CREDS_FILE_PATH = path.join(__dirname, '../../data/user_sap_credentials.json');

function ensureCredsFile() {
  const dir = path.dirname(CREDS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CREDS_FILE_PATH)) {
    // Seed with existing env / default credentials if available
    const initial = {
      default: {
        username: process.env.SAP_PORTAL_USER || 'DAH38',
        password: process.env.SAP_PORTAL_PASSWORD || 'Dah@200055',
        buyer: 'Motasem Ghanem',
        updatedAt: new Date().toISOString(),
      },
    };
    fs.writeFileSync(CREDS_FILE_PATH, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function loadAllCredentials() {
  ensureCredsFile();
  try {
    const raw = fs.readFileSync(CREDS_FILE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getUserSapCredentials(userId = 'default') {
  const all = loadAllCredentials();
  const userCreds = all[userId] || all['default'] || {
    username: process.env.SAP_PORTAL_USER || 'DAH38',
    password: process.env.SAP_PORTAL_PASSWORD || 'Dah@200055',
    buyer: 'Motasem Ghanem',
  };
  return userCreds;
}

function getUserSapCredentialsPublic(userId = 'default') {
  const creds = getUserSapCredentials(userId);
  return {
    username: creds.username || '',
    hasPassword: Boolean(creds.password),
    buyer: creds.buyer || 'Motasem Ghanem',
    updatedAt: creds.updatedAt || null,
  };
}

function saveUserSapCredentials(userId = 'default', { username, password, buyer }) {
  ensureCredsFile();
  const all = loadAllCredentials();
  const current = all[userId] || {};

  all[userId] = {
    username: username !== undefined ? String(username).trim() : current.username || '',
    password: password ? String(password).trim() : current.password || '',
    buyer: buyer !== undefined ? String(buyer).trim() : current.buyer || 'Motasem Ghanem',
    updatedAt: new Date().toISOString(),
  };

  // If this is the primary or first user, also update default
  if (userId === 'default' || !all['default']) {
    all['default'] = { ...all[userId] };
  }

  fs.writeFileSync(CREDS_FILE_PATH, JSON.stringify(all, null, 2), 'utf8');
  return getUserSapCredentialsPublic(userId);
}

module.exports = {
  getUserSapCredentials,
  getUserSapCredentialsPublic,
  saveUserSapCredentials,
};
