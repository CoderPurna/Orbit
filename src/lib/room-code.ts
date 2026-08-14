import { randomBytes } from "node:crypto";

// PRD F2: `orb-xxxx-xxxx`, lowercase, from an alphabet excluding visually
// ambiguous characters (0 O 1 l I). Rejection sampling avoids modulo bias.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const LIMIT = 256 - (256 % ALPHABET.length);

export function generateRoomCode(): string {
  const chars: string[] = [];
  while (chars.length < 8) {
    for (const byte of randomBytes(16)) {
      if (byte < LIMIT) {
        chars.push(ALPHABET[byte % ALPHABET.length]);
        if (chars.length === 8) break;
      }
    }
  }
  return `orb-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}
