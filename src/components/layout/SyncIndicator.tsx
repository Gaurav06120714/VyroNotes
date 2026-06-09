"use client";
import { useNotesStore } from "@/store/notes.store";
import { hasSupabase } from "@/store/auth.store";
import { Cloud, CloudOff, Loader2, CheckCircle } from "lucide-react";

export function SyncIndicator() {
  const syncStatus = useNotesStore((s) => s.syncStatus);

  if (!hasSupabase) {
    return (
      <div
        title="Running offline — Supabase not configured"
        className="flex items-center gap-1.5 text-[10px] text-text-tertiary px-2 py-1 rounded"
      >
        <CloudOff className="w-3 h-3" />
        <span className="hidden lg:inline">Offline</span>
      </div>
    );
  }

  if (syncStatus === "syncing") {
    return (
      <div
        title="Syncing…"
        className="flex items-center gap-1.5 text-[10px] text-text-tertiary px-2 py-1 rounded"
      >
        <Loader2 className="w-3 h-3 animate-spin text-accent" />
        <span className="hidden lg:inline">Syncing…</span>
      </div>
    );
  }

  if (syncStatus === "error") {
    return (
      <div
        title="Sync error — changes saved locally"
        className="flex items-center gap-1.5 text-[10px] text-red-400 px-2 py-1 rounded"
      >
        <CloudOff className="w-3 h-3" />
        <span className="hidden lg:inline">Sync error</span>
      </div>
    );
  }

  if (syncStatus === "synced") {
    return (
      <div
        title="All changes synced"
        className="flex items-center gap-1.5 text-[10px] text-green-400 px-2 py-1 rounded"
      >
        <CheckCircle className="w-3 h-3" />
        <span className="hidden lg:inline">Synced</span>
      </div>
    );
  }

  return (
    <div
      title="Cloud sync ready"
      className="flex items-center gap-1.5 text-[10px] text-text-tertiary px-2 py-1 rounded"
    >
      <Cloud className="w-3 h-3" />
      <span className="hidden lg:inline">Cloud</span>
    </div>
  );
}
