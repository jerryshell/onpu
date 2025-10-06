"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hasViewTransition =
      typeof document !== "undefined" &&
      (document as unknown as { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;

    if (!hasViewTransition || prefersReduced) {
      setTheme(next);
      return;
    }

    (document as unknown as { startViewTransition: (cb: () => void) => unknown }).startViewTransition(
      () => {
        setTheme(next);
      }
    );
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">切换主题</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
    >
      {resolvedTheme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
