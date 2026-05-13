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

export function clearStoredUser() {
  localStorage.removeItem('user');
}

export function getSessionToken() {
  return getStoredUser()?.sessionToken || '';
}
