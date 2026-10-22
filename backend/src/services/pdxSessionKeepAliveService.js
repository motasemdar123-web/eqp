const { getPrisma } = require('../config/prisma');
const { loadCookie, hasAuthTicket, authTicketOf, rememberRefreshedCookies } = require('./komatsuInquiryService');

// Read-only page: loading it never creates or changes anything on PDX, it only keeps the login session warm.
const KEEPALIVE_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry';
const DEFAULT_INTERVAL_MINUTES = 10;

let intervalHandle = null;
let alertedTicket = '';
let state = { alive: null, checkedAt: null, refreshed: false, message: 'Keep-alive has not run yet.' };

function getKeepAliveState() {
  return { ...state };
}

function isLoginResponse(resp, text = '') {
  const location = resp.headers.get('location') || '';
  return (
    (resp.status >= 300 && resp.status < 400 && /login|sso|microsoftonline/i.test(location)) ||
    resp.status === 401 ||
    text.includes('Sign in to your account') ||
    text.includes('login.microsoftonline.com')
  );
}

async function alertExpiredOnce(cookieStr) {
  const ticket = authTicketOf(cookieStr);
  if (!ticket || ticket === alertedTicket) return;
  alertedTicket = ticket;
  const prisma = getPrisma();
  if (!prisma) return;
  // Lazy require: komatsuSyncService pulls in the EO service, which is not needed until an alert fires.
  const { notifyAuthExpired } = require('./komatsuSyncService');
  await notifyAuthExpired(
    prisma,
    'Komatsu PDX session expired. Log in to PDX in Edge; the EQP extension will sync the new session automatically.'
  );
}

async function pingPdxSession() {
  const cookieStr = loadCookie();
  if (!hasAuthTicket(cookieStr)) {
    state = { alive: false, checkedAt: new Date().toISOString(), refreshed: false, message: 'No authenticated PDX session stored.' };
    return getKeepAliveState();
  }

  try {
    const resp = await fetch(KEEPALIVE_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
        'Accept': 'text/html, */*; q=0.01',
        'Cookie': cookieStr,
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });

    const setCookies = typeof resp.headers.getSetCookie === 'function' ? resp.headers.getSetCookie() : [];
    const text = resp.status === 200 ? await resp.text() : '';

    if (isLoginResponse(resp, text)) {
      state = { alive: false, checkedAt: new Date().toISOString(), refreshed: false, message: 'PDX session expired. Log in to PDX again.' };
      await alertExpiredOnce(cookieStr).catch((err) => console.warn('[pdxKeepAlive] Alert failed:', err.message));
      return getKeepAliveState();
    }

    const refreshed = rememberRefreshedCookies(cookieStr, setCookies);
    state = {
      alive: resp.status === 200,
      checkedAt: new Date().toISOString(),
      refreshed,
      message: resp.status === 200 ? 'PDX session is alive.' : `Unexpected PDX status ${resp.status}.`,
    };
  } catch (err) {
    // Network hiccups don't mean the session expired; report and try again next tick.
    state = { ...state, checkedAt: new Date().toISOString(), refreshed: false, message: `Keep-alive network error: ${err.message}` };
  }
  return getKeepAliveState();
}

function startPdxKeepAlive() {
  if (intervalHandle || process.env.NODE_ENV === 'test') return;
  const minutes = Number(process.env.PDX_KEEPALIVE_MINUTES ?? DEFAULT_INTERVAL_MINUTES);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.log('[pdxKeepAlive] Disabled (PDX_KEEPALIVE_MINUTES <= 0).');
    return;
  }

  console.log(`[pdxKeepAlive] Pinging PDX session every ${minutes} minute(s).`);
  intervalHandle = setInterval(() => {
    pingPdxSession().catch((err) => console.warn('[pdxKeepAlive] Tick failed:', err.message));
  }, minutes * 60 * 1000);
  if (intervalHandle.unref) {
    intervalHandle.unref();
  }
}

function stopPdxKeepAlive() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  pingPdxSession,
  getKeepAliveState,
  startPdxKeepAlive,
  stopPdxKeepAlive,
};
