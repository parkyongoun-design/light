"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_COOKIE, checkSitePassword, gateCookieOptions, makeGateToken } from "@/lib/gate";

export async function enterGateAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!checkSitePassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "비밀번호가 맞지 않아요." };
  }

  cookies().set(GATE_COOKIE, await makeGateToken(), gateCookieOptions);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
