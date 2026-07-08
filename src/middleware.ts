import { NextRequest, NextResponse } from "next/server";

// Optional access gate: if ACCESS_KEY is set, every request must include a
// matching ?key= query param. This is a bearer-token URL, not a login form —
// set it once in whatever link you save (browser bookmark, Notion embed) and
// you never see a prompt again. Leave ACCESS_KEY unset for an open instance
// (e.g. a public demo or a fresh self-hosted deploy someone is trying out).
export function middleware(request: NextRequest) {
  const accessKey = process.env.ACCESS_KEY;
  if (!accessKey) return NextResponse.next();

  const provided = request.nextUrl.searchParams.get("key");
  if (provided === accessKey) return NextResponse.next();

  return new NextResponse("Not authorized", { status: 401 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
