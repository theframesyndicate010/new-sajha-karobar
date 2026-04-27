import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import app from "./app.js";
import { connectDb } from "./config/db-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const PORT = Number(globalThis.process?.env.PORT || 5174);

async function bootstrap() {
  const db = await connectDb();

  console.log(`Database connected via ${db.provider} provider`);

  const server = app.listen(PORT, () => {
    console.log(`Sajha Karobar API listening on http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    console.error("API server error", error);
  });

  server.on("close", () => {
    console.warn("API server closed");
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  globalThis.process.exit(1);
});
