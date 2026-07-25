import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "../.auth");
const LOCK_PATH = path.join(AUTH_DIR, ".suite.lock");

/** How long a lock may sit before being treated as abandoned (ms). */
const STALE_MS = 45 * 60 * 1000;
/** Max wait for another Playwright process to finish (ms). */
const WAIT_MS = 50 * 60 * 1000;
const POLL_MS = 2_000;

function ensureAuthDir(): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

function readLockMeta(): { pid: number; startedAt: number } | null {
  try {
    const raw = fs.readFileSync(LOCK_PATH, "utf8");
    const [pidLine, tsLine] = raw.split("\n");
    const pid = Number(pidLine);
    const startedAt = Number(tsLine);
    if (!Number.isFinite(pid) || !Number.isFinite(startedAt)) return null;
    return { pid, startedAt };
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exclusive lock so parallel `pnpm test:e2e:*` terminals do not clobber
 * `e2e/.auth/*` or fight over the Vite server on :5173.
 */
export async function acquireSuiteLock(): Promise<void> {
  ensureAuthDir();
  const deadline = Date.now() + WAIT_MS;

  while (Date.now() < deadline) {
    try {
      const fd = fs.openSync(LOCK_PATH, "wx");
      fs.writeFileSync(fd, `${process.pid}\n${Date.now()}\n`);
      fs.closeSync(fd);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;

      const meta = readLockMeta();
      const staleByAge =
        meta != null && Date.now() - meta.startedAt > STALE_MS;
      const staleByPid = meta != null && !isProcessAlive(meta.pid);

      if (staleByAge || staleByPid || meta == null) {
        try {
          fs.unlinkSync(LOCK_PATH);
          continue;
        } catch {
          // Lost race removing stale lock — retry acquire.
        }
      }

      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }

  throw new Error(
    `Timed out waiting for E2E suite lock (${LOCK_PATH}). ` +
      `Another Playwright run may still be using e2e/.auth — wait or delete the lock file.`,
  );
}

export function releaseSuiteLock(): void {
  try {
    const meta = readLockMeta();
    if (meta && meta.pid !== process.pid && isProcessAlive(meta.pid)) {
      // Do not steal a live lock owned by another process.
      return;
    }
    fs.unlinkSync(LOCK_PATH);
  } catch {
    // already released
  }
}
