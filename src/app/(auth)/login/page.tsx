"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, hasSupabase } from "@/store/auth.store";
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading, error, setError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch {
      
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 mesh-bg -z-10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-strong rounded-2xl p-8 shadow-2xl"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-xl gradient-accent flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Vyro Notes</span>
        </Link>

        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-text-secondary mb-6">Sign in to continue studying.</p>

        {!hasSupabase && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">
              Supabase is not configured. Authentication is unavailable — the app still works offline with local data.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-10"
                placeholder="you@school.edu"
                disabled={busy}
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-secondary">Password</label>
              <Link href="/reset-password" className="text-xs text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pl-10"
                placeholder="••••••••"
                disabled={busy}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full mt-2 disabled:opacity-60"
            disabled={busy || !hasSupabase}
          >
            {busy ? "Signing in…" : "Sign in"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {hasSupabase && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-app" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-bg-surface text-xs text-text-tertiary">OR</span>
              </div>
            </div>
            <button className="w-full btn-ghost" disabled>
              <span className="text-base">G</span> Continue with Google
              <span className="text-xs text-text-tertiary ml-1">(coming soon)</span>
            </button>
          </>
        )}

        <p className="text-sm text-text-secondary text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
