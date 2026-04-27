import { ensureDbFile, getDbProvider } from "../services/db.service.js";

const DEFAULT_DB_CONNECT_RETRIES = Number.parseInt(process.env.DB_CONNECT_RETRIES || "2", 10);
const DEFAULT_DB_CONNECT_RETRY_DELAY_MS = Number.parseInt(
	process.env.DB_CONNECT_RETRY_DELAY_MS || "300",
	10,
);

const sleep = (ms) => new Promise((resolve) => {
	setTimeout(resolve, ms);
});

export async function connectDb(options = {}) {
	const provider = getDbProvider();
	const retries = Number.isInteger(options.retries)
		? Math.max(0, options.retries)
		: Math.max(0, Number.isFinite(DEFAULT_DB_CONNECT_RETRIES) ? DEFAULT_DB_CONNECT_RETRIES : 2);
	const retryDelayMs = Number.isInteger(options.retryDelayMs)
		? Math.max(0, options.retryDelayMs)
		: Math.max(
			0,
			Number.isFinite(DEFAULT_DB_CONNECT_RETRY_DELAY_MS)
				? DEFAULT_DB_CONNECT_RETRY_DELAY_MS
				: 300,
		);

	let lastError;

	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			await ensureDbFile();

			return {
				provider,
				status: "connected",
				attempts: attempt + 1,
			};
		} catch (error) {
			lastError = error;
			const currentAttempt = attempt + 1;
			const remainingRetries = retries - attempt;

			console.warn(
				`DB connection attempt ${currentAttempt}/${retries + 1} failed for provider '${provider}': ${error?.message || "Unknown error"}`,
			);

			if (attempt < retries && retryDelayMs > 0) {
				console.warn(
					`Retrying DB connection in ${retryDelayMs * currentAttempt}ms (${remainingRetries} retry attempt(s) remaining).`,
				);
				await sleep(retryDelayMs * (attempt + 1));
			}
		}
	}

	const message = `Database connection failed for provider '${provider}' after ${retries + 1} attempt(s): ${lastError?.message || "Unknown error"}`;
	throw new Error(message, { cause: lastError });
}

export default connectDb;
