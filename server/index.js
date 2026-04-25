import app from "./app.js";
import { ensureDbFile } from "./services/db.service.js";

const PORT = Number(globalThis.process?.env.PORT || 5174);

async function bootstrap() {
  await ensureDbFile();

  app.listen(PORT, () => {
    console.log(`Sajha Karobar API listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  globalThis.process.exit(1);
});
