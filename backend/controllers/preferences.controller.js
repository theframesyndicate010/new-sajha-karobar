import { createSupabaseAdminClient } from "../services/supabase.client.js";
import { getDbProvider } from "../services/db.service.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREFERENCES_FILE_PATH = path.resolve(__dirname, "../data/preferences.json");
const PREFERENCES_KEY = "user_preferences";
const APP_STATE_TABLE = "app_state";

/**
 * Get user preferences from storage (Supabase or JSON file)
 */
export async function getPreferences(_req, res) {
  try {
    const provider = getDbProvider();

    if (provider === "supabase") {
      // Read from Supabase app_state table
      const supabase = createSupabaseAdminClient();
      
      const { data, error } = await supabase
        .from(APP_STATE_TABLE)
        .select("payload")
        .eq("key", PREFERENCES_KEY)
        .maybeSingle();

      if (error) {
        console.error("Supabase read error:", error);
        return res.status(500).json({ message: "Failed to read preferences from Supabase" });
      }

      // Return empty object if no preferences stored yet
      const preferences = data?.payload || {};
      return res.json({ data: preferences });
    } else {
      // Read from JSON file
      try {
        const raw = await fs.readFile(PREFERENCES_FILE_PATH, "utf-8");
        const preferences = JSON.parse(raw || "{}");
        return res.json({ data: preferences });
      } catch (error) {
        // File doesn't exist yet, return empty object
        if (error.code === "ENOENT") {
          return res.json({ data: {} });
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Error reading preferences:", error);
    return res.status(500).json({ message: "Failed to read preferences" });
  }
}

/**
 * Update user preferences in storage (Supabase or JSON file)
 */
export async function updatePreferences(req, res) {
  try {
    const preferences = req.body || {};
    const provider = getDbProvider();

    if (provider === "supabase") {
      // Write to Supabase app_state table
      const supabase = createSupabaseAdminClient();
      
      const { error } = await supabase
        .from(APP_STATE_TABLE)
        .upsert(
          { key: PREFERENCES_KEY, payload: preferences },
          { onConflict: "key" }
        );

      if (error) {
        console.error("Supabase write error:", error);
        return res.status(500).json({ message: "Failed to write preferences to Supabase" });
      }

      return res.json({ data: preferences, message: "Preferences updated successfully" });
    } else {
      // Write to JSON file
      const serialized = JSON.stringify(preferences, null, 2);
      await fs.writeFile(PREFERENCES_FILE_PATH, serialized, "utf-8");
      
      return res.json({ data: preferences, message: "Preferences updated successfully" });
    }
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({ message: "Failed to update preferences" });
  }
}
