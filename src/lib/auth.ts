import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

// Dev-only signing secret. Replace with an env-sourced secret before any real deployment.
const SESSION_SECRET = "mission-gacha-dev-secret-v1";
const COOKIE_NAME = "mg_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(memberId: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(memberId).digest("hex");
  return `${memberId}.${hmac}`;
}

function unsign(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const memberId = token.slice(0, dot);
  const hmac = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(memberId).digest("hex");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return memberId;
}

export function setSessionCookie(memberId: string) {
  cookies().set(COOKIE_NAME, sign(memberId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getSessionMemberId(): string | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return unsign(token);
}

export async function getCurrentMember() {
  const memberId = getSessionMemberId();
  if (!memberId) return null;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { zone: { include: { team: true } } },
  });
  if (!member || !member.active) return null;
  return member;
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new Error("UNAUTHENTICATED");
  return member;
}

export async function requireAdmin() {
  const member = await requireMember();
  if (member.role !== "ADMIN") throw new Error("FORBIDDEN");
  return member;
}
