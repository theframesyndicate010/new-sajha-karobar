import { Router } from "express";
import {
  createInvoice,
  getInvoiceById,
  getInvoices,
} from "../controllers/invoices.controller.js";

const router = Router();

router.get("/", getInvoices);
router.get("/:invoiceId", getInvoiceById);
router.post("/", createInvoice);

export default router;
