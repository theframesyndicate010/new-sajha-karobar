import { nanoid } from "nanoid";

import { mutateDb, readDb } from "../services/db.service.js";
import { buildInvoiceTotals, generateInvoiceNumber } from "../utils/finance.js";
import { ensureBusinessOrThrow } from "../utils/business.js";

export async function getInvoices(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.query.businessId);

    const invoices = (db.invoices || [])
      .filter((invoice) => invoice.businessId === business.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ data: invoices });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceById(req, res) {
  const db = await readDb();
  const invoice = (db.invoices || []).find((row) => row.id === req.params.invoiceId);

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  return res.json({ data: invoice });
}

export async function createInvoice(req, res, next) {
  try {
    const db = await readDb();
    const business = ensureBusinessOrThrow(db, req.body.businessId);

    if (!Array.isArray(req.body.lineItems) || req.body.lineItems.length === 0) {
      return res.status(400).json({ message: "lineItems are required" });
    }

    const now = new Date();
    const { lineItems, subtotal, discountAmount, taxAmount, total } = buildInvoiceTotals({
      lineItems: req.body.lineItems,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      taxRate: req.body.taxRate,
    });

    const todayInvoices = db.invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    });

    const invoiceNumber = generateInvoiceNumber(now, todayInvoices.length + 1);

    const createdInvoice = {
      id: `inv-${nanoid(8)}`,
      businessId: business.id,
      invoiceNumber,
      customerName: req.body.customerName || "Walk-in Customer",
      discountType: req.body.discountType || "flat",
      discountValue: Number(req.body.discountValue || 0),
      taxRate: Number(req.body.taxRate || 0),
      subtotal,
      discountAmount,
      taxAmount,
      total,
      lineItems,
      paymentMethod: req.body.paymentMethod || "Cash",
      status: "paid",
      createdAt: now.toISOString(),
      notes: req.body.notes || "",
    };

    await mutateDb((state) => {
      state.invoices.push(createdInvoice);

      state.sales.push({
        id: `sale-${nanoid(8)}`,
        businessId: business.id,
        invoiceId: createdInvoice.id,
        invoiceNumber: createdInvoice.invoiceNumber,
        itemsCount: createdInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0),
        netAmount: createdInvoice.total,
        paymentMethod: createdInvoice.paymentMethod,
        createdAt: createdInvoice.createdAt,
      });

      state.transactions.push({
        id: `txn-${nanoid(8)}`,
        businessId: business.id,
        type: "incoming",
        category: "sale",
        referenceId: createdInvoice.id,
        description: `Invoice ${createdInvoice.invoiceNumber}`,
        amount: createdInvoice.total,
        paymentMethod: createdInvoice.paymentMethod,
        createdAt: createdInvoice.createdAt,
      });

      for (const lineItem of createdInvoice.lineItems) {
        const matchedCatalogItem = (state.catalogItems || []).find(
          (item) => item.id === lineItem.itemId && item.businessType === business.type,
        );

        if (!matchedCatalogItem) {
          continue;
        }

        const soldUnits = Math.max(0, Math.floor(Number(lineItem.quantity || 0)));
        const currentUnits = Math.max(0, Math.floor(Number(matchedCatalogItem.quantity || 0)));
        matchedCatalogItem.quantity = Math.max(0, currentUnits - soldUnits);
      }

      return state;
    });

    res.status(201).json({ data: createdInvoice });
  } catch (error) {
    next(error);
  }
}
