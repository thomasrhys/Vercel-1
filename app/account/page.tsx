"use client";

import { useEffect, useState } from "react";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseAuthClient, useSupabaseAuth } from "@/lib/supabase-auth";

const OWNER_EMAIL = "thomasrhyshughes29@gmail.com";
const OWNER_NAMES = ["owner", "pitstopyt"];
const RESERVED = ["admin", "administrator", "support", "staff", "system", "gamesportal", "fnfaw", "moderator", "official", "api", "root"];

function GoogleIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" /></svg>; }
function GitHubIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18A10.9 10.9 0 0 1 12 6.01c.97 0 1.94.13 2.85.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" /></svg>; }
function MicrosoftIcon() { return <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true"><path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#7fba00" d="M12 1h10v10H12z" /><path fill="#00a4ef" d="M1 12h10v10H1z" /><path fill="#ffb900" d="M12 12h10v10H12z" /></svg>; }
function msg(error: unknown) { if (error instanceof Error && error.message && error.message !== "{}") return error.message; if (typeof error === "string" && error && error !== "{}") return error; if (typeof error === "object" && error !== null) { const value = error as { message?: unknown; error_description?: unknown; error?: unknown; code?: unknown; status?: unknown; name?: unknown }; if (typeof value.message === "string" && value.message && value.message !== "{}") return value.message; if (typeof value.error_description === "string" && value.error_description) return value.error_description; if (typeof value.error === "string" && value.error) return value.error; if (typeof value.code === "string" && value.code) return value.code; if (typeof value.name === "string" && value.name) return value.name; if (value.status) return `Request failed with status ${String(value.status)}`; try { const json = JSON.stringify(error); if (json && json !== "{}") return json; } catch {} } return "Supabase returned an empty error. Check Auth email settings, SMTP, and rate limits."; }
function cleanUsername(value: string) { return value.trim().toLowerCase().replace(/^@+/, ""); }

export default function AccountPage() {
  const { user, isLoaded, isSignedIn, signOut } = useSupabaseAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const email = user?.email?.toLowerCase() || "";
  const isOwner = email === OWNER_EMAIL;
  const providers = (user?.identities || []).map((identity) => identity.provider);
  const hasPassword = providers.includes("email");
  const hasGoogle = providers.includes("google");
  const hasGitHub = providers.includes("github");
  const hasMicrosoft = providers.includes("azure");
  const profilePath = username ? `/${username}` : "";

  useEffect(() => {
    if (!user) return;
    supabaseAuthClient.from("user_profiles").select("display_name, username, avatar_url, bio, is_public").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name || "");
      setUsername(data?.username || (isOwner ? "owner" : ""));
      setAvatarUrl(data?.avatar_url || "");
      setBio(data?.bio || "");
      setIsPublic(data?.is_public ?? true);
    });
  }, [user, isOwner]);

  const saveProfile = async (nextAvatarUrl = avatarUrl) => {
    if (!user) return;
    setMessage("");
    const nextUsername = cleanUsername(username);
    if (nextUsername && !/^[a-z0-9_]{3,20}$/.test(nextUsername)) return setMessage("Username must be 3-20 characters using letters, numbers, or underscores.");
    if (!isOwner && (OWNER_NAMES.includes(nextUsername) || RESERVED.includes(nextUsername))) return setMessage("That username is reserved.");
    if (isOwner && nextUsername && !OWNER_NAMES.includes(nextUsername) && RESERVED.includes(nextUsername)) return setMessage("That username is reserved.");
    setSaving(true);
    try {
      const { error } = await supabaseAuthClient.from("user_profiles").upsert({ user_id: user.id, display_name: displayName.trim() || null, username: nextUsername || null, bio: bio.trim() || null, avatar_url: nextAvatarUrl.trim() || null, is_public: isPublic, role: isOwner ? "owner" : "user", updated_at: new Date().toISOString() });
      if (error) return setMessage(msg(error));
      setUsername(nextUsername);
      setAvatarUrl(nextAvatarUrl);
      setMessage("Profile saved.");
    } catch (error) { setMessage(msg(error)); } finally { setSaving(false); }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setMessage("");
    if (!file.type.startsWith("image/")) return setMessage("Please choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setMessage("Avatar must be under 2MB.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabaseAuthClient.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) return setMessage(msg(error));
      const { data } = supabaseAuthClient.storage.from("avatars").getPublicUrl(path);
      await saveProfile(`${data.publicUrl}?v=${Date.now()}`);
      setMessage("Avatar uploaded and saved.");
    } catch (error) { setMessage(msg(error)); } finally { setUploading(false); }
  };

  const addEmailPasswordLogin = async () => {
    setMessage("");
    const nextEmail = newEmail.trim().toLowerCase();
    if (!user) return;
    if (email) return setMessage("This account already has an email address.");
    if (!nextEmail || !nextEmail.includes("@")) return setMessage("Enter a valid email address.");
    if (!newPassword || !confirmPassword) return setMessage("Enter your new password and confirmation.");
    if (newPassword.length < 6) return setMessage("Password must be at least 6 characters long.");
    if (newPassword !== confirmPassword) return setMessage("Passwords do not match.");
    setBusy(true);
    try {
      const session = await supabaseAuthClient.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return setMessage("Your session expired. Please log in again.");
      const response = await fetch("/api/account/add-email-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: nextEmail, password: newPassword, redirectTo: `${window.location.origin}/account` }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(msg(data?.error || data));
      setNewEmail(""); setNewPassword(""); setConfirmPassword("");
      setMessage(data?.message || "Verification email sent. Verify the email address before using email/password login.");
    } catch (error) { setMessage(msg(error)); } finally { setBusy(false); }
  };

  const changePassword = async () => {
    setMessage("");
    if (!user || !email) return setMessage("This account does not have an email address for password login. Add an email first.");
    if (!newPassword || !confirmPassword) return setMessage("Enter your new password and confirmation.");
    if (hasPassword && !oldPassword) return setMessage("Enter your current password.");
    if (newPassword.length < 6) return setMessage("New password must be at least 6 characters long.");
    if (newPassword !== confirmPassword) return setMessage("New passwords do not match.");
    setBusy(true);
    try {
      if (hasPassword) {
        const check = await supabaseAuthClient.auth.signInWithPassword({ email, password: oldPassword });
        if (check.error) return setMessage("Current password is incorrect.");
        if (check.data.user?.id !== user.id) return setMessage("Password check did not match this account.");
      }
      const update = await supabaseAuthClient.auth.updateUser({ password: newPassword });
      if (update.error) return setMessage(msg(update.error));
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage(hasPassword ? "Password updated." : "Password set. You can now use email and password login.");
    } catch (error) { setMessage(msg(error)); } finally { setBusy(false); }
  };

  const linkProvider = async (provider: "google" | "github" | "azure") => {
    setMessage(""); setBusy(true);
    const { error } = await supabaseAuthClient.auth.linkIdentity({ provider, options: { redirectTo: `${window.location.origin}/account` } });
    if (error) { setMessage(msg(error)); setBusy(false); }
  };

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading account...</main>;
  if (!isSignedIn) return <main className="min-h-screen bg-background flex items-center justify-center p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Account</CardTitle><CardDescription>Sign in to manage your account.</CardDescription></CardHeader><CardContent className="space-y-3"><Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/account")}>Login</Button><Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button></CardContent></Card></main>;

  return <main className="min-h-screen bg-background p-4 sm:p-8"><div className="max-w-md mx-auto space-y-6">
    <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Choose what appears on your public profile. No recently played games are tracked.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex items-center gap-3">{avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="h-14 w-14 rounded-full border border-border object-cover" /> : <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">{(displayName || email || "U").slice(0, 1).toUpperCase()}</div>}<div><p className="font-medium text-foreground">{displayName || "Unnamed player"} {isOwner && <span className="ml-1 rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-700">Owner</span>}</p><p className="text-xs text-muted-foreground">{username ? `/${username}` : "No username set"}</p></div></div>
      <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
      <Input value={username} onChange={(event) => setUsername(cleanUsername(event.target.value))} placeholder="username" />
      {isOwner && <p className="text-xs text-muted-foreground">Reserved for you: /owner and /pitstopyt.</p>}
      <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} placeholder="Bio" className="w-full min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Public profile</label>
      <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Avatar URL" />
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload avatar"}<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); }} /></label>
      {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}
      <Button className="w-full" onClick={() => saveProfile()} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
      {profilePath && <Button variant="outline" className="w-full" onClick={() => (window.location.href = profilePath)}>View public profile</Button>}
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Manage account</CardTitle><CardDescription>Update your email, password, or linked sign-in methods.</CardDescription></CardHeader><CardContent className="space-y-4">
      <Input value={email || "No email on this account"} readOnly />
      {!email && <div className="space-y-3 rounded-md border border-border p-3"><p className="text-sm text-muted-foreground">Add an email and password to this account. You must verify the email before using it to log in.</p><Input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Email address" /><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Password" /><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" /><Button className="w-full" onClick={addEmailPasswordLogin} disabled={busy}>{busy ? "Sending..." : "Send verification email"}</Button></div>}
      {email && <><Input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} disabled={!hasPassword} placeholder={hasPassword ? "Current password" : "Not needed until a password is set"} /><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder={hasPassword ? "New password" : "Set password"} /><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" /><Button className="w-full" onClick={changePassword} disabled={busy}>{hasPassword ? "Update password" : "Set password"}</Button></>}
      <div className="grid grid-cols-1 gap-2">
        {hasGoogle ? <Button variant="outline" disabled className="justify-center gap-2 border-green-500 text-green-700"><GoogleIcon /><Check className="h-4 w-4" />Google Linked</Button> : <Button variant="outline" onClick={() => linkProvider("google")} disabled={busy} className="justify-center gap-2"><GoogleIcon />Link Google</Button>}
        {hasGitHub ? <Button variant="outline" disabled className="justify-center gap-2 border-green-500 text-green-700"><GitHubIcon /><Check className="h-4 w-4" />GitHub Linked</Button> : <Button variant="outline" onClick={() => linkProvider("github")} disabled={busy} className="justify-center gap-2"><GitHubIcon />Link GitHub</Button>}
        {hasMicrosoft ? <Button variant="outline" disabled className="justify-center gap-2 border-green-500 text-green-700"><MicrosoftIcon /><Check className="h-4 w-4" />Microsoft Linked</Button> : <Button variant="outline" onClick={() => linkProvider("azure")} disabled={busy} className="justify-center gap-2"><MicrosoftIcon />Link Microsoft</Button>}
      </div>
      <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button><Button variant="outline" className="w-full" onClick={signOut}>Log out</Button>
    </CardContent></Card>
  </div></main>;
}
