const isSameDate = (dateA, dateB) => {
  const a = new Date(dateA);
  const b = new Date(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const sumBy = (list, selector) =>
  list.reduce((sum, item) => {
    const value = Number(selector(item) || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

const makeLabelByPeriod = (dateString, period) => {
  const date = new Date(dateString);

  if (period === "weekly") {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (period === "monthly") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export function getBusinessSnapshot(db, businessId) {
  const sales = db.sales.filter((row) => row.businessId === businessId);
  const invoices = db.invoices.filter((row) => row.businessId === businessId);
  const transactions = db.transactions.filter((row) => row.businessId === businessId);

  const today = new Date();

  const todaySales = sales.filter((row) => isSameDate(row.createdAt, today));
  const todayIncoming = transactions.filter(
    (row) => row.type === "incoming" && isSameDate(row.createdAt, today),
  );
  const todayOutgoing = transactions.filter(
    (row) => row.type === "outgoing" && isSameDate(row.createdAt, today),
  );

  const paymentMethods = ["Cash", "Card", "E-Payment", "Credit", "PhonePe"];
  const paymentBreakdown = paymentMethods.map((method) => ({
    method,
    amount: Number(
      sumBy(todaySales.filter((sale) => sale.paymentMethod === method), (sale) => sale.netAmount).toFixed(2),
    ),
  }));

  const totalRevenue = Number(sumBy(sales, (sale) => sale.netAmount).toFixed(2));
  const totalIncoming = Number(sumBy(transactions.filter((txn) => txn.type === "incoming"), (txn) => txn.amount).toFixed(2));
  const totalOutgoing = Number(sumBy(transactions.filter((txn) => txn.type === "outgoing"), (txn) => txn.amount).toFixed(2));

  return {
    totalRevenue,
    totalIncoming,
    totalOutgoing,
    netCashflow: Number((totalIncoming - totalOutgoing).toFixed(2)),
    totalInvoices: invoices.length,
    totalSalesCount: sales.length,
    todaySalesAmount: Number(sumBy(todaySales, (sale) => sale.netAmount).toFixed(2)),
    todayIncoming: Number(sumBy(todayIncoming, (txn) => txn.amount).toFixed(2)),
    todayOutgoing: Number(sumBy(todayOutgoing, (txn) => txn.amount).toFixed(2)),
    avgInvoiceValue: invoices.length
      ? Number((sumBy(invoices, (invoice) => invoice.total) / invoices.length).toFixed(2))
      : 0,
    paymentBreakdown,
  };
}

export function buildRevenueSeries(sales, period = "monthly") {
  const grouped = sales.reduce((acc, sale) => {
    const label = makeLabelByPeriod(sale.createdAt, period);
    const amount = Number(sale.netAmount || 0);

    acc[label] = (acc[label] || 0) + amount;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, amount]) => ({
      label,
      revenue: Number(amount.toFixed(2)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildCountSeries(sales, period = "monthly") {
  const grouped = sales.reduce((acc, sale) => {
    const label = makeLabelByPeriod(sale.createdAt, period);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, count]) => ({
      label,
      count: Number(count || 0),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
