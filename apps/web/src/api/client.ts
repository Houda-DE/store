const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw Object.assign(new Error(err.message ?? 'Request failed'), { status: res.status, data: err });
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => req<T>('GET', path),
  post: <T>(path: string, body: unknown) => req<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => req<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => req<T>('PUT', path, body),
  delete: <T>(path: string) => req<T>('DELETE', path),
  postForm: <T>(path: string, body: FormData) => req<T>('POST', path, body, true),
  patchForm: <T>(path: string, body: FormData) => req<T>('PATCH', path, body, true),
};
