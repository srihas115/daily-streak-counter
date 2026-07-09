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
  .footer-links {
    display: flex;
    gap: 16px;
    margin-top: 32px;
  }
  .footer-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: #999;
    transition: background-color 0.15s, color 0.15s;
  }
  .footer-icon:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #555;
  }
  @media (prefers-color-scheme: dark) {
    .footer-icon { color: #888; }
    .footer-icon:hover { background: rgba(255, 255, 255, 0.08); color: #ddd; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="lock">🔒</div>
    <h1>Not authorized</h1>
    <p>This link needs a valid <code>?key=...</code> to view.</p>
    <p>Double check the end of the URL</p>
    <div class="footer-links">
      <a href="https://github.com/srihas115/daily-streak-counter" target="_blank" rel="noopener noreferrer" class="footer-icon" aria-label="GitHub repository">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
      </a>
      <a href="mailto:srihasgupta@gmail.com" class="footer-icon" aria-label="Email">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>
      </a>
    </div>
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
