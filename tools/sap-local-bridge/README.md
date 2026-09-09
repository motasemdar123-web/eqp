# SAP Local Bridge Companion Agent

The **SAP Local Bridge** is a lightweight local desktop runner designed to execute SAP Business One Purchase Order automations directly from your office PC.

## Why Use the Local Bridge?
- **Bypasses Cloud Firewalls:** Since your office PC is inside the company network, it connects to `https://daralhai.b1pro.com/` directly without getting blocked by the Cisco Meraki firewall.
- **Ultra Fast:** Navigation, credential submission, and document posting happen in seconds over your local high-speed connection.
- **Instant Live Feedback:** Watch the real-time logs and confirmation screenshot right in your web browser interface.

## How to Run:
1. Double-click **`start-bridge.bat`**.
2. Keep the command prompt window open.
3. In the EQP Web App under Parts Inquiry, open **"Create SAP Purchase Order"**.
4. The system will automatically detect:
   `🟢 Local Bridge Connected (Office Network Access)`
5. Click **"🚀 Automate in SAP (Canvas)"** — the bridge will handle the entry locally and report success!
