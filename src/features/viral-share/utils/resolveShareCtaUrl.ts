import { SHARE_CTA_URL } from '../constants';

/** Homepage for the CTA — same origin in dev, production URL otherwise. */
export function resolveShareCtaUrl(): string {
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return origin.replace(/\/$/, '');
    }
  }
  return SHARE_CTA_URL;
}
