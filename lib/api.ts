type ApiOptions = (RequestInit & { token?: string }) & { next?: any };

function apiBase() {
  return process.env.API_BASE_URL ?? 'http://localhost:8000';
}

export function apiServer(path: string, options: ApiOptions = {}) {
  const { token, headers, ...rest } = options;
  const h = new Headers(headers);
  h.set('Accept', 'application/json');
  if (!h.has('Content-Type') && rest.body) h.set('Content-Type', 'application/json');
  // The Express API expects the raw access token (no Bearer prefix)
  if (token) h.set('Authorization', token);
  return fetch(`${apiBase()}${path}`, { ...rest, headers: h });
}

export async function graphqlServer<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: Omit<ApiOptions, 'body' | 'method'> = {},
) {
  const { token, headers, ...rest } = options;
  const h = new Headers(headers);
  h.set('Accept', 'application/json');
  h.set('Content-Type', 'application/json');
  if (token) h.set('Authorization', token);
  const res = await fetch(`${apiBase()}/graphql`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ query, variables }),
    ...rest,
  });
  return res;
}
