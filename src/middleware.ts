import { NextRequest, NextResponse } from "next/server";

const NOT_AUTHORIZED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Not authorized</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff;
    color: #111;
  }
  @media (prefers-color-scheme: dark) {
    html, body { background: #111; color: #f2f2f2; }
  }
  .wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
  }
  .lock { font-size: 40px; margin-bottom: 4px; }
  h1 { font-size: 18px; font-weight: 700; margin: 0 0 16px 0; }
  p { font-size: 13px; color: #666; margin: 0 0 4px; max-width: 32ch; }
  @media (prefers-color-scheme: dark) {
    p { color: #999; }
  }
  code {
    background: #f2f2f2;
    padding: 2px 6px;
    border-radius: 4px;
  }
  @media (prefers-color-scheme: dark) {
    code { background: #262626; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="lock">🔒</div>
    <h1>Not authorized</h1>
    <p>This link needs a valid <code>?key=...</code> to view.</p>
    <p>Double check the end of the URL</p>
  </div>
</body>
</html>`;

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

  return new NextResponse(NOT_AUTHORIZED_HTML, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
