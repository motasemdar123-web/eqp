const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

function resolveModule(name) {
  try {
    return require(name);
  } catch (err) {
    try {
      return require(path.join(__dirname, '../../backend/node_modules', name));
    } catch {
      throw new Error(`Module "${name}" not found.`);
    }
  }
}

const express = resolveModule('express');
const cors = resolveModule('cors');

const app = express();
const PORT = process.env.OUTLOOK_BRIDGE_PORT || 5008;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const PS_SCRIPT = path.join(__dirname, 'read_inquiries.ps1');

function runPowerShellScript(args = []) {
  return new Promise((resolve, reject) => {
    const fullArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, ...args];
    execFile('powershell.exe', fullArgs, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const jsonMatch = stdout.trim().match(/\{[\s\S]*\}$/);
        if (!jsonMatch) {
          return reject(new Error('Invalid script response: ' + stdout));
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

app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'ONLINE',
      bridge: 'OUTLOOK_LOCAL_BRIDGE',
      version: '1.0.0',
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

app.get('/api/outlook/inquiries', async (req, res) => {
  try {
    const unsyncedOnly = req.query.unsynced === 'true';
    const markSynced = req.query.mark === 'true';
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const args = [];
    if (unsyncedOnly) args.push('-UnsyncedOnly');
    if (markSynced) args.push('-MarkSynced');
    if (limit) args.push('-Limit', String(limit));

    const result = await runPowerShellScript(args);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[OUTLOOK-BRIDGE] Outlook Local Bridge running on http://localhost:${PORT}`);
});

module.exports = { app, runPowerShellScript };
