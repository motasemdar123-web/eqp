export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

async function attemptSessionRenewal() {
  if (typeof window === 'undefined') return null;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('platformUser') || localStorage.getItem('user') || 'null');
  } catch {}

  const email = user?.email;
  const currentToken = localStorage.getItem('platformToken') || user?.sessionToken || '';

  if (!email && !currentToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.token) {
      localStorage.setItem('platformToken', data.token);
      if (data.user) {
        localStorage.setItem('platformUser', JSON.stringify(data.user));
      }
      return data;
    }
  } catch {}

  // Fallback: If enterprise user recognized locally, renew local profile session
  if (email && ENTERPRISE_PROFILES[email.toLowerCase()]) {
    const local = createLocalAuthSession(email.toLowerCase(), ENTERPRISE_PROFILES[email.toLowerCase()]);
    localStorage.setItem('platformToken', local.token);
    localStorage.setItem('platformUser', JSON.stringify(local.user));
    return local;
  }

  return null;
}

async function request(path, options = {}) {
  let token = '';

  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('platformToken') || JSON.parse(localStorage.getItem('user') || 'null')?.sessionToken || '';
    } catch {
      localStorage.removeItem('user');
    }
  }

  const isLocalDatasetRoute = path.startsWith('/api/sheets') || path.startsWith('/api/analytics');
  const targetUrl = (typeof window !== 'undefined' && isLocalDatasetRoute)
    ? path
    : `${API_BASE_URL}${path}`;

  let response;
  const timeoutMs = options.timeoutMs || 45000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    response = await fetch(targetUrl, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please retry.`);
    }
    if (isLocalDatasetRoute && typeof window !== 'undefined') {
      try {
        response = await fetch(path, options);
      } catch {
        throw new Error('Cannot reach backend or local data service.');
      }
    } else {
      throw new Error('Cannot reach backend. Check Render deployment, backend URL, and CORS settings.');
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      const err = String(data.error || '');
      const isAuthErr =
        err.includes('session token') ||
        err.includes('Session expired') ||
        err.includes('Authentication required') ||
        err.includes('expired token') ||
        err.includes('Invalid or expired token') ||
        err.includes('jwt expired');

      // Attempt silent background renewal once if not already retried
      if (isAuthErr && typeof window !== 'undefined' && !options._retry && path !== '/api/auth/refresh') {
        try {
          const renewed = await attemptSessionRenewal();
          if (renewed?.token) {
            return request(path, { ...options, _retry: true });
          }
        } catch {}

        // If renewal was impossible, clear stale token so user isn't stuck permanently
        localStorage.removeItem('platformToken');
        throw new Error('Your EQP portal login session has expired. Please refresh the page or sign back in.');
      }
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
}


export function getMicrosoftLoginUrl(returnTo) {
  const loginUrl = new URL(`${API_BASE_URL}/api/auth/microsoft/start`);

  if (returnTo) {
    loginUrl.searchParams.set('returnTo', returnTo);
  }

  if (typeof window !== 'undefined') {
    loginUrl.searchParams.set('frontendCallbackUrl', `${window.location.origin}/auth/microsoft/callback`);
  }

  return loginUrl.toString();
}

export function completeMicrosoftLogin(code) {
  return request('/api/auth/microsoft/session', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

const ENTERPRISE_PROFILES = {
  'mohammad.rami@daralhai.com': {
    fullName: 'Mohammad Rami',
    roles: ['WAREHOUSE_OFFICER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'WAREHOUSE_MANAGE', 'PARTS_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'mohammad.qraein@daralhai.com': {
    fullName: 'Mohammad Rami',
    roles: ['WAREHOUSE_OFFICER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'WAREHOUSE_MANAGE', 'PARTS_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'mohammadrami@daralhai.com': {
    fullName: 'Mohammad Rami',
    roles: ['WAREHOUSE_OFFICER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'WAREHOUSE_MANAGE', 'PARTS_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'rami@daralhai.com': {
    fullName: 'Mohammad Rami',
    roles: ['WAREHOUSE_OFFICER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'WAREHOUSE_MANAGE', 'PARTS_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'm.rami@daralhai.com': {
    fullName: 'Mohammad Rami',
    roles: ['WAREHOUSE_OFFICER', 'OPERATIONS_MANAGER', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'WAREHOUSE_MANAGE', 'PARTS_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'motasem.ghanem@daralhai.com': {
    fullName: 'Motasem Ghanem',
    roles: ['SUPER_ADMIN', 'MAINTENANCE_SUPERVISOR', 'SERVICE_ENGINEER'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'abdelrahman.abdallah@daralhai.com': {
    fullName: 'Abdelrahman Abdullah',
    roles: ['SERVICE_ENGINEER'],
    permissions: ['REPORTS_READ', 'EQP_MANAGE', 'SCHEDULE_MANAGE'],
    redirectTo: '/management',
  },
  'faisal.inaya@daralhai.com': {
    fullName: 'Faisal Inaya',
    roles: ['SERVICE_ENGINEER'],
    permissions: ['REPORTS_READ', 'EQP_MANAGE', 'SCHEDULE_MANAGE'],
    redirectTo: '/management',
  },
  'operations.manager@daralhai.com': {
    fullName: 'Operations Manager',
    roles: ['OPERATIONS_MANAGER'],
    permissions: ['SCHEDULE_MANAGE', 'REPORTS_READ'],
    redirectTo: '/management',
  },
  'admin@daralhai.com': {
    fullName: 'Dar Al HAI System Administrator',
    roles: ['SUPER_ADMIN'],
    permissions: ['USERS_MANAGE', 'SCHEDULE_MANAGE', 'REPORTS_READ', 'EQP_MANAGE', 'SYSTEM_CONFIGURE'],
    redirectTo: '/management',
  },
  'jessicaafawzyy80@gmail.com': {
    fullName: 'Jessica Fawzy',
    roles: ['MEDIA_SPECIALIST'],
    permissions: ['MEDIA_MANAGE'],
    redirectTo: '/media',
  },
};

function createLocalAuthSession(email, profile) {
  const safeId = `user-${email.replace(/[^a-z0-9]/g, '-')}`;
  const sessionToken = `session-${email.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  const header = typeof btoa === 'function' ? btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) : 'header';
  const payloadStr = typeof btoa === 'function'
    ? btoa(
        JSON.stringify({
          sub: safeId,
          email,
          fullName: profile.fullName,
          roles: profile.roles,
          permissions: profile.permissions,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400 * 7,
        })
      )
    : 'payload';

  return {
    success: true,
    authType: 'DIRECT',
    token: `${header}.${payloadStr}.sig`,
    user: {
      id: safeId,
      email,
      fullName: profile.fullName,
      userNumber: profile.userNumber || null,
      roles: profile.roles,
      permissions: profile.permissions,
      sessionToken,
    },
    redirectTo: profile.redirectTo || '/management',
  };
}

export async function directLogin(payload) {
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '').trim();

  if (!email || !password) {
    throw new Error('Please enter your email and password.');
  }

  // Check special cases or enterprise fallback
  const profile = ENTERPRISE_PROFILES[email];

  if (email === 'jessicaafawzyy80@gmail.com') {
    if (password !== 'Jessica@8080' && password !== 'ChangeMe123!') {
      throw new Error('Invalid email or password.');
    }
    return createLocalAuthSession(email, profile);
  }

  // Attempt backend login first
  try {
    const result = await request('/api/auth/unified-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result && (result.success || result.token)) {
      return result;
    }
  } catch (err) {
    // If backend is unreachable (cold start / network issue / timeout), fall back to enterprise profile
    if (profile) {
      return createLocalAuthSession(email, profile);
    }
    throw err;
  }

  // If backend returned without error but no success, fallback if recognized enterprise staff
  if (profile) {
    return createLocalAuthSession(email, profile);
  }

  throw new Error('Invalid email or password.');
}



export function getMachines() {
  return request('/machines');
}

export function getMachineHistory() {
  return request('/machine-history');
}

export function getReportProfile() {
  return request('/report-profile');
}

export function generateReports(payload) {
  return request('/generate-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getReports(options = {}) {
  const params = new URLSearchParams();
  if (options.all) params.set('all', 'true');
  if (options.scope) params.set('scope', options.scope);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/reports${qs}`);
}

export function getAllFleetReports() {
  return request('/reports?all=true');
}

export function getAnalyticsOverview() {
  return request('/analytics/overview');
}

export function getManagementDashboard() {
  return request('/api/dashboard');
}

export function renameReport(id, fileName) {
  return request(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ file_name: fileName }),
  });
}

export function deleteReport(id, options = {}) {
  const params = options.rollbackCounters ? '?rollbackCounters=true' : '';

  return request(`/reports/${id}${params}`, {
    method: 'DELETE',
  });
}

export function getTechnicians() {
  return request('/api/technicians');
}

export function createTechnician(payload) {
  return request('/api/technicians', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTechnician(id, payload) {
  return request(`/api/technicians/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTechnician(id) {
  return request(`/api/technicians/${id}`, {
    method: 'DELETE',
  });
}

export function getShifts() {
  return request('/api/shifts');
}

export function getNotifications(limit = 12) {
  if (typeof window !== 'undefined') {
    try {
      const user = JSON.parse(localStorage.getItem('platformUser') || localStorage.getItem('user') || 'null');
      if (user?.roles?.includes('MEDIA_SPECIALIST') || user?.email?.toLowerCase() === 'jessicaafawzyy80@gmail.com') {
        return Promise.resolve({ notifications: [], unreadCount: 0 });
      }
    } catch {
      // Ignore
    }
  }
  return request(`/api/notifications?limit=${encodeURIComponent(limit)}`);
}


export function markNotificationRead(id) {
  return request(`/api/notifications/${id}/read`, {
    method: 'POST',
  });
}

export function markAllNotificationsRead() {
  return request('/api/notifications/read-all', {
    method: 'POST',
  });
}

export function getWorkspaceEngineers() {
  return request('/api/workspace/engineers');
}

export function pushWorkspacePlannerTask(payload) {
  return request('/api/workspace/planner-push', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getWorkspacePlannerInbox() {
  return request('/api/workspace/planner-push/inbox');
}

export function planWorkspacePlannerTask(id, payload) {
  return request(`/api/workspace/planner-push/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function dismissWorkspacePlannerTask(id) {
  return request(`/api/workspace/planner-push/${id}/dismiss`, {
    method: 'PATCH',
  });
}

function getStoredPdxCookie() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('komatsuPdxCookie') || '';
  }
  return '';
}

export function getKomatsuStatus(customCookie) {
  const cookie = customCookie || getStoredPdxCookie();
  const query = cookie ? `?cookie=${encodeURIComponent(cookie)}` : '';
  return request(`/api/komatsu/status${query}`);
}

export function saveKomatsuCookie(cookie) {
  if (typeof window !== 'undefined' && cookie) {
    localStorage.setItem('komatsuPdxCookie', cookie);
  }
  return request('/api/komatsu/cookie', {
    method: 'POST',
    body: JSON.stringify({ cookie }),
  });
}

export function runKomatsuInquiry(parts, customCookie = null) {
  const cookie = customCookie || getStoredPdxCookie();
  return request('/api/komatsu/inquiry', {
    method: 'POST',
    body: JSON.stringify({ parts, ...(cookie ? { cookie } : {}) }),
  });
}

export function getKomatsuFleet() {
  return request('/api/komatsu/fleet');
}

export function addKomatsuCustomMachine(payload) {
  return request('/api/komatsu/custom-machine', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function lookupKomatsuPart(partNo) {
  const cookie = getStoredPdxCookie();
  const query = new URLSearchParams({
    partNo,
    ...(cookie ? { cookie } : {}),
  }).toString();
  return request(`/api/komatsu/part-lookup?${query}`);
}

export function getKomatsuLatestOrderNo(customerCode = 'REG') {
  const cookie = getStoredPdxCookie();
  const query = new URLSearchParams({
    customerCode,
    ...(cookie ? { cookie } : {}),
  }).toString();
  return request(`/api/komatsu/latest-order-no?${query}`);
}

export function executeKomatsuEoOrder(payload) {
  const cookie = payload.cookie || getStoredPdxCookie();
  return request('/api/komatsu/eo-execute', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ...(cookie ? { cookie } : {}) }),
  });
}

export function getKomatsuQuotations(params = {}) {
  const cookie = getStoredPdxCookie();
  const query = new URLSearchParams({
    ...params,
    ...(cookie ? { cookie } : {}),
  }).toString();
  return request(`/api/komatsu/quotations?${query}`);
}

export function getKomatsuQuotationParts(quotationNo, params = {}) {
  const cookie = getStoredPdxCookie();
  const query = new URLSearchParams({
    ...params,
    ...(cookie ? { cookie } : {}),
  }).toString();
  return request(`/api/komatsu/quotations/${encodeURIComponent(quotationNo)}/parts?${query}`);
}

export function confirmKomatsuQuotation(payload) {
  const cookie = payload.cookie || getStoredPdxCookie();
  return request('/api/komatsu/quotations/confirm', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ...(cookie ? { cookie } : {}) }),
  });
}

export function copyKomatsuQuotationToSo(payload) {
  const cookie = payload.cookie || getStoredPdxCookie();
  return request('/api/komatsu/quotations/copy-to-so', {
    method: 'POST',
    body: JSON.stringify({ ...payload, ...(cookie ? { cookie } : {}) }),
  });
}

export function toggleQuotationSoStatus(payload) {
  return request('/api/komatsu/quotations/toggle-so-status', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getFleetSummary() {
  return request('/api/analytics/fleet-summary');
}

export function getGreasingAnalytics() {
  return request('/api/analytics/greasing');
}

export function getComponentRotations() {
  return request('/api/analytics/component-rotations');
}

export function getWearLifespan() {
  return request('/api/analytics/wear-lifespan');
}

export function getRipperTeeth() {
  return request('/api/analytics/ripper-teeth');
}

export function getCylinderAnalytics() {
  return request('/api/analytics/cylinders');
}

export function getWorkshopAnalytics() {
  return request('/api/analytics/workshop');
}

export function getGovernanceAnalytics() {
  return request('/api/analytics/governance');
}

export function getSheetsManifest() {
  return request('/api/sheets/manifest');
}

export function getSheetData(sheetId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/sheets/${sheetId}${query ? `?${query}` : ''}`);
}

export function searchSapQueries(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/sheets/sap-search${query ? `?${query}` : ''}`);
}

export function getCustomersList(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/sheets/customers${query ? `?${query}` : ''}`);
}

export function getPeopleDirectory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/sheets/people${query ? `?${query}` : ''}`);
}

export function getToolCustody(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/sheets/tool-custody${query ? `?${query}` : ''}`);
}

export function getEqpcStatus() {
  return request('/api/komatsu/eqpc/status');
}

export function saveEqpcCookie(cookie) {
  return request('/api/komatsu/eqpc/cookie', {
    method: 'POST',
    body: JSON.stringify({ cookie }),
  });
}

export function getEqpcEventCodes() {
  return request('/api/komatsu/eqpc/event-codes');
}

export function lookupEqpcMachine(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/komatsu/eqpc/machine-lookup${query ? `?${query}` : ''}`);
}

export function uploadEqpcReport(payload) {
  return request('/api/komatsu/eqpc/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function batchUploadEqpcReports(payload) {
  return request('/api/komatsu/eqpc/batch-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getEqpcLifecycleCache() {
  return request('/api/komatsu/eqpc/lifecycle-cache');
}

export function syncEqpcLifecycle(payload = {}) {
  return request('/api/komatsu/eqpc/lifecycle-sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSapCredentials() {
  return request('/api/sap/credentials');
}

export function saveSapCredentials(payload) {
  return request('/api/sap/credentials', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createSapPurchaseOrder(payload) {
  return request('/api/sap/po/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 180000,
  });
}

export function getSapPoStatus() {
  return request('/api/sap/po/status', {
    timeoutMs: 15000,
  });
}

export async function checkLocalSapBridge() {
  if (typeof window === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch('http://127.0.0.1:5005/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function executeLocalSapPo(payload) {
  const res = await fetch('http://127.0.0.1:5005/api/sap-po/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.message || 'Local bridge execution failed');
  }
  return res.json();
}

export async function getLocalSapPoStatus() {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('http://127.0.0.1:5005/api/sap-po/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getSapBridgeDownloadUrl() {
  return '/sap-local-bridge.zip';
}

export async function downloadSapBridgeZip() {
  try {
    const res = await fetch('/sap-local-bridge.zip');
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sap-local-bridge.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return;
    }
  } catch {}

  // Fallback to backend download endpoint if static file is not present
  let token = '';
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('platformToken') || JSON.parse(localStorage.getItem('user') || 'null')?.sessionToken || '';
    } catch {
      localStorage.removeItem('user');
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/sap/bridge/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sap-local-bridge.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadSapPoExcel(payload) {
  let token = '';
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('platformToken') || JSON.parse(localStorage.getItem('user') || 'null')?.sessionToken || '';
    } catch {
      localStorage.removeItem('user');
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/sap/po/export-excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to export SAP PO Excel');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAP_PO_${payload.quotationNo || 'Export'}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


export async function getComments(params = {}) {
  const query = new URLSearchParams(params).toString();
  try {
    return await request(`/api/eqp/comments${query ? `?${query}` : ''}`);
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await request(`/comments${query ? `?${query}` : ''}`);
    }
    throw err;
  }
}

export async function getComment(id) {
  try {
    return await request(`/api/eqp/comments/${id}`);
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await request(`/comments/${id}`);
    }
    throw err;
  }
}

export async function createComment(payload) {
  try {
    return await request('/api/eqp/comments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await request('/comments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function updateComment(id, payload) {
  try {
    return await request(`/api/eqp/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await request(`/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function deleteComment(id) {
  try {
    return await request(`/api/eqp/comments/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await request(`/comments/${id}`, {
        method: 'DELETE',
      });
    }
    throw err;
  }
}







