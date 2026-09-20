export const GATE_COOKIE = "mg_gate";
// The gate re-locks after this much inactivity (sliding: every request extends it).
export const GATE_IDLE_MS = 60 * 60 * 1000;

const encoder = new TextEncoder();

function gateSecret() {
  return process.env.GATE_SECRET ?? "mission-gacha-gate-secret-v1";
}

function sitePassword() {
  return process.env.SITE_PASSWORD ?? "0314";
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(gateSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeGateToken(): Promise<string> {
  const exp = String(Date.now() + GATE_IDLE_MS);
  return `${exp}.${await hmacHex(exp)}`;
}

export async function isGateTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmacHex(exp));
}

export function checkSitePassword(input: string): boolean {
  return safeEqual(input.trim(), sitePassword());
}

export const gateCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
