import fs from "fs";
import path from "path";
import {
  bootstrapOrganizationAccount,
  createConfirmedAuthUser,
  E2E_PASSWORD,
  uniqueEmail,
} from "../helpers/supabase";

export type OwnerFixtureCreds = {
  email: string;
  password: string;
  userId: string;
  organizationName: string;
  fullName: string;
  gymName: string;
  planName: string;
  provisional: boolean;
};

const AUTH_DIR = path.join(__dirname, "../.auth");

export function ownerStoragePath(): string {
  return path.join(AUTH_DIR, "owner.json");
}

export function provisionalStoragePath(): string {
  return path.join(AUTH_DIR, "provisional.json");
}

export function ownerCredsPath(): string {
  return path.join(AUTH_DIR, "owner-creds.json");
}

export function provisionalCredsPath(): string {
  return path.join(AUTH_DIR, "provisional-creds.json");
}

export function ensureAuthDir(): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export async function seedOwnerAccount(
  provisional: boolean,
): Promise<OwnerFixtureCreds> {
  const stamp = Date.now();
  const email = uniqueEmail(provisional ? "e2e.provisional" : "e2e.owner");
  const organizationName = provisional
    ? `E2E Provisional Org ${stamp}`
    : `E2E Owner Org ${stamp}`;
  const gymName = provisional
    ? `E2E Provisional Gym ${stamp}`
    : `E2E Owner Gym ${stamp}`;
  const fullName = provisional ? "Ana Provisional" : "Carlos Owner";
  const planName = "Mensual E2E";

  const user = await createConfirmedAuthUser(email, E2E_PASSWORD);
  await bootstrapOrganizationAccount(user.id, organizationName);

  return {
    email,
    password: E2E_PASSWORD,
    userId: user.id,
    organizationName,
    fullName,
    gymName,
    planName,
    provisional,
  };
}

export function writeCreds(
  filePath: string,
  creds: OwnerFixtureCreds,
): void {
  ensureAuthDir();
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2));
}

export function readCreds(filePath: string): OwnerFixtureCreds {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as OwnerFixtureCreds;
}
