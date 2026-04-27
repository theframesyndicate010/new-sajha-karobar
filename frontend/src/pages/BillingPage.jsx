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
  const [customerName, setCustomerName] = useState("Walk-in Grahak");
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
        setError("");
        const response = await apiClient.getCatalog(activeBusinessId, {
          category: selectedCategory,
          search: searchTerm,
        });

        setCatalogItems(response.data || []);
        setCategories(response.meta?.categories || ["all"]);
      } catch (loadError) {
        setError(loadError.message || "Catalog load bhayena");
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
  const totalItemsInCart = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart],
  );
  const canCheckout = Boolean(cart.length) && !submitting;

  const addItem = (item) => {
    setError("");
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
    setError("");
    setCart((previous) =>
      previous.map((item) =>
        item.itemId === itemId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQty = (itemId) => {
    setError("");
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
    setError("");
    setCart((previous) => previous.filter((item) => item.itemId !== itemId));
  };

  const clearOrder = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName("Walk-in Grahak");
  };

  const handleCheckout = async () => {
    if (!cart.length || !activeBusinessId) {
      setError("Checkout agadi kamtima 1 item add garnus.");
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
      setError(checkoutError.message || "Checkout fail bhayo, feri try garnus.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Billing System"
        subtitle="Invoice banauna sajilo flow with clear order summary"
        actionLabel="Dashboard ma farkinu"
        actionIcon={<ArrowLeft size={15} />}
        onActionClick={() => navigate("/")}
      />

      {error ? <EmptyState title="Sano action cha" message={error} tone="error" /> : null}

      <ContentCard>
        <div className="billing-container">
          <div className="menu-panel">
            <div className="menu-header">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-800 m-0">Items choose garnus</h3>
                <span className="invoice-meta">{activeBusiness?.type || "general"}</span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <input
                  className="filter-input"
                  placeholder="Item name ya SKU search garnus"
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
                <EmptyState message="Yo category ma item bhetiyena." />
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
                <h3 className="text-lg font-bold text-slate-800 m-0">Order Summary (hisab)</h3>
                <button className="page-header-btn" onClick={handleCheckout} type="button" disabled={!canCheckout}>
                  <BellRing size={15} />
                  <span>{submitting ? "Processing..." : "Order Place garnus"}</span>
                </button>
              </div>
              <p className="invoice-meta" style={{ margin: "6px 0 0" }}>
                {cart.length} line item{cart.length === 1 ? "" : "s"} ({totalItemsInCart} unit{totalItemsInCart === 1 ? "" : "s"})
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="filter-input"
                  placeholder="Customer ko naam"
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
              <div className="billing-cart-mobile" role="list" aria-label="Order summary items">
                {!cart.length ? (
                  <p className="billing-cart-empty">Order empty cha. Left side bata item add garnus.</p>
                ) : (
                  cart.map((item) => (
                    <article className="billing-cart-item" key={item.itemId} role="listitem">
                      <div className="billing-cart-item-top">
                        <p className="billing-cart-item-name">{item.name}</p>
                        <p className="billing-cart-item-amount">
                          {formatCurrency(item.rate * item.quantity, activeBusiness?.currencySymbol)}
                        </p>
                      </div>

                      <p className="billing-cart-item-meta">
                        Rate: {formatCurrency(item.rate, activeBusiness?.currencySymbol)}
                      </p>

                      <div className="billing-cart-item-actions">
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => decreaseQty(item.itemId)} type="button">
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => increaseQty(item.itemId)} type="button">
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          aria-label={`Remove ${item.name}`}
                          className="qty-btn billing-cart-remove"
                          onClick={() => removeItem(item.itemId)}
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="billing-cart-table-wrap">
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
                        <td colSpan={5}>Order empty cha. Left side bata item add garnus.</td>
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
                <button className="btn-checkout" onClick={handleCheckout} type="button" disabled={!canCheckout}>
                  Checkout garnus
                </button>
                <button className="btn-light" onClick={() => window.print()} type="button">
                  <ReceiptText size={16} />
                </button>
                <button className="btn-danger-light" onClick={clearOrder} type="button">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
