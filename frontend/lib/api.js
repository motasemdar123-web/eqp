const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://eqp.onrender.com';

async function request(path, options = {}) {
  let token = '';

  if (typeof window !== 'undefined') {
    try {
      token = JSON.parse(localStorage.getItem('user') || 'null')?.sessionToken || '';
    } catch {
      localStorage.removeItem('user');
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/';
    }

    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function verifyUser(userNumber) {
  return request('/verify-user', {
    method: 'POST',
    body: JSON.stringify({ userNumber: Number(userNumber) }),
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
