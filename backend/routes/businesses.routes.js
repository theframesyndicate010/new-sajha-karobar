import { Router } from "express";
import {
  createBusiness,
  getBusinessById,
  getBusinesses,
} from "../controllers/businesses.controller.js";

const router = Router();

router.get("/", getBusinesses);
router.get("/:businessId", getBusinessById);
router.post("/", createBusiness);

export default router;
