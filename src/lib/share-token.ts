// Server-only HMAC-signed share tokens (no external JWT dependency).
// Used to expose read-only docs (e.g. the integration manual) via a URL + token
// that expires, without requiring the viewer to log in.
import crypto from 'node:crypto';

const SECRET =
  process.env.MANUAL_SHARE_SECRET ||
  process.env.AUTH_SECRET ||
  'dev-only-insecure-manual-share-secret-change-me';

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.MANUAL_SHARE_SECRET &&
  !process.env.AUTH_SECRET
) {
  console.warn(
    '[share-token] MANUAL_SHARE_SECRET is not set — using an insecure default. ' +
      'Set MANUAL_SHARE_SECRET (a long random string) in the environment.',
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sign(data: string): string {
  return b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
}

export interface ShareTokenPayload {
  /** document id this token grants access to */
  d: string;
  /** issued-at (unix seconds) */
  iat: number;
  /** expiry (unix seconds) */
  exp: number;
}

/** Create a signed token for `doc` that expires after `ttlSeconds`. */
export function signShareToken(
  doc: string,
  ttlSeconds: number,
): { token: string; expiresAt: string } {
  const now = Math.floor(Date.now() / 1000);
  const payload: ShareTokenPayload = { d: doc, iat: now, exp: now + ttlSeconds };
  const body = b64url(JSON.stringify(payload));
  const token = `${body}.${sign(body)}`;
  return { token, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

/** Verify signature + expiry (and optionally the document id). Returns the payload or null. */
export function verifyShareToken(
  token: string | undefined | null,
  expectedDoc?: string,
): ShareTokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, providedSig] = parts;

  const expectedSig = sign(body);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: ShareTokenPayload;
  try {
    const json = Buffer.from(
      body.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number' || typeof payload.d !== 'string') {
    return null;
  }
  if (Math.floor(Date.now() / 1000) > payload.exp) return null;
  if (expectedDoc && payload.d !== expectedDoc) return null;

  return payload;
}
