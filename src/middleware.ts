import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateCookieOptions, isGateTokenValid, makeGateToken } from "@/lib/gate";

export async function middleware(req: NextRequest) {
  if (await isGateTokenValid(req.cookies.get(GATE_COOKIE)?.value)) {
    const res = NextResponse.next();
    res.cookies.set(GATE_COOKIE, await makeGateToken(), gateCookieOptions);
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

// Skipped: the gate page itself, shared result links, Next internals and static files (anything with a dot).
export const config = {
  matcher: ["/((?!_next/static|_next/image|gate|result|.*\\..*).*)"],
};
