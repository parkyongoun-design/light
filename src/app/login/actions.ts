"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const memberId = String(formData.get("memberId") || "");
  const pin = String(formData.get("pin") || "");

  if (!memberId || !pin) {
    return { error: "이름과 PIN을 모두 입력해주세요." };
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || !member.active) {
    return { error: "존재하지 않는 계정입니다." };
  }

  const ok = await bcrypt.compare(pin, member.pinHash);
  if (!ok) {
    return { error: "PIN이 일치하지 않습니다." };
  }

  setSessionCookie(member.id);
  redirect(member.role === "ADMIN" ? "/admin" : "/zone");
}
