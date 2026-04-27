import { nanoid } from "nanoid";

import { mutateDb, readDb } from "../services/db.service.js";

export async function getBusinesses(_req, res) {
  const db = await readDb();
  const businesses = (db.businesses || []).sort((a, b) => a.name.localeCompare(b.name));

  res.json({ data: businesses });
}

export async function getBusinessById(req, res) {
  const db = await readDb();
  const business = (db.businesses || []).find((row) => row.id === req.params.businessId);

  if (!business) {
    return res.status(404).json({ message: "Business not found" });
  }

  return res.json({ data: business });
}

export async function createBusiness(req, res) {
  const { name, type, currencyCode = "NPR", currencySymbol = "Rs" } = req.body || {};

  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }

  const createdBusiness = {
    id: `biz-${nanoid(8)}`,
    name: String(name).trim(),
    type: String(type).trim().toLowerCase(),
    currencyCode: String(currencyCode).trim().toUpperCase(),
    currencySymbol: String(currencySymbol).trim(),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await mutateDb((db) => {
    db.businesses.push(createdBusiness);
    return db;
  });

  return res.status(201).json({ data: createdBusiness });
}
