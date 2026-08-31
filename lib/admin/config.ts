const forbiddenDefaults = new Set(['/login', '/admin-login', '/dashboard', '/admin']);

export function getPrivateAdminLoginPath() {
  const configured = process.env.PRIVATE_ADMIN_LOGIN_PATH?.trim();
  if (!configured || configured.includes('REPLACE_') || configured.includes('replace-')) return null;
  const normalized = `/${configured.replace(/^\/+|\/+$/g, '')}`;
  if (normalized === '/' || forbiddenDefaults.has(normalized)) return null;
  return normalized;
}
