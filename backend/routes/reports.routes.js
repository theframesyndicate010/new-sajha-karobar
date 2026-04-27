import { Router } from "express";
import {
  getRevenueReport,
  getSummaryReport,
} from "../controllers/reports.controller.js";

const router = Router();

router.get("/summary", getSummaryReport);
router.get("/revenue", getRevenueReport);

export default router;
