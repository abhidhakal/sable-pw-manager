/** Only http(s) links are safe to render as an href — blocks javascript:, data:, etc. */
export function isSafeUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const hasScheme = /^https?:\/\//i.test(url)
    const parsed = new URL(hasScheme ? url : `https://${url}`)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
