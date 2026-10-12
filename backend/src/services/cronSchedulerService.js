const { runSync } = require('./komatsuSyncService');

// Kuwait Time (UTC+3) schedule targets: 07:00, 11:00, 14:00, 18:00
const SCHEDULED_TIMES = new Set(['07:00', '11:00', '14:00', '18:00']);

let intervalHandle = null;
let lastTriggeredMinute = null;

/**
 * Returns current Kuwait time (UTC+3) as HH:MM
 */
function getKuwaitTimeString(date = new Date()) {
  // Kuwait is fixed UTC+3
  const kuwaitTime = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const hours = String(kuwaitTime.getUTCHours()).padStart(2, '0');
  const minutes = String(kuwaitTime.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Tick function executed every 30 seconds
 */
async function checkScheduleTick() {
  const now = new Date();
  const timeStr = getKuwaitTimeString(now);

  if (SCHEDULED_TIMES.has(timeStr) && lastTriggeredMinute !== timeStr) {
    lastTriggeredMinute = timeStr;
    console.log(`[cronScheduler] Firing scheduled Komatsu Sync at Kuwait Time ${timeStr}`);
    try {
      await runSync({
        triggerType: 'SCHEDULED_CRON',
        triggeredByName: 'Automated 4x Daily Scheduler',
      });
      console.log(`[cronScheduler] Scheduled Komatsu Sync at ${timeStr} finished successfully.`);
    } catch (err) {
      console.error(`[cronScheduler] Scheduled Komatsu Sync at ${timeStr} error:`, err.message);
    }
  }
}

/**
 * Starts the background cron scheduler
 */
function startScheduler() {
  if (intervalHandle) return;

  console.log('[cronScheduler] Starting Komatsu 4x daily scheduler (07:00, 11:00, 14:00, 18:00 AST/UTC+3)');
  // Check every 30 seconds to catch exact minute boundaries
  intervalHandle = setInterval(checkScheduleTick, 30000);
  // Also unref interval so it won't block tests or process exits if needed
  if (intervalHandle.unref) {
    intervalHandle.unref();
  }
}

/**
 * Stops the background scheduler
 */
function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[cronScheduler] Komatsu scheduler stopped.');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  getKuwaitTimeString,
  SCHEDULED_TIMES,
};
