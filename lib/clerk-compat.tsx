"use client";

import { type ReactNode } from "react";
import { UserButton as SupabaseUserButton, useSupabaseAuth } from "@/lib/supabase-auth";

export function useUser() {
  const { user, isLoaded, isSignedIn, isAdmin } = useSupabaseAuth();

  return {
    isLoaded,
    isSignedIn,
    user: user
      ? {
          id: user.id,
          primaryEmailAddress: { emailAddress: user.email || "" },
          emailAddresses: user.email ? [{ emailAddress: user.email }] : [],
          publicMetadata: { isAdmin },
        }
      : null,
  };
}

export function UserButton() {
  return <SupabaseUserButton />;
}

export function SignInButton({ children }: { children: ReactNode; mode?: string }) {
  return <button type="button" onClick={() => (window.location.href = "/login")}>{children}</button>;
}

export function SignIn() {
  return <button type="button" onClick={() => (window.location.href = "/login")}>Login</button>;
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
