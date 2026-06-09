"use client";
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  init: () => Promise<() => void>;

  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getSession: () => Promise<Session | null>;

  setError: (err: string | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setError: (err) => set({ error: err }),
  setLoading: (v) => set({ loading: v }),

  init: async () => {
    if (!hasSupabase) {
      
      set({ loading: false });
      return () => {};
    }

    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseClient();

    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });
      }
    );

    return () => subscription.unsubscribe();
  },

  signUp: async (email, password, fullName) => {
    if (!hasSupabase) {
      set({ error: "Supabase is not configured. Auth unavailable." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    if (!hasSupabase) {
      set({ error: "Supabase is not configured. Auth unavailable." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!hasSupabase) {
      set({ user: null, session: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    if (!hasSupabase) {
      set({ error: "Supabase is not configured." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getSession: async () => {
    const { session } = get();
    if (session) return session;
    if (!hasSupabase) return null;
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
}));
