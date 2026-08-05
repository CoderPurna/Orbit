import { randomBytes } from "node:crypto";

/**
 * Generates a clean, readable 9-character room code (e.g. "abc-defg-hij")
 */
export function generateRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(9);
  let result = "";
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 7) result += "-";
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
