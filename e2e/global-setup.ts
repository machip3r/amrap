import { acquireSuiteLock } from "./helpers/suite-lock";

/**
 * Serialize concurrent Playwright processes (e.g. several `pnpm test:e2e:*`
 * terminals). Shared `e2e/.auth` + port 5173 are not safe to share.
 */
export default async function globalSetup(): Promise<void> {
  await acquireSuiteLock();
}
