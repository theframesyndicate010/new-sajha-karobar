import { Router } from "express";
import { nanoid } from "nanoid";

import { mutateDb, readDb } from "../services/db.service.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const type = req.query.type;

    let transactions = (db.transactions || []).filter((row) => row.businessId === business.id);
    if (type) {
      transactions = transactions.filter((row) => row.type === type);
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ data: transactions });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.body.businessId);

    const amount = Number(req.body.amount || 0);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "amount must be greater than 0" });
    }

    const type = req.body.type === "outgoing" ? "outgoing" : "incoming";

    const transaction = {
      id: `txn-${nanoid(8)}`,
      businessId: business.id,
      type,
      category: req.body.category || "general",
      referenceId: req.body.referenceId || null,
      description: req.body.description || "Manual transaction",
      amount,
      paymentMethod: req.body.paymentMethod || "Cash",
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    await mutateDb((state) => {
      state.transactions.push(transaction);
      return state;
    });

    res.status(201).json({ data: transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
