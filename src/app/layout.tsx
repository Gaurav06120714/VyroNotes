import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeBoot } from "@/components/ThemeBoot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vyro Notes — Your AI-Powered Study Sanctuary",
  description:
    "A premium AI-powered student productivity app for notes, flashcards, quizzes, assignments and exams.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeBoot />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(26, 26, 37, 0.95)",
              color: "#e8e8f0",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
