"use client";
import { useEffect, useRef, useState } from "react";

export function useAutosave<T>(
  value: T,
  onSave: (value: T) => void,
  delay = 1500
) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setStatus("saving");
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      onSave(value);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    }, delay);
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return status;
}
