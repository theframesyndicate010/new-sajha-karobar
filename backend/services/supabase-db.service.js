import { createSupabaseAdminClient } from "./supabase.client.js";

const DEFAULT_STATE_KEY = String(process.env.SUPABASE_STATE_KEY || "primary").trim() || "primary";
const DEFAULT_STATE_TABLE =
  String(process.env.SUPABASE_STATE_TABLE || "app_state").trim() || "app_state";

const getEmptyDb = () => ({
  businesses: [],
  catalogItems: [],
  sales: [],
  invoices: [],
  transactions: [],
});

let writeQueue = Promise.resolve();

async function ensureStateRow(supabase) {
  const { data, error } = await supabase
    .from(DEFAULT_STATE_TABLE)
    .select("key")
    .eq("key", DEFAULT_STATE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase read failed (${DEFAULT_STATE_TABLE}): ${error.message}`);
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from(DEFAULT_STATE_TABLE)
      .insert({ key: DEFAULT_STATE_KEY, payload: getEmptyDb() });

    if (insertError) {
      throw new Error(
        `Supabase init failed (${DEFAULT_STATE_TABLE}). Ensure table exists with columns key(text primary key), payload(jsonb). ${insertError.message}`,
      );
    }
  }
}

export async function ensureSupabaseState() {
  const supabase = createSupabaseAdminClient();
  await ensureStateRow(supabase);
}

export async function readDbFromSupabase() {
  const supabase = createSupabaseAdminClient();
  await ensureStateRow(supabase);

  const { data, error } = await supabase
    .from(DEFAULT_STATE_TABLE)
    .select("payload")
    .eq("key", DEFAULT_STATE_KEY)
    .single();

  if (error) {
    throw new Error(`Supabase read failed (${DEFAULT_STATE_TABLE}): ${error.message}`);
  }

  const payload = data?.payload || {};

  return {
    ...getEmptyDb(),
    ...payload,
  };
}

export async function writeDbToSupabase(nextState) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from(DEFAULT_STATE_TABLE)
    .upsert({ key: DEFAULT_STATE_KEY, payload: nextState }, { onConflict: "key" });

  if (error) {
    throw new Error(`Supabase write failed (${DEFAULT_STATE_TABLE}): ${error.message}`);
  }
}

export async function mutateDbInSupabase(mutator) {
  writeQueue = writeQueue.then(async () => {
    const current = await readDbFromSupabase();
    const draft = structuredClone(current);
    const result = await mutator(draft);

    const nextState = result ?? draft;
    await writeDbToSupabase(nextState);

    return nextState;
  });

  return writeQueue;
}
