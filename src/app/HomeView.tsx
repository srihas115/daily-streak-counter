"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StreakDisplay } from "@/lib/streaks";
import { changePasswordAction, loginAction, setInitialPasswordAction, setSiteDescriptionAction, setThemeAction } from "./actions";
import Footer from "./Footer";

type Streak = StreakDisplay & { checkedInToday: boolean };

type Props = {
  authenticated: boolean;
  passwordSet: boolean;
  siteDescription: string;
  streaks: Streak[];
};

export default function HomeView({ authenticated, passwordSet, siteDescription, streaks }: Props) {
  const router = useRouter();

  const [viewerDismissed, setViewerDismissed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState(siteDescription);
  const [descPending, setDescPending] = useState(false);

  async function handleFirstRunSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSetupError(null);
    if (setupPassword.length < 4) {
      setSetupError("Use at least 4 characters");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords don't match");
      return;
    }
    setPending(true);
    try {
      const result = await setInitialPasswordAction(setupPassword);
      if (!result.ok) {
        setSetupError("A password is already set — reload the page");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setPending(true);
    try {
      const { ok } = await loginAction(password);
      if (!ok) {
        setLoginError("Incorrect password");
        return;
      }
      setPassword("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordChangeMsg(null);
    if (newPassword.length < 4) {
      setPasswordChangeMsg("Use at least 4 characters");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordChangeMsg("Passwords don't match");
      return;
    }
    await changePasswordAction(newPassword);
    setNewPassword("");
    setNewPasswordConfirm("");
    setPasswordChangeMsg("Password updated");
  }

  async function handleDescriptionSave() {
    if (descDraft === siteDescription) return;
    setDescPending(true);
    try {
      await setSiteDescriptionAction(descDraft);
      router.refresh();
    } finally {
      setDescPending(false);
    }
  }

  async function handleThemeChange(theme: "light" | "dark" | "system") {
    await setThemeAction(theme);
    router.refresh();
  }

  const showTable = authenticated || viewerDismissed || !passwordSet;

  return (
    <div className="page home-page">
      <Link href="/" className="home-btn" aria-label="Home">
        ⌂
      </Link>
      {authenticated ? (
        <button
          type="button"
          className="gear-btn"
          aria-label={settingsOpen ? "Close settings" : "Settings"}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          ⚙
        </button>
      ) : null}

      <div className="wrap home-wrap">
        {settingsOpen && authenticated ? (
          <div className="settings-panel page-fade">
            <button type="button" className="back-btn" onClick={() => setSettingsOpen(false)}>
              ← Back
            </button>
            <h2 className="settings-title">Settings</h2>

            <form onSubmit={handleChangePassword} style={{ width: "100%" }}>
              <label className="settings-label" htmlFor="new-password">
                Change password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Confirm new password"
                style={{ marginTop: 8 }}
              />
              <button type="submit" style={{ width: "100%" }}>
                Update password
              </button>
              {passwordChangeMsg ? <div className="settings-note">{passwordChangeMsg}</div> : null}
            </form>

            <label className="settings-label" htmlFor="site-desc" style={{ marginTop: 20 }}>
              Site description
            </label>
            <textarea
              id="site-desc"
              className="no-resize"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleDescriptionSave}
              disabled={descPending}
              rows={4}
              placeholder="Shown on the home page. Leave empty to hide."
            />

            <label className="settings-label" style={{ marginTop: 20 }}>
              Theme
            </label>
            <div className="theme-buttons">
              <button type="button" onClick={() => handleThemeChange("system")}>
                System
              </button>
              <button type="button" onClick={() => handleThemeChange("light")}>
                Light
              </button>
              <button type="button" onClick={() => handleThemeChange("dark")}>
                Dark
              </button>
            </div>

            <Footer />
          </div>
        ) : (
          <div className="page-fade home-main">
            <h1 className="home-title">Daily Streak Counter</h1>

            {!passwordSet ? (
              <form className="password-inline" onSubmit={handleFirstRunSubmit}>
                <div className="settings-note">Set up your password to enable check-ins.</div>
                <input
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Choose a password"
                  autoFocus
                />
                <input
                  type="password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Confirm password"
                  style={{ marginTop: 8 }}
                />
                <button type="submit" disabled={pending}>
                  Set password
                </button>
                {setupError ? <div className="login-error">{setupError}</div> : null}
              </form>
            ) : !authenticated && !viewerDismissed ? (
              <div className="landing-choice">
                {!loginOpen ? (
                  <div className="landing-choice-buttons">
                    <button type="button" onClick={() => setLoginOpen(true)}>
                      Enter Password
                    </button>
                    <button type="button" className="password-cancel" onClick={() => setViewerDismissed(true)}>
                      Continue as Viewer
                    </button>
                  </div>
                ) : (
                  <form className="password-inline" onSubmit={handleLoginSubmit}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      autoFocus
                    />
                    <div className="password-inline-actions">
                      <button type="submit" disabled={pending || !password}>
                        Log in
                      </button>
                      <button type="button" className="password-cancel" onClick={() => setLoginOpen(false)}>
                        Cancel
                      </button>
                    </div>
                    {loginError ? <div className="login-error">{loginError}</div> : null}
                  </form>
                )}
              </div>
            ) : null}

            {siteDescription ? <div className="site-description">{siteDescription}</div> : null}

            {showTable ? (
              <div className="table-scroll">
                <table className="streak-table">
                  <thead>
                    <tr>
                      <th>dstreak</th>
                      <th>Description</th>
                      <th>Current</th>
                      <th>Today</th>
                      <th>Next goal</th>
                      <th>Longest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streaks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-row">
                          No dstreaks yet — visit a path like /morning to create one.
                        </td>
                      </tr>
                    ) : (
                      streaks.map((s) => (
                        <tr key={s.slug}>
                          <td>
                            <Link href={`/${s.slug}`}>/{s.slug}</Link>
                          </td>
                          <td>{s.description}</td>
                          <td>{s.count}</td>
                          <td>{s.checkedInToday ? "✓" : "—"}</td>
                          <td>{s.nextMilestone}</td>
                          <td>{s.longest}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            <Footer />
          </div>
        )}
      </div>
    </div>
  );
}
