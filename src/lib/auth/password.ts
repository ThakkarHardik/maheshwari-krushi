import bcrypt from "bcryptjs";

const COST = 12;

export const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A real bcrypt hash of a random string. Compared against when the email does
 * not exist, so a login attempt takes the same time either way.
 */
export const DUMMY_HASH = "$2b$12$.itmNiIwXhfaBm08L8rn4Ob351M8./FLDZYN7RFU/MMZ/4u8sEP4O";
