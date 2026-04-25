import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE_PATH = path.resolve(__dirname, "../data/db.json");

let writeQueue = Promise.resolve();

const getEmptyDb = () => ({
  businesses: [],
  catalogItems: [],
  sales: [],
  invoices: [],
  transactions: [],
});

export async function ensureDbFile() {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    const initialDb = JSON.stringify(getEmptyDb(), null, 2);
    await fs.writeFile(DATA_FILE_PATH, initialDb, "utf-8");
  }
}

export async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
  const parsed = JSON.parse(raw || "{}");

  return {
    ...getEmptyDb(),
    ...parsed,
  };
}

export async function writeDb(nextState) {
  const serialized = JSON.stringify(nextState, null, 2);
  await fs.writeFile(DATA_FILE_PATH, serialized, "utf-8");
}

export async function mutateDb(mutator) {
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
