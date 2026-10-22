const DEFAULTS = {
  serverUrl: "https://eqp-1.onrender.com",
  syncToken: "",
  autoSync: true,
  lastSync: null,
};

function showStatus(msg, isSuccess) {
  const st = document.getElementById("status");
  st.style.display = "block";
  st.className = isSuccess ? "success" : "error";
  st.textContent = msg;
}

function renderLastSync(lastSync) {
  const el = document.getElementById("lastSync");
  if (!lastSync) {
    el.textContent = "No sync yet.";
    return;
  }
  const when = new Date(lastSync.at).toLocaleString();
  el.textContent = `${lastSync.ok ? "✓" : "✕"} ${lastSync.message} (${lastSync.reason}, ${when})`;
  el.className = lastSync.ok ? "last ok" : "last bad";
}

async function load() {
  const s = await chrome.storage.local.get(DEFAULTS);
  document.getElementById("serverUrl").value = s.serverUrl;
  document.getElementById("syncToken").value = s.syncToken;
  document.getElementById("autoSync").checked = s.autoSync;
  renderLastSync(s.lastSync);
}

document.getElementById("btnSave").addEventListener("click", async () => {
  const serverUrl = document.getElementById("serverUrl").value.trim() || DEFAULTS.serverUrl;
  const syncToken = document.getElementById("syncToken").value.trim();
  const autoSync = document.getElementById("autoSync").checked;
  // Clearing the hash makes the next sync send the cookie to the (possibly new) server.
  await chrome.storage.local.set({ serverUrl, syncToken, autoSync, lastSyncedHash: "" });
  showStatus("Settings saved.", true);
});

document.getElementById("btnSync").addEventListener("click", async () => {
  showStatus("Syncing session with EQP server...", true);
  const result = await chrome.runtime.sendMessage({ type: "sync-now" });
  showStatus(result?.message || "No response from background worker.", Boolean(result?.ok));
  const { lastSync } = await chrome.storage.local.get({ lastSync: null });
  renderLastSync(lastSync);
});

document.getElementById("btnCopy").addEventListener("click", async () => {
  try {
    const { cookie, hasAuth } = await chrome.runtime.sendMessage({ type: "get-cookie" });
    if (!hasAuth) {
      showStatus("Not logged in to Komatsu PDX in this browser.", false);
      return;
    }
    await navigator.clipboard.writeText(cookie);
    showStatus("✓ Full Cookie copied to clipboard! Paste it into the EQP modal.", true);
  } catch (err) {
    showStatus(err.message, false);
  }
});

load();
