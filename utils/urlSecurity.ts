/**
 * URL Security utilities to prevent open redirect and XSS attacks.
 */

/**
 * Validate that a URL is safe for redirects (relative, no protocol tricks).
 * Prevents open redirect attacks via:
 * - Protocol-relative URLs (//attacker.com)
 * - javascript: or data: schemes (URL-encoded or not)
 */
export function isSafeRedirectUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false
  // Must start with / but not // (protocol-relative URL)
  if (!url.startsWith('/') || url.startsWith('//')) return false
  // Block javascript: and data: schemes that could be URL-encoded
  const decoded = decodeURIComponent(url).toLowerCase()
  if (decoded.includes('javascript:') || decoded.includes('data:')) return false
  return true
}

/**
 * Alias for isSafeRedirectUrl - used for action URLs in notifications.
 */
export const isSafeActionUrl = isSafeRedirectUrl
