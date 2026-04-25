import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BellRing, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ContentCard from "../components/common/ContentCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import PageHeaderCard from "../components/common/PageHeaderCard.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";
import { formatCurrency } from "../services/formatters.js";

const paymentMethods = ["Cash", "Card", "E-Payment", "Credit"];

export default function BillingPage() {
  const [catalogItems, setCatalogItems] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [discountType, setDiscountType] = useState("flat");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { activeBusiness, activeBusinessId } = useBusiness();

  useEffect(() => {
    if (!activeBusinessId) {
      return;
    }

    const loadCatalog = async () => {
      try {
        const response = await apiClient.getCatalog(activeBusinessId, {
          category: selectedCategory,
          search: searchTerm,
        });

        setCatalogItems(response.data || []);
        setCategories(response.meta?.categories || ["all"]);
      } catch (loadError) {
        setError(loadError.message || "Failed to load catalog");
      }
    };

    loadCatalog();
  }, [activeBusinessId, selectedCategory, searchTerm]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.rate * item.quantity, 0),
    [cart],
  );

  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      return Math.min(subtotal, (subtotal * Number(discountValue || 0)) / 100);
    }

    return Math.min(subtotal, Number(discountValue || 0));
  }, [discountType, discountValue, subtotal]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [discountAmount, subtotal]);

  const addItem = (item) => {
    setCart((previous) => {
      const existing = previous.find((entry) => entry.itemId === item.id);
      if (existing) {
        return previous.map((entry) =>
          entry.itemId === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }

      return [
        ...previous,
        {
          itemId: item.id,
          name: item.name,
          rate: Number(item.price || 0),
          quantity: 1,
        },
      ];
    });
  };

  const increaseQty = (itemId) => {
    setCart((previous) =>
      previous.map((item) =>
        item.itemId === itemId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQty = (itemId) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (itemId) => {
    setCart((previous) => previous.filter((item) => item.itemId !== itemId));
  };

  const clearOrder = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName("Walk-in Customer");
  };

  const handleCheckout = async () => {
    if (!cart.length || !activeBusinessId) {
      setError("Add at least one item before checkout.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiClient.createInvoice({
        businessId: activeBusinessId,
        customerName,
        paymentMethod,
        discountType,
        discountValue: Number(discountValue || 0),
        taxRate: 0,
        lineItems: cart,
      });

      clearOrder();
      navigate(`/invoices/${response.data.id}`);
    } catch (checkoutError) {
      setError(checkoutError.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Billing System"
        subtitle="Fast multi-business billing with invoice generation and printable bill"
        actionLabel="Back to Dashboard"
        actionIcon={<ArrowLeft size={15} />}
        onActionClick={() => navigate("/")}
      />

      {error ? <EmptyState message={error} /> : null}

      <ContentCard>
        <div className="billing-container">
          <div className="menu-panel">
            <div className="menu-header">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-800 m-0">Select Item</h3>
                <span className="invoice-meta">{activeBusiness?.type || "general"}</span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <input
                  className="filter-input"
                  placeholder="Search by item name or SKU"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="menu-items-scroll">
              {!catalogItems.length ? (
                <EmptyState message="No items found in this category." />
              ) : (
                <div className="menu-grid">
                  {catalogItems.map((item) => (
                    <button
                      className="menu-item-card"
                      key={item.id}
                      onClick={() => addItem(item)}
                      type="button"
                    >
                      <p className="menu-item-title">{item.name}</p>
                      <p className="invoice-meta">{item.sku}</p>
                      <p className="invoice-meta">Stock: {Math.max(0, Math.floor(Number(item.quantity || 0)))}</p>
                      <p className="menu-item-price">
                        {formatCurrency(item.price, activeBusiness?.currencySymbol)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="order-panel">
            <div className="order-header">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-800 m-0">Order Summary</h3>
                <button className="page-header-btn" onClick={handleCheckout} type="button" disabled={submitting}>
                  <BellRing size={15} />
                  <span>{submitting ? "Processing..." : "Place Order"}</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="filter-input"
                  placeholder="Customer name"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />

                <select
                  className="filter-select"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="order-list-scroll">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Rate</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!cart.length ? (
                    <tr>
                      <td colSpan={5}>No items selected yet.</td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.itemId}>
                        <td>{item.name}</td>
                        <td>{formatCurrency(item.rate, activeBusiness?.currencySymbol)}</td>
                        <td>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => decreaseQty(item.itemId)} type="button">
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button className="qty-btn" onClick={() => increaseQty(item.itemId)} type="button">
                              <Plus size={13} />
                            </button>
                          </div>
                        </td>
                        <td>{formatCurrency(item.rate * item.quantity, activeBusiness?.currencySymbol)}</td>
                        <td>
                          <button className="qty-btn" onClick={() => removeItem(item.itemId)} type="button">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="order-footer billing-sticky-footer">
              <div className="summary-line">
                <span className="label">Sub Total</span>
                <span className="value">{formatCurrency(subtotal, activeBusiness?.currencySymbol)}</span>
              </div>

              <div className="summary-line">
                <span className="label">Discount</span>
                <div className="discount-controls">
                  <select
                    className="filter-select discount-mode"
                    value={discountType}
                    onChange={(event) => setDiscountType(event.target.value)}
                  >
                    <option value="flat">Flat</option>
                    <option value="percent">Percent</option>
                  </select>
                  <input
                    className="discount-value-field"
                    min={0}
                    type="number"
                    value={discountValue}
                    onChange={(event) => setDiscountValue(Number(event.target.value || 0))}
                  />
                </div>
              </div>

              <div className="summary-line">
                <span className="label">Discount Amount</span>
                <span className="value text-red-600">
                  {formatCurrency(discountAmount, activeBusiness?.currencySymbol)}
                </span>
              </div>

              <div className="summary-line total">
                <span className="label">Grand Total</span>
                <span className="value">{formatCurrency(total, activeBusiness?.currencySymbol)}</span>
              </div>

              <div className="checkout-row print-hidden">
                <button className="btn-checkout" onClick={handleCheckout} type="button" disabled={submitting}>
                  Checkout
                </button>
                <button className="btn-light" onClick={() => window.print()} type="button">
                  <ReceiptText size={16} />
                </button>
                <button className="btn-danger-light" onClick={clearOrder} type="button">
                  Void
                </button>
              </div>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
