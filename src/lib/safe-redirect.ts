/**
 * Only same-origin, path-style redirect targets are honoured (F2: the return
 * path preserves the room, but an open redirect is not the price of that).
 */
export function safeNext(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value) return fallback;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
