export function buildContentSecurityPolicy(isDev: boolean): string {
  if (isDev) {
    return "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws://localhost:* http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;";
  }

  return "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; media-src 'self' blob: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none';";
}
