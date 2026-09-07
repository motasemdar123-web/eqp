const EQP_BACKEND_URL = "https://eqp-1.onrender.com/api/komatsu/cookie";

async function getKomatsuCookieString() {
  const cookies = await chrome.cookies.getAll({ domain: "komatsu.ae" });
  if (!cookies || cookies.length === 0) {
    throw new Error("No cookies found for komatsu.ae. Please ensure you are logged in to the Komatsu portal.");
  }
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function showStatus(msg, isSuccess) {
  const st = document.getElementById("status");
  st.style.display = "block";
  st.className = isSuccess ? "success" : "error";
  st.textContent = msg;
}

document.getElementById("btnCopy").addEventListener("click", async () => {
  try {
    const cookieStr = await getKomatsuCookieString();
    await navigator.clipboard.writeText(cookieStr);
    showStatus("✓ Full Cookie copied to clipboard! Paste it into the EQP modal.", true);
  } catch (err) {
    showStatus(err.message, false);
  }
});

document.getElementById("btnSync").addEventListener("click", async () => {
  try {
    showStatus("Syncing session with EQP server...", true);
    const cookieStr = await getKomatsuCookieString();

    const resp = await fetch(EQP_BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cookie: cookieStr }),
    });

    const data = await resp.json();
    if (data.success && data.connected) {
      showStatus("✓ Connected: " + (data.message || "PDX authenticated!"), true);
    } else {
      showStatus("Server responded: " + (data.message || "Cookie verification failed"), false);
    }
  } catch (err) {
    showStatus("Sync error: " + err.message, false);
  }
});
