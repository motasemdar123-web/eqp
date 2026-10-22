# EQP Komatsu PDX Session Sync Extension

This Edge/Chrome extension keeps the EQP System connected to the Komatsu PDX portal. Whenever your PDX login cookie changes (you log in, or PDX refreshes your session), the extension sends it to the EQP server automatically, including the HttpOnly `.AspNet.Cookies` login ticket.

### Server setup (one time, admin)

1. Generate a long random secret, for example: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Set it as the `PDX_SYNC_TOKEN` environment variable on the EQP backend (Render ➔ Environment) and redeploy.
3. Optional: `PDX_KEEPALIVE_MINUTES` (default `10`, `0` disables) controls how often the server pings PDX to keep the session alive.

### Installation in Microsoft Edge / Chrome (1-time setup)

1. Open **Microsoft Edge** and go to `edge://extensions` (or in Chrome: `chrome://extensions`).
2. Turn ON **"Developer mode"**.
3. Click **"Load unpacked"** and select this folder (`tools/pdx-sync-extension`). If an older version is installed, click **Reload** on it instead.
4. Pin the "EQP - Komatsu PDX Session Sync" extension, open it, paste the sync token, and click **Save Settings**.

### How it works

- Log in to Komatsu PDX in Edge as usual. Within a few seconds the session is synced to EQP; nothing to click.
- The extension also checks every 15 minutes and only sends the cookie when it changed.
- A red **!** on the extension icon means the last sync failed; open the popup to see why.
- **Sync Now** forces a sync; **Copy Full Cookie** copies it for pasting into the EQP modal manually.
- The EQP server keeps the session alive by itself between your logins and alerts admins when PDX ends the session.
