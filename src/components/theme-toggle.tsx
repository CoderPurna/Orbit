"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  iconSize?: number;
}

export function ThemeToggle({
  className,
  variant = "ghost",
  iconSize = 15,
}: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className={cn("h-9 w-9 rounded-full", className)} />;
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors", className)}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </Button>
  );
}
