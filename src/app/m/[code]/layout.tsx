import type { ReactNode } from "react";

export const metadata = {
  title: "Meeting",
  robots: { index: false, follow: false },
};

/**
 * Everything with live media renders on the dark "room" surface regardless
 * of the user's theme (globals.css). Nesting `.dark` flips the tokens locally.
 */
export default function RoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark surface-room text-foreground min-h-svh w-full [color-scheme:dark]">
      {children}
    </div>
  );
}
