import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Load application modules after environment is configured so imports
// that read process.env get the values from `.env`.
const { default: app } = await import("./app.js");
const { connectDb } = await import("./config/db-config.js");

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
