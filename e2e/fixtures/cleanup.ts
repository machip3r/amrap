import { deleteAuthUserByEmail } from "../helpers/supabase";
import type { OwnerFixtureCreds } from "./owner";

/** Best-effort auth user deletion. Org/gym rows may remain orphaned. */
export async function cleanupOwnerCreds(
  creds: OwnerFixtureCreds | null | undefined,
): Promise<void> {
  if (!creds?.email) return;
  try {
    await deleteAuthUserByEmail(creds.email);
  } catch (error) {
    console.warn("E2E cleanup failed", creds.email, error);
  }
}
