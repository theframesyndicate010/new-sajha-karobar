import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isSupabaseConfigured } from "./supabase.client.js";
import {
  ensureSupabaseState,
  mutateDbInSupabase,
  readDbFromSupabase,
  writeDbToSupabase,
} from "./supabase-db.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE_PATH = path.resolve(__dirname, "../data/db.json");

const DB_PROVIDER = String(process.env.DB_PROVIDER || "json").trim().toLowerCase();
const SUPABASE_ENABLED = DB_PROVIDER === "supabase";

let writeQueue = Promise.resolve();

const getEmptyDb = () => ({
  businesses: [],
  catalogItems: [],
  sales: [],
  invoices: [],
  transactions: [],
});

export async function ensureDbFile() {
  if (SUPABASE_ENABLED) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "DB_PROVIDER is set to supabase but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
      );
    }

    await ensureSupabaseState();
    return;
  }

  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    const initialDb = JSON.stringify(getEmptyDb(), null, 2);
    await fs.writeFile(DATA_FILE_PATH, initialDb, "utf-8");
  }
}

export async function readDb() {
  if (SUPABASE_ENABLED) {
    return readDbFromSupabase();
  }

  await ensureDbFile();
  const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const parsed = JSON.parse(raw || "{}");

  return {
    ...getEmptyDb(),
    ...parsed,
  };
}

export async function writeDb(nextState) {
  if (SUPABASE_ENABLED) {
    await writeDbToSupabase(nextState);
    return;
  }

  const serialized = JSON.stringify(nextState, null, 2);
  await fs.writeFile(DATA_FILE_PATH, serialized, "utf-8");
}

export async function mutateDb(mutator) {
  if (SUPABASE_ENABLED) {
    return mutateDbInSupabase(mutator);
  }

  writeQueue = writeQueue.then(async () => {
    const current = await readDb();
    const draft = structuredClone(current);
    const result = await mutator(draft);

    const nextState = result ?? draft;
    await writeDb(nextState);

    return nextState;
  });

  return writeQueue;
}

export function getDbProvider() {
  if (SUPABASE_ENABLED) {
    return "supabase";
  }

  return "json";
}
