const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const PS_SCRIPT = path.resolve(__dirname, '../../../tools/outlook-bridge/read_inquiries.ps1');

function runPowerShellReader(args = []) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PS_SCRIPT)) {
      return reject(new Error(`Outlook PowerShell script not found at ${PS_SCRIPT}`));
    }

    const fullArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, ...args];
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
