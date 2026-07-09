import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "dsc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
const SCRYPT_KEYLEN = 64;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return secret;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

export function verifyPasswordHash(password: string, hash: string, salt: string): boolean {
  const stored = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  if (stored.length !== candidate.length) return false;
  return timingSafeEqual(stored, candidate);
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

// Notion embeds this app in a cross-site <iframe>. SameSite=Lax cookies are
// not sent in that context by modern browsers — only SameSite=None; Secure
// survives inside an iframe, and Secure requires HTTPS (always true on
// Vercel). Falls back to Lax in dev, where there's no HTTPS to satisfy
// Secure and no iframe embedding to worry about either.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

export async function createSession(): Promise<void> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  const value = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, value, cookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expectedBuf = Buffer.from(sign(payload), "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
    return false;
  }

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

export async function requireAuthenticated(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Not authenticated");
  }
}
