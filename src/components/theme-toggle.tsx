"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon} from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full border border-border bg-secondary/50" />
    );
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Current theme: ${theme}. Click to switch.`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground transition-all duration-150 ease-out hover:bg-secondary hover:border-primary/40 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {theme === "dark" && <Moon className="h-4 w-4 text-primary transition-all" />}
      {theme === "light" && <Sun className="h-4 w-4 text-amber-500 transition-all" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
