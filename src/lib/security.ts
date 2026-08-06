import argon2 from "argon2";

/**
 * Hashes a plaintext passcode using Argon2.
 */
export async function hashPasscode(passcode: string): Promise<string> {
  return await argon2.hash(passcode);
}

/**
 * Verifies a plaintext passcode against an Argon2 hash.
 */
export async function verifyPasscode(
  passcode: string,
  hash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, passcode);
  } catch {
    return false;
  }
}
