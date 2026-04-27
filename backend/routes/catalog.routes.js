import { Router } from "express";
import {
  createCatalogItem,
  getCatalogItems,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/", getCatalogItems);
router.post("/", createCatalogItem);

export default router;
