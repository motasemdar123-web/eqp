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

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Cannot reach backend. Check Render deployment, backend URL, and CORS settings.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
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

export function getMachines() {
  return request('/machines');
}

export function getMachineHistory() {
  return request('/machine-history');
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

export function renameReport(id, fileName) {
  return request(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ file_name: fileName }),
  });
}

export function deleteReport(id) {
  return request(`/reports/${id}`, {
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

export function getWorkspaceSummary() {
  return request('/api/workspace/summary');
}

export function getWorkspaceActivity() {
  return request('/api/workspace/activity');
}

export function getWorkspaceNotes(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  return request(`/api/workspace/notes${query.toString() ? `?${query.toString()}` : ''}`);
}

export function getWorkspaceNote(id) {
  return request(`/api/workspace/notes/${id}`);
}

export function createWorkspaceNote(payload) {
  return request('/api/workspace/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceNote(id, payload) {
  return request(`/api/workspace/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function archiveWorkspaceNote(id) {
  return request(`/api/workspace/notes/${id}`, {
    method: 'DELETE',
  });
}

export function getWorkspaceTasks(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  return request(`/api/workspace/tasks${query.toString() ? `?${query.toString()}` : ''}`);
}

export function createWorkspaceTask(payload) {
  return request('/api/workspace/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceTask(id, payload) {
  return request(`/api/workspace/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceTask(id) {
  return request(`/api/workspace/tasks/${id}`, {
    method: 'DELETE',
  });
}

export function getWorkspaceTemplates() {
  return request('/api/workspace/templates');
}

export function createWorkspaceTemplate(payload) {
  return request('/api/workspace/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceTemplate(id, payload) {
  return request(`/api/workspace/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspaceTemplate(id) {
  return request(`/api/workspace/templates/${id}`, {
    method: 'DELETE',
  });
}
