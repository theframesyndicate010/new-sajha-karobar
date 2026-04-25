import { useState } from "react";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ContentCard from "../components/common/ContentCard.jsx";
import PageHeaderCard from "../components/common/PageHeaderCard.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { activeBusinessId } = useBusiness();

  const [form, setForm] = useState({
    type: "outgoing",
    itemName: "",
    category: "",
    description: "",
    sku: "",
    quantity: "1",
    addToBilling: true,
    paymentMethod: "Cash",
    amount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field) => (event) => {
    const nextValue = field === "addToBilling" ? event.target.checked : event.target.value;

    setForm((previous) => ({
      ...previous,
      [field]: nextValue,
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!activeBusinessId) {
      setError("Please select a business first.");
      return;
    }

    const numericAmount = Number(form.amount || 0);
    if (!numericAmount || numericAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    const quantityInput = Number(form.quantity || 0);
    const quantity = Math.floor(quantityInput);
    if (!Number.isFinite(quantityInput) || quantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }

    const normalizedCategory = String(form.category || "").trim();
    if (!normalizedCategory) {
      setError("Category is required.");
      return;
    }

    const normalizedItemName = String(form.itemName || "").trim();
    if (form.addToBilling && !normalizedItemName) {
      setError("Item name is required if you want this in Billing filter/items.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const buyingDescription = form.description || normalizedItemName || "Manual buying entry";
      const transactionAmount = Number((numericAmount * quantity).toFixed(2));

      await apiClient.createTransaction({
        businessId: activeBusinessId,
        type: form.type,
        category: normalizedCategory,
        description: `${buyingDescription} (Qty: ${quantity})`,
        paymentMethod: form.paymentMethod,
        amount: transactionAmount,
      });

      if (form.addToBilling) {
        await apiClient.createCatalogItem({
          businessId: activeBusinessId,
          name: normalizedItemName,
          category: normalizedCategory,
          sku: form.sku,
          price: numericAmount,
          quantity,
        });
      }

      navigate("/buying");
    } catch (submitError) {
      setError(submitError.message || "Failed to create buying entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Add Buying"
        subtitle="Create buying entry and optionally push item/category/stock to Billing"
        actionLabel="Back to Buying"
        actionIcon={<ArrowLeft size={15} />}
        onActionClick={() => navigate("/buying")}
      />

      <ContentCard>
        {error ? <div className="state-card state-error">{error}</div> : null}

        <form className="transaction-form-grid" onSubmit={submitForm}>
          <div className="form-field">
            <label className="form-field-label" htmlFor="buyingItemName">
              Item Name
            </label>
            <input
              id="buyingItemName"
              className="filter-input"
              type="text"
              placeholder="Shoe, guitar string, hammer"
              value={form.itemName}
              onChange={updateField("itemName")}
            />
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="txnType">
              Buying Type
            </label>
            <select
              id="txnType"
              className="filter-select"
              value={form.type}
              onChange={updateField("type")}
            >
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="txnCategory">
              Category
            </label>
            <input
              id="txnCategory"
              className="filter-input"
              type="text"
              placeholder="footwear, guitar, hardware"
              value={form.category}
              onChange={updateField("category")}
            />
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="buyingSku">
              SKU (Optional)
            </label>
            <input
              id="buyingSku"
              className="filter-input"
              type="text"
              placeholder="SHOE-001"
              value={form.sku}
              onChange={updateField("sku")}
            />
          </div>

          <div className="form-field full-row">
            <label className="form-field-label" htmlFor="txnDescription">
              Description
            </label>
            <textarea
              id="txnDescription"
              className="filter-input transaction-textarea"
              placeholder="Buying note"
              value={form.description}
              onChange={updateField("description")}
            />
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="txnPayment">
              Payment Method
            </label>
            <select
              id="txnPayment"
              className="filter-select"
              value={form.paymentMethod}
              onChange={updateField("paymentMethod")}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="E-Payment">E-Payment</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="txnAmount">
              Unit Price
            </label>
            <input
              id="txnAmount"
              className="filter-input"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={updateField("amount")}
            />
          </div>

          <div className="form-field">
            <label className="form-field-label" htmlFor="buyingQuantity">
              Quantity
            </label>
            <input
              id="buyingQuantity"
              className="filter-input"
              type="number"
              min={1}
              step={1}
              placeholder="1"
              value={form.quantity}
              onChange={updateField("quantity")}
            />
          </div>

          <div className="form-field full-row">
            <label className="form-field-label" htmlFor="addToBillingCheckbox">
              Add this item/category to Billing filter and item list
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#334155" }}>
              <input
                id="addToBillingCheckbox"
                checked={form.addToBilling}
                onChange={updateField("addToBilling")}
                type="checkbox"
              />
              Sync to Billing Catalog
            </label>
          </div>

          <div className="transaction-submit-row full-row">
            <button
              className="btn-light"
              onClick={() => navigate("/buying")}
              type="button"
              disabled={submitting}
            >
              Cancel
            </button>
            <button className="page-header-btn" type="submit" disabled={submitting}>
              <PlusCircle size={15} />
              {submitting ? "Saving..." : "Create Buying"}
            </button>
          </div>
        </form>
      </ContentCard>
    </div>
  );
}
