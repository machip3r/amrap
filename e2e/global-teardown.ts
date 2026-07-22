import { cleanupSeededE2eAccounts } from "./fixtures/cleanup";

/**
 * Runs once after the full Playwright suite.
 * Removes seeded owner/provisional org → gym → branch rows and auth users.
 */
export default async function globalTeardown(): Promise<void> {
  await cleanupSeededE2eAccounts();
}
