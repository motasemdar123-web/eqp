const DEFAULT_SETTINGS = {
  serverUrl: "https://eqp-1.onrender.com",
  syncToken: "",
  autoSync: true,
  lastSyncedHash: "",
  lastSync: null,
};
const AUTH_COOKIE = /^\.AspNet\.Cookies(C\d+)?$/;
const WATCHED_COOKIE = /^(\.AspNet\.Cookies(C\d+)?|ASP\.NET_SessionId)$/;
const DEBOUNCE_MS = 3000;
const PERIODIC_ALARM = "pdx-sync-periodic";

let debounceTimer = null;

async function getSettings() {
  return chrome.storage.local.get(DEFAULT_SETTINGS);
}

async function getKomatsuCookieString() {
  const cookies = await chrome.cookies.getAll({ domain: "komatsu.ae" });
  return (cookies || []).map((c) => `${c.name}=${c.value}`).join("; ");
}

function hasAuthTicket(cookieStr) {
  return cookieStr.split(";").some((part) => {
    const [name, ...value] = part.trim().split("=");
    return AUTH_COOKIE.test(name) && value.join("=").length > 0;
  });
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function recordResult(result) {
  await chrome.storage.local.set({ lastSync: { ...result, at: new Date().toISOString() } });
  chrome.action.setBadgeText({ text: result.ok ? "" : "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  return result;
}

// force: send even when the cookie hasn't changed since the last successful sync (manual button).
async function syncNow({ force = false, reason = "manual" } = {}) {
  const settings = await getSettings();
  if (!force && !settings.autoSync) {
    return { ok: true, skipped: true, message: "Auto-sync is off." };
  }

  const cookieStr = await getKomatsuCookieString();
  if (!hasAuthTicket(cookieStr)) {
    return recordResult({ ok: false, reason, message: "Not logged in to Komatsu PDX in this browser." });
  }

  // Unchanged cookie: the server already has it (and may hold a fresher, self-refreshed copy), so don't resend.
  const hash = await sha256(cookieStr);
  if (!force && hash === settings.lastSyncedHash) {
    return { ok: true, skipped: true, message: "Session unchanged." };
  }

  if (!settings.syncToken) {
    return recordResult({ ok: false, reason, message: "Set the sync token in the extension popup first." });
  }

  try {
    const resp = await fetch(`${settings.serverUrl.replace(/\/+$/, "")}/api/komatsu/cookie`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PDX-Sync-Token": settings.syncToken,
      },
      body: JSON.stringify({ cookie: cookieStr }),
    });
    const data = await resp.json().catch(() => ({}));

    if (resp.ok && data.success) {
      await chrome.storage.local.set({ lastSyncedHash: hash });
      return recordResult({
        ok: Boolean(data.connected),
        reason,
        message: data.connected ? data.message || "PDX session synced." : data.message || "Synced, but PDX reports the session is not active.",
      });
    }
    return recordResult({ ok: false, reason, message: data.message || `Server returned ${resp.status}.` });
  } catch (err) {
    return recordResult({ ok: false, reason, message: `Sync error: ${err.message}` });
  }
}

function scheduleSync(reason) {
  clearTimeout(debounceTimer);
  // PDX sets several cookies in a burst on login; wait for it to settle before sending.
  debounceTimer = setTimeout(() => {
    syncNow({ reason }).catch(() => {});
  }, DEBOUNCE_MS);
}

chrome.cookies.onChanged.addListener(({ removed, cookie }) => {
  if (removed || !cookie || !cookie.domain.endsWith("komatsu.ae")) return;
  if (!WATCHED_COOKIE.test(cookie.name)) return;
  scheduleSync("cookie-changed");
});

function ensurePeriodicAlarm() {
  chrome.alarms.create(PERIODIC_ALARM, { periodInMinutes: 15 });
}

chrome.runtime.onInstalled.addListener(() => {
  ensurePeriodicAlarm();
  scheduleSync("installed");
});

chrome.runtime.onStartup.addListener(() => {
  ensurePeriodicAlarm();
  scheduleSync("browser-started");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === PERIODIC_ALARM) {
    syncNow({ reason: "periodic" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "sync-now") {
    syncNow({ force: true, reason: "manual" }).then(sendResponse);
    return true;
  }
  if (message?.type === "get-cookie") {
    getKomatsuCookieString().then((cookie) => sendResponse({ cookie, hasAuth: hasAuthTicket(cookie) }));
    return true;
  }
  return false;
});
