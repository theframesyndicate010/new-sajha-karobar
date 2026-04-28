import { Router } from "express";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/preferences.controller.js";

const router = Router();

router.get("/", getPreferences);
router.put("/", updatePreferences);

export default router;
