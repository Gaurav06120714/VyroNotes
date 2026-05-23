"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rect" | "circle" | "text" | "card";
}

export function Skeleton({ className, variant = "rect", ...rest }: SkeletonProps) {
  const base = "skeleton";
  const variantClass =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
      ? "h-4 rounded"
      : variant === "card"
      ? "h-28 rounded-xl"
      : "rounded-md";
  return <div className={cn(base, variantClass, className)} {...rest} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}
