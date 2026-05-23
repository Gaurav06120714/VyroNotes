"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Sparkles, User, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState("Gaurav");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Fill all fields");
      return;
    }
    register(name, email, password);
    toast.success("Account created — welcome!");
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

        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-text-secondary mb-6">Start your free trial today.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base pl-10"
                placeholder="Your name"
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
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">
            Create account <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
