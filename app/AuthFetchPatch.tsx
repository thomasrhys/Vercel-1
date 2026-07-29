"use client";

import { useEffect } from "react";
import { supabaseAuthClient } from "@/lib/supabase-auth";

export default function AuthFetchPatch() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      const shouldAttachAuth =
        url.startsWith("/api/favourites") ||
        url.startsWith("/api/recently-played") ||
        url.startsWith("/api/admin/");

      if (!shouldAttachAuth) return originalFetch(input, init);

      const { data } = await supabaseAuthClient.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return originalFetch(input, init);

      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
