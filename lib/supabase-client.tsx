// lib/supabase-client.tsx
// Re-export the canonical browser client and auth helpers
// All imports of { supabase } or { useUser } etc. now share one GoTrue instance

"use client";

export { supabaseAuthClient as supabase } from './supabase-auth';
export { useSupabaseAuth as useUser, SupabaseAuthProvider as AuthProvider } from './supabase-auth';
