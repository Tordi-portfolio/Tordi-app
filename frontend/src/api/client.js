const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('tordi_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('tordi_token', token);
  else localStorage.removeItem('tordi_token');
}

async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    const message = (data && (data.error || data.detail)) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  patchForm: (path, formData) => request(path, { method: 'PATCH', body: formData, isFormData: true }),
};

export { getToken };
