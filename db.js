// Petit stockage JSON sur fichier — zéro dépendance, zéro binaire natif.
// Suffisant pour un prototype. En production : remplacer par PostgreSQL + Prisma
// (le schéma cible est documenté dans prisma/schema.prisma).

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const FILE = join(__dirname, "..", "data.json");

export const COLLECTIONS = ["clients", "devis", "factures", "missions", "expenses", "services", "opportunities", "timeEntries", "subscriptions", "contracts", "allocations", "automations", "users", "justificatifs", "bankTransactions", "journalEntries", "assets"];

export function emptyDb() {
  const o = {};
  COLLECTIONS.forEach((c) => (o[c] = []));
  return o;
}

export function read() {
  if (!existsSync(FILE)) return emptyDb();
  try {
    return { ...emptyDb(), ...JSON.parse(readFileSync(FILE, "utf8")) };
  } catch (e) {
    return emptyDb();
  }
}

export function write(db) {
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
