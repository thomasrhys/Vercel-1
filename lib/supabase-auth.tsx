"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey);

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoaded: false,
  isSignedIn: false,
  isAdmin: false,
  signOut: async () => undefined,
});

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabaseAuthClient.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setIsLoaded(true);
    });

    const { data: listener } = supabaseAuthClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoaded(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user || null;
    const email = user?.email?.toLowerCase() || "";
    const adminEmails = getAdminEmails();

    return {
      user,
      session,
      isLoaded,
      isSignedIn: !!user,
      isAdmin: !!email && adminEmails.includes(email),
      signOut: async () => {
        await supabaseAuthClient.auth.signOut();
        window.location.href = "/";
      },
    };
  }, [session, isLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}

export function UserButton() {
  const { user, signOut } = useSupabaseAuth();

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={signOut}
      title="Sign out"
      className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center"
    >
      {(user.email || "U").slice(0, 1).toUpperCase()}
    </button>
  );
}

export function SignInButton({ children }: { children: ReactNode }) {
  return <button type="button" onClick={() => (window.location.href = "/login")}>{children}</button>;
}

export async function getSupabaseAccessToken() {
  const { data } = await supabaseAuthClient.auth.getSession();
  return data.session?.access_token || "";
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getSupabaseAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
