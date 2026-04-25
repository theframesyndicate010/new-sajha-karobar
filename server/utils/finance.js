import { nanoid } from "nanoid";

const toMoney = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

export function buildInvoiceTotals({ lineItems = [], discountType = "flat", discountValue = 0, taxRate = 0 }) {
  const safeItems = lineItems
    .filter((item) => item && item.name)
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const rate = toMoney(item.rate || 0);
      const total = toMoney(quantity * rate);

      return {
        id: item.id || `ln-${nanoid(8)}`,
        itemId: item.itemId || null,
        name: item.name,
        quantity,
        rate,
        total,
      };
    });

  const subtotal = toMoney(safeItems.reduce((sum, item) => sum + item.total, 0));
  const normalizedDiscountValue = toMoney(discountValue);

  let discountAmount = normalizedDiscountValue;
  if (discountType === "percent") {
    discountAmount = toMoney((subtotal * normalizedDiscountValue) / 100);
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  const taxableAmount = toMoney(subtotal - discountAmount);
  const normalizedTaxRate = toMoney(taxRate);
  const taxAmount = toMoney((taxableAmount * normalizedTaxRate) / 100);
  const total = toMoney(taxableAmount + taxAmount);

  return {
    lineItems: safeItems,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
}

export function generateInvoiceNumber(date = new Date(), serial = 1) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const paddedSerial = String(serial).padStart(3, "0");

  return `INV-${year}${month}${day}-${paddedSerial}`;
}

export function toCurrency(value = 0, symbol = "Rs") {
  return `${symbol} ${toMoney(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
