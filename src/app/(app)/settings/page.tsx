"use client";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Bell, Moon, Sun, Keyboard, Download, Upload, LogOut, Sparkles, Info } from "lucide-react";
import toast from "react-hot-toast";
import { useUIStore } from "@/store/ui.store";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { setShortcutsOpen } = useUIStore();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notif, setNotif] = useState({ daily: true, exam: true, assignment: true, ai: false });

  const sections = [
    {
      title: "Profile",
      icon: UserIcon,
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white text-2xl font-bold">
              {name[0] || "?"}
            </div>
            <button onClick={() => toast.success("Avatar updated")} className="btn-ghost text-sm">
              <Upload className="w-3 h-3" /> Change avatar
            </button>
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" />
          </div>
          <button onClick={() => toast.success("Profile saved")} className="btn-primary">Save</button>
        </div>
      ),
    },
    {
      title: "Appearance",
      icon: theme === "dark" ? Moon : Sun,
      body: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-text-tertiary">Currently {theme} mode</div>
            </div>
            <button onClick={toggle} className="btn-ghost text-sm">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Notifications",
      icon: Bell,
      body: (
        <div className="space-y-2">
          {(["daily", "exam", "assignment", "ai"] as const).map((k) => (
            <label key={k} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated cursor-pointer">
              <div>
                <div className="text-sm font-medium capitalize">{k} reminders</div>
                <div className="text-xs text-text-tertiary">
                  {k === "daily" && "Daily check-in to log study time"}
                  {k === "exam" && "Get reminders 7, 3, and 1 day before exams"}
                  {k === "assignment" && "Pings as due dates approach"}
                  {k === "ai" && "Weekly AI-curated suggestions"}
                </div>
              </div>
              <input
                type="checkbox"
                checked={notif[k]}
                onChange={(e) => setNotif({ ...notif, [k]: e.target.checked })}
                className="w-4 h-4 accent-purple-500"
              />
            </label>
          ))}
        </div>
      ),
    },
    {
      title: "Keyboard shortcuts",
      icon: Keyboard,
      body: (
        <div>
          <p className="text-sm text-text-secondary mb-3">View all shortcuts at a glance.</p>
          <button onClick={() => setShortcutsOpen(true)} className="btn-ghost text-sm">
            <Keyboard className="w-3.5 h-3.5" /> Show shortcuts
          </button>
        </div>
      ),
    },
    {
      title: "Data",
      icon: Download,
      body: (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => toast.success("Export started")} className="btn-ghost text-sm">
            <Download className="w-3.5 h-3.5" /> Export data
          </button>
          <button onClick={() => toast.success("Import ready")} className="btn-ghost text-sm">
            <Upload className="w-3.5 h-3.5" /> Import data
          </button>
        </div>
      ),
    },
    {
      title: "About",
      icon: Info,
      body: (
        <div className="text-sm text-text-secondary space-y-2">
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <Sparkles className="w-4 h-4 text-accent" /> Vyro Notes v1.0.0
          </div>
          <p>A premium AI-powered student productivity workspace.</p>
          <p className="text-xs text-text-tertiary">Made for students. Built with Next.js, Tailwind, and Framer Motion.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Settings</h1>
      <p className="text-text-secondary text-sm mb-6">Customize your workspace.</p>

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.title} className="card">
            <div className="flex items-center gap-2 mb-4">
              <s.icon className="w-4 h-4 text-accent" />
              <h2 className="font-semibold">{s.title}</h2>
            </div>
            {s.body}
          </div>
        ))}

        <button
          onClick={() => {
            logout();
            toast.success("Signed out");
            router.push("/");
          }}
          className="w-full p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}
