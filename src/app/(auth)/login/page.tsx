"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("gaurav@vyronotes.app");
  const [password, setPassword] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    login(email, password);
    toast.success("Welcome back!");
    router.push("/dashboard");
  };

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

        <button className="w-full btn-ghost mb-4">
          <span className="text-base">G</span> Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-app" /></div>
          <div className="relative flex justify-center"><span className="px-3 bg-bg-surface text-xs text-text-tertiary">OR</span></div>
        </div>

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
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
