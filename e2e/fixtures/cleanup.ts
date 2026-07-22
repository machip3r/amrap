import fs from "fs";
import { cleanupE2eUserByEmail } from "../helpers/supabase";
import {
  ownerCredsPath,
  provisionalCredsPath,
  type OwnerFixtureCreds,
} from "./owner";

/** Best-effort: hard-delete E2E org (cascades gyms/branches) + auth user. */
export async function cleanupOwnerCreds(
  creds: OwnerFixtureCreds | null | undefined,
): Promise<void> {
  if (!creds?.email) return;
  try {
    await cleanupE2eUserByEmail(creds.email);
  } catch (error) {
    console.warn("E2E cleanup failed", creds.email, error);
  }
}

function readCredsIfPresent(filePath: string): OwnerFixtureCreds | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as OwnerFixtureCreds;
  } catch {
    return null;
  }
}

/** Clean seeded owner + provisional accounts from `e2e/.auth/*-creds.json`. */
export async function cleanupSeededE2eAccounts(): Promise<void> {
  if (process.env.E2E_SKIP_CLEANUP === "1") {
    console.warn("E2E_SKIP_CLEANUP=1 — skipping DB cleanup");
    return;
  }

  await cleanupOwnerCreds(readCredsIfPresent(ownerCredsPath()));
  await cleanupOwnerCreds(readCredsIfPresent(provisionalCredsPath()));
}
