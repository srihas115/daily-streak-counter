// Next.js remounts template.tsx (unlike layout.tsx) on every navigation,
// so this gives every route change — home <-> a dstreak page — a fade-in
// without needing a new dependency or the View Transitions API.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
