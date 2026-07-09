import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Nav from "./Nav";

export const metadata: Metadata = {
  title: "Daily Streak Counter",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = store.get("dsc_theme")?.value;
  const dataTheme = theme === "dark" || theme === "light" ? theme : undefined;

  return (
    <html lang="en" data-theme={dataTheme} suppressHydrationWarning>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
