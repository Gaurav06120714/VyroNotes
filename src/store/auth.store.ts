"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";
import { DEFAULT_USER } from "@/lib/dummy-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      isAuthenticated: true,
      login: (email) => set({ user: { ...DEFAULT_USER, email }, isAuthenticated: true }),
      register: (name, email) => set({ user: { name, email }, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "vyronotes-auth" }
  )
);
