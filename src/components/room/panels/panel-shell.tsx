"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoomStore } from "@/store/useRoomStore";

export function PanelShell({
  title,
  subtitle,
  actions,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const setPanel = useRoomStore((s) => s.setPanel);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-room-border/60 flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground truncate text-[11px]">
              {subtitle}
            </p>
          )}
        </div>
        {actions}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close panel"
          onClick={() => setPanel(null)}
        >
          <X />
        </Button>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      {footer && (
        <div className="border-room-border/60 shrink-0 border-t p-3">
          {footer}
        </div>
      )}
    </div>
  );
}
