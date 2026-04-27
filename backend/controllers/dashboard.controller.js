import { readDb } from "../services/db.service.js";
import {
  buildCountSeries,
  buildRevenueSeries,
  getBusinessSnapshot,
} from "../services/reporting.service.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

export async function getDashboard(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const sales = db.sales.filter((row) => row.businessId === business.id);
    const invoices = db.invoices.filter((row) => row.businessId === business.id);
    const transactions = db.transactions.filter((row) => row.businessId === business.id);

    const snapshot = getBusinessSnapshot(db, business.id);
    const recentInvoices = invoices
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      data: {
        snapshot,
        business,
        recentInvoices,
        ordersSeries: buildCountSeries(sales, "weekly"),
        revenueSeries: buildRevenueSeries(sales, "monthly"),
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
