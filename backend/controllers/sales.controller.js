import { nanoid } from "nanoid";

import { mutateDb, readDb } from "../services/db.service.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

export async function getSales(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const sales = (db.sales || [])
      .filter((row) => row.businessId === business.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ data: sales });
  } catch (error) {
    next(error);
  }
}

export async function createSale(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.body.businessId);

    const sale = {
      id: `sale-${nanoid(8)}`,
      businessId: business.id,
      invoiceId: req.body.invoiceId || null,
      invoiceNumber: req.body.invoiceNumber || null,
      itemsCount: Number(req.body.itemsCount || 0),
      netAmount: Number(req.body.netAmount || 0),
      paymentMethod: req.body.paymentMethod || "Cash",
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    await mutateDb((state) => {
      state.sales.push(sale);

      state.transactions.push({
        id: `txn-${nanoid(8)}`,
        businessId: business.id,
        type: "incoming",
        category: "sale",
        referenceId: sale.invoiceId,
        description: sale.invoiceNumber
          ? `Invoice ${sale.invoiceNumber}`
          : "Sales entry",
        amount: sale.netAmount,
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
      });

      return state;
    });

    res.status(201).json({ data: sale });
  } catch (error) {
    next(error);
  }
}
