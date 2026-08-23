export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp-1.onrender.com';

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

  try {
    response = await fetch(targetUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    if (isLocalDatasetRoute && typeof window !== 'undefined') {
      try {
        response = await fetch(path, options);
      } catch {
        throw new Error('Cannot reach backend or local data service.');
      }
    } else {
      throw new Error('Cannot reach backend. Check Render deployment, backend URL, and CORS settings.');
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !isLocalDatasetRoute) {
      localStorage.removeItem('user');
      localStorage.removeItem('platformToken');
      localStorage.removeItem('platformUser');
      window.location.href = '/';
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

export function directLogin(payload) {
  return request('/api/auth/unified-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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

export function getReports() {
  return request('/reports');
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

export function getKomatsuStatus() {
  return request('/api/komatsu/status');
}

export function saveKomatsuCookie(cookie) {
  return request('/api/komatsu/cookie', {
    method: 'POST',
    body: JSON.stringify({ cookie }),
  });
}

export function runKomatsuInquiry(parts, cookie = null) {
  return request('/api/komatsu/inquiry', {
    method: 'POST',
    body: JSON.stringify({ parts, cookie }),
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
  return request(`/api/komatsu/part-lookup?partNo=${encodeURIComponent(partNo)}`);
}

export function getKomatsuLatestOrderNo(customerCode = 'REG') {
  return request(`/api/komatsu/latest-order-no?customerCode=${encodeURIComponent(customerCode)}`);
}

export function executeKomatsuEoOrder(payload) {
  return request('/api/komatsu/eo-execute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getKomatsuQuotations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/komatsu/quotations?${query}`);
}

export function confirmKomatsuQuotation(payload) {
  return request('/api/komatsu/quotations/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function copyKomatsuQuotationToSo(payload) {
  return request('/api/komatsu/quotations/copy-to-so', {
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




