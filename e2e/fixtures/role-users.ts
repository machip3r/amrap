import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { SeededGymUser } from "../helpers/supabase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "../.auth");

export type RoleFixtureCreds = SeededGymUser & {
  gymId: string;
  role: "STAFF" | "TRAINER" | "MEMBER";
};

export function ensureAuthDir(): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export function staffStoragePath(): string {
  return path.join(AUTH_DIR, "staff.json");
}

export function trainerStoragePath(): string {
  return path.join(AUTH_DIR, "trainer.json");
}

export function memberStoragePath(): string {
  return path.join(AUTH_DIR, "member.json");
}

export function staffCredsPath(): string {
  return path.join(AUTH_DIR, "staff-creds.json");
}

export function trainerCredsPath(): string {
  return path.join(AUTH_DIR, "trainer-creds.json");
}

export function memberCredsPath(): string {
  return path.join(AUTH_DIR, "member-creds.json");
}

export function writeRoleCreds(filePath: string, creds: RoleFixtureCreds): void {
  ensureAuthDir();
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2));
}

export function readRoleCreds(filePath: string): RoleFixtureCreds {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as RoleFixtureCreds;
}
