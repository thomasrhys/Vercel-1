"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DEFAULT_ADMIN_EMAILS = "pitstopyt1@gmail.com,thomasrhyshughes29@gmail.com";

export const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

type AuthValue = { user: User | null; session: Session | null; isLoaded: boolean; isSignedIn: boolean; isAdmin: boolean; signOut: () => Promise<void>; };

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS).split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) { return <>{children}</>; }

export function useSupabaseAuth(): AuthValue {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabaseAuthClient.auth.getSession().then(({ data }) => { setSession(data.session || null); setIsLoaded(true); });
    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setIsLoaded(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  return useMemo(() => {
    const user = session?.user || null;
    const email = user?.email?.toLowerCase() || "";
    const adminEmails = getAdminEmails();
    return { user, session, isLoaded, isSignedIn: !!user, isAdmin: !!email && adminEmails.includes(email), signOut: async () => { await supabaseAuthClient.auth.signOut(); window.location.href = "/"; } };
  }, [session, isLoaded]);
}

export function UserButton() {
  const { user, signOut } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    supabaseAuthClient
      .from("user_profiles")
      .select("username, display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUsername(data?.username || "");
        setDisplayName(data?.display_name || "");
        setAvatarUrl(data?.avatar_url || "");
      });
  }, [user]);

  if (!user) return null;
  const label = displayName || user.email || user.phone || "Account";
  const subLabel = user.email || user.phone || "Signed in";

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen((open) => !open)} title="Account menu" className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center overflow-hidden">
        {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" /> : label.slice(0, 1).toUpperCase()}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center overflow-hidden shrink-0">
              {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" /> : label.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{subLabel}</p>
              {username && <p className="text-xs text-muted-foreground truncate">/{username}</p>}
            </div>
          </div>
          {username && <button type="button" className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted" onClick={() => { setIsOpen(false); window.location.href = `/${username}`; }}>View public profile</button>}
          <button type="button" className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted" onClick={() => { setIsOpen(false); window.location.href = "/account"; }}>Manage account</button>
          <button type="button" className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted" onClick={signOut}>Logout</button>
        </div>
      )}
    </div>
  );
}

export function SignInButton({ children }: { children: ReactNode }) { return <button type="button" onClick={() => (window.location.href = "/login")}>{children}</button>; }
export async function getSupabaseAccessToken() { const { data } = await supabaseAuthClient.auth.getSession(); return data.session?.access_token || ""; }
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) { const token = await getSupabaseAccessToken(); const headers = new Headers(init.headers); if (token) headers.set("Authorization", `Bearer ${token}`); return fetch(input, { ...init, headers }); }
