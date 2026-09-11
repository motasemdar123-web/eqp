const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

function getScriptPath() {
  const candidates = [
    path.resolve(__dirname, '../../../tools/outlook-bridge/read_inquiries.ps1'),
    path.resolve(__dirname, '../../tools/outlook-bridge/read_inquiries.ps1'),
    path.resolve(process.cwd(), 'tools/outlook-bridge/read_inquiries.ps1'),
    path.resolve(process.cwd(), '../tools/outlook-bridge/read_inquiries.ps1'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function runPowerShellReader(args = []) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      return resolve({
        status: 'BRIDGE_REQUIRED',
        message: 'Server environment is Linux/Docker. Outlook MAPI sync must be executed via the Local Outlook Bridge on your Windows PC (Port 5008).',
        items: [],
        totalInFolder: 0,
      });
    }

    const scriptPath = getScriptPath();
    if (!scriptPath) {
      return resolve({
        status: 'BRIDGE_REQUIRED',
        message: 'Outlook companion script not found on backend server. Please run the Local Outlook Bridge on your PC.',
        items: [],
        totalInFolder: 0,
      });
    }

    const fullArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args];
    execFile('powershell.exe', fullArgs, { maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const jsonMatch = stdout.trim().match(/\{[\s\S]*\}$/);
        if (!jsonMatch) {
          return reject(new Error('Invalid PowerShell response: ' + stdout));
        }
        const data = JSON.parse(jsonMatch[0]);
        if (data.status === 'ERROR') {
          return reject(new Error(data.message || 'PowerShell execution failed'));
        }
        resolve(data);
      } catch (parseErr) {
        reject(new Error('JSON Parse failed: ' + parseErr.message + '\nOutput: ' + stdout));
      }
    });
  });
}

/**
 * Fetch inquiries from the Outlook "Parts Inquiries" folder.
 * Tries local direct PowerShell first, or fallback to companion bridge if configured.
 */
async function fetchOutlookInquiries({ unsyncedOnly = false, markSynced = false, limit = 50 } = {}) {
  const args = [];
  if (unsyncedOnly) args.push('-UnsyncedOnly');
  if (markSynced) args.push('-MarkSynced');
  if (limit) args.push('-Limit', String(limit));

  return await runPowerShellReader(args);
}

module.exports = {
  fetchOutlookInquiries,
  runPowerShellReader,
};
