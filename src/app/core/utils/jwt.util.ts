/**
 * ابزارهای کمکی برای کار با توکن JWT.
 */

/** رمزگشایی بخش payload توکن JWT (بدون اعتبارسنجی امضا). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** استخراج نقش کاربر از توکن JWT. */
export function getRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return (
    (payload['role'] as string | undefined) ??
    (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | undefined) ??
    null
  );
}

/** استخراج نام کاربری از توکن JWT. */
export function getUsernameFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return (
    (payload['unique_name'] as string | undefined) ??
    (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string | undefined) ??
    (payload['name'] as string | undefined) ??
    (payload['sub'] as string | undefined) ??
    null
  );
}
