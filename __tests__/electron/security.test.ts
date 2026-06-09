import { buildContentSecurityPolicy } from '../../src/main/security';

describe('Electron security policy', () => {
  it('keeps production CSP strict', () => {
    const csp = buildContentSecurityPolicy(false);

    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('http://localhost');
    expect(csp).not.toContain('ws://localhost');
  });

  it('keeps Vite development allowances explicit', () => {
    const csp = buildContentSecurityPolicy(true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('http://localhost:*');
    expect(csp).toContain('ws://localhost:*');
  });
});
