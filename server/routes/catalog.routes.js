import { Router } from "express";
import { nanoid } from "nanoid";

import { mutateDb, readDb } from "../services/db.service.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const search = String(req.query.search || "").trim().toLowerCase();
    const category = String(req.query.category || "all").toLowerCase();

    let items = (db.catalogItems || []).filter(
      (item) => item.businessType === "all" || item.businessType === business.type,
    );

    if (category !== "all") {
      items = items.filter((item) => item.category.toLowerCase() === category);
    }

    if (search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.sku.toLowerCase().includes(search),
      );
    }

    items = items.map((item) => ({
      ...item,
      quantity: Math.max(0, Math.floor(Number(item.quantity || 0))),
    }));

    const categories = [
      "all",
      ...new Set(items.map((item) => item.category.toLowerCase())),
    ];

    res.json({
      data: items,
      meta: {
        categories,
        businessType: business.type,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.body.businessId);

    const name = String(req.body.name || "").trim();
    const category = String(req.body.category || "").trim();
    const price = Number(req.body.price || 0);
    const quantityInput = Number(req.body.quantity ?? 0);
    const quantity = Math.floor(quantityInput);
    const skuInput = String(req.body.sku || "").trim().toUpperCase();

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: "price must be greater than 0" });
    }

    if (!Number.isFinite(quantityInput) || quantity < 0) {
      return res.status(400).json({ message: "quantity must be 0 or greater" });
    }

    let savedItem = null;

    await mutateDb((state) => {
      const normalizedName = name.toLowerCase();
      const normalizedCategory = category.toLowerCase();

      const existingItem = (state.catalogItems || []).find(
        (item) =>
          item.businessType === business.type &&
          item.name.toLowerCase() === normalizedName &&
          item.category.toLowerCase() === normalizedCategory,
      );

      if (existingItem) {
        existingItem.price = Number(price.toFixed(2));
        existingItem.quantity = Math.max(0, Math.floor(Number(existingItem.quantity || 0)) + quantity);
        if (skuInput) {
          existingItem.sku = skuInput;
        }

        savedItem = existingItem;
        return state;
      }

      const skuPrefix = String(business.type || "GEN").slice(0, 3).toUpperCase() || "GEN";
      const generatedSku = `${skuPrefix}-${nanoid(6).replace(/[^A-Z0-9]/gi, "X").toUpperCase()}`;

      const createdItem = {
        id: `item-${nanoid(8)}`,
        businessType: business.type,
        name,
        category,
        price: Number(price.toFixed(2)),
        quantity,
        sku: skuInput || generatedSku,
      };

      state.catalogItems.push(createdItem);
      savedItem = createdItem;

      return state;
    });

    return res.status(201).json({ data: savedItem });
  } catch (error) {
    next(error);
  }
});

export default router;
