import { readDb } from "../services/db.service.js";
import { buildRevenueSeries, getBusinessSnapshot } from "../services/reporting.service.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

export async function getSummaryReport(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const summary = getBusinessSnapshot(db, business.id);

    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueReport(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const period = String(req.query.period || "monthly").toLowerCase();
    const normalizedPeriod = ["weekly", "monthly", "yearly"].includes(period)
      ? period
      : "monthly";

    const sales = (db.sales || []).filter((row) => row.businessId === business.id);
    const revenueSeries = buildRevenueSeries(sales, normalizedPeriod);

    res.json({
      data: {
        period: normalizedPeriod,
        revenueSeries,
      },
    });
  } catch (error) {
    next(error);
  }
}
