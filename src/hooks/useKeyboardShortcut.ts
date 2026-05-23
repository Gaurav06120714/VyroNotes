"use client";
import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

export function useKeyboardShortcut(
  key: string,
  handler: Handler,
  opts: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (opts.meta && !(e.metaKey || e.ctrlKey)) return;
      if (opts.ctrl && !e.ctrlKey) return;
      if (opts.shift && !e.shiftKey) return;
      if (opts.alt && !e.altKey) return;
      handler(e);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [key, handler, opts.meta, opts.ctrl, opts.shift, opts.alt]);
}
