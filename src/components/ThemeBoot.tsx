"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export function ThemeBoot() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);
  return null;
}
