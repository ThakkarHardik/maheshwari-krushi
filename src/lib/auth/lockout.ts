export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

export function isLocked(lockedUntil: Date | null, now = new Date()): boolean {
  return lockedUntil !== null && lockedUntil > now;
}

/**
 * Given the failed-attempt count *after* the latest failure, decide whether
 * the account is now locked and what the counter resets to.
 */
export function afterFailedLogin(attempts: number, now = new Date()) {
  if (attempts >= MAX_FAILED_LOGINS) {
    return {
      locked: true,
      failedLoginAttempts: 0,
      lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60_000),
    };
  }
  return { locked: false, failedLoginAttempts: attempts, lockedUntil: null };
}
