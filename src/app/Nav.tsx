"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const GO_HOME_EVENT = "dsc:go-home";

// Rendered directly in layout.tsx, outside of {children}/template.tsx, so
// it never unmounts across navigation — unlike the page content, which
// fully remounts on every route change. Keeps the Home icon visually
// stable instead of flickering when moving between the home page and a
// dstreak page.
//
// When already on "/", a Link to "/" is a no-op navigation (same URL), so
// it can't reset the home page's local "settings open" state on its own.
// Dispatching a plain event lets HomeView (which owns that state) react to
// the click without any shared state/context plumbing.
export default function Nav() {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new Event(GO_HOME_EVENT));
    }
  }

  return (
    <Link href="/" className="home-btn" aria-label="Home" onClick={handleClick}>
      ⌂
    </Link>
  );
}
