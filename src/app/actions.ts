"use server";

import { createSession, requireAuthenticated } from "@/lib/auth";
import { getAppSettings, setPassword, setSiteDescription, verifyPassword } from "@/lib/settings";
import { cookies } from "next/headers";

export async function loginAction(password: string): Promise<{ ok: boolean }> {
  const ok = await verifyPassword(password);
  if (ok) await createSession();
  return { ok };
}

// First-run setup: only succeeds while no password has ever been set, so a
// stranger who finds an unconfigured deployment can't silently take it over
// once you've actually set your password.
export async function setInitialPasswordAction(password: string): Promise<{ ok: boolean }> {
  const settings = await getAppSettings();
  if (settings.passwordSet) return { ok: false };
  await setPassword(password);
  await createSession();
  return { ok: true };
}

export async function changePasswordAction(newPassword: string): Promise<void> {
  await requireAuthenticated();
  await setPassword(newPassword);
}

export async function setSiteDescriptionAction(text: string): Promise<void> {
  await requireAuthenticated();
  await setSiteDescription(text);
}

// Per-browser display preference, not owner-only data — no auth required.
export async function setThemeAction(theme: "light" | "dark" | "system"): Promise<void> {
  const store = await cookies();
  if (theme === "system") {
    store.delete("dsc_theme");
    return;
  }
  store.set("dsc_theme", theme, { maxAge: 60 * 60 * 24 * 365, path: "/" });
}
