import express from "express";
import cors from "cors";
import morgan from "morgan";

import businessesRouter from "./routes/businesses.routes.js";
import catalogRouter from "./routes/catalog.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import invoicesRouter from "./routes/invoices.routes.js";
import reportsRouter from "./routes/reports.routes.js";
import salesRouter from "./routes/sales.routes.js";
import transactionsRouter from "./routes/transactions.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Sajha Karobar API is running" });
});

app.use("/api/businesses", businessesRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/transactions", transactionsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((error, _req, res, next) => {
  void next;
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
