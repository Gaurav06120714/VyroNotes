"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore, hasSupabase } from "@/store/auth.store";
import { Sparkles, Mail, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const { resetPassword, loading, error, setError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Reset link sent!");
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

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-sm text-text-secondary mb-6">
              We sent a password reset link to{" "}
              <span className="text-text-primary font-medium">{email}</span>.
            </p>
            <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
            <p className="text-sm text-text-secondary mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {!hasSupabase && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">Supabase is not configured.</p>
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
              <button
                type="submit"
                className="btn-primary w-full mt-2 disabled:opacity-60"
                disabled={busy || !hasSupabase}
              >
                {busy ? "Sending…" : "Send reset link"} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-sm text-text-secondary text-center mt-6">
              <Link href="/login" className="text-accent hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
