import { hashPassword, verifyPasswordHash } from "./auth";
import { getSupabaseAdmin } from "./supabase";

type AppSettingsRow = {
  id: number;
  password_hash: string | null;
  password_salt: string | null;
  site_description: string;
};

export type AppSettings = {
  passwordSet: boolean;
  siteDescription: string;
};

async function loadRow(): Promise<AppSettingsRow | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return data as AppSettingsRow | null;
}

export async function getAppSettings(): Promise<AppSettings> {
  const row = await loadRow();
  return {
    passwordSet: Boolean(row?.password_hash && row?.password_salt),
    siteDescription: row?.site_description ?? "",
  };
}

export async function setPassword(newPassword: string): Promise<void> {
  const { hash, salt } = hashPassword(newPassword);
  const supabase = getSupabaseAdmin();
  await supabase.from("app_settings").upsert({ id: 1, password_hash: hash, password_salt: salt });
}

export async function verifyPassword(password: string): Promise<boolean> {
  const row = await loadRow();
  if (!row?.password_hash || !row.password_salt) return false;
  return verifyPasswordHash(password, row.password_hash, row.password_salt);
}

export async function setSiteDescription(text: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("app_settings").upsert({ id: 1, site_description: text });
}
