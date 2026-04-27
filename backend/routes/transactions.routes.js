import { Router } from "express";
import {
  createTransaction,
  getTransactions,
} from "../controllers/transactions.controller.js";

const router = Router();

router.get("/", getTransactions);
router.post("/", createTransaction);

export default router;
