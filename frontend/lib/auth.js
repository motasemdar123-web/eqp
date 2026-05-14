export function getStoredUser() {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem('user');

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getStoredPlatformSession() {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('platformToken');
    const user = JSON.parse(localStorage.getItem('platformUser') || 'null');

    if (!token || !user) return null;
    return { token, user };
  } catch {
    localStorage.removeItem('platformToken');
    localStorage.removeItem('platformUser');
    return null;
  }
}

export function setStoredPlatformSession(token, user) {
  localStorage.setItem('platformToken', token);
  localStorage.setItem('platformUser', JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('platformToken');
  localStorage.removeItem('platformUser');
}

export function getSessionToken() {
  return getStoredUser()?.sessionToken || '';
}
