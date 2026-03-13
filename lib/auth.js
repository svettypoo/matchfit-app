import crypto from "crypto";

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns "salt:hash" format.
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}

/**
 * Generate a random token using crypto.randomUUID.
 */
export function generateToken() {
  return crypto.randomUUID();
}
