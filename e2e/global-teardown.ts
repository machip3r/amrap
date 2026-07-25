import { cleanupSeededE2eAccounts } from "./fixtures/cleanup";
import { releaseSuiteLock } from "./helpers/suite-lock";

/**
 * Runs once after the full Playwright suite.
 * Removes seeded owner/provisional org → gym → branch rows and auth users.
 */
export default async function globalTeardown(): Promise<void> {
  try {
    await cleanupSeededE2eAccounts();
  } finally {
    releaseSuiteLock();
  }
}
