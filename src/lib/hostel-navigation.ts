/** Keep navigation return paths inside this application. */
export function safeAppPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || (value.includes('\\') || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) return fallback;
  try {
    const url = new URL(value, 'https://staykota.invalid');
    return url.origin === 'https://staykota.invalid' ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
export function hostelPreviewHref(id: string, campus: string, room?: string, returnTo?: string): string {
  const params = new URLSearchParams({ campus });
  if (room) params.set('room',room);
  if (returnTo) params.set('returnTo',safeAppPath(returnTo,'/map'));
  return `/hostel/${encodeURIComponent(id)}/preview?${params}`;
}
export function hostelLoginHref(details: string, signup = false): string {
  const params = new URLSearchParams({ role:'student', reason:'hostel-details', redirect:safeAppPath(details) });
  if (signup) params.set('mode','signup');
  return `/login?${params}`;
}
