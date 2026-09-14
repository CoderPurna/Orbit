import { notFound, redirect } from "next/navigation";
import { isRoomCode } from "@/lib/room-code-format";

/**
 * PRD F2 URL shape: `orbit.app/orb-xxxx-xxxx`. The canonical room route is
 * /m/[code] (what invite emails link to); this keeps the short form working.
 */
export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalised = code.toLowerCase();
  if (isRoomCode(normalised)) {
    redirect(`/m/${normalised}`);
  }
  notFound();
}
