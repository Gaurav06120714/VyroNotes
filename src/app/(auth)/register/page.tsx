"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore, hasSupabase } from "@/store/auth.store";
import { Sparkles, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { signUp, loading, error, setError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Fill all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password, name);
      setRegistered(true);
      toast.success("Account created! Check your email to confirm.");
    } catch {
      
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="fixed inset-0 mesh-bg -z-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-strong rounded-2xl p-8 shadow-2xl text-center"
        >
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-text-secondary mb-6">
            We sent a confirmation link to <span className="text-text-primary font-medium">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
            Go to sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

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

        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-text-secondary mb-6">Start your free trial today.</p>

        {!hasSupabase && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300">
              Supabase is not configured. Registration is unavailable — the app works offline with local data.
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
            <label className="text-xs text-text-secondary mb-1.5 block">Full name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base pl-10"
                placeholder="Your name"
                disabled={busy}
                required
              />
            </div>
          </div>
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
            <label className="text-xs text-text-secondary mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pl-10"
                placeholder="At least 8 characters"
                minLength={8}
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
            {busy ? "Creating account…" : "Create account"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
