import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";
import { formatCurrency, formatDateTime } from "../services/formatters.js";

export default function InvoiceDetailPage() {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { invoiceId } = useParams();
  const { activeBusiness } = useBusiness();

  useEffect(() => {
    if (!invoiceId) {
      return;
    }

    const loadInvoice = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.getInvoiceById(invoiceId);
        setInvoice(response.data);
      } catch (loadError) {
        setError(loadError.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId]);

  if (loading) {
    return <EmptyState message="Loading invoice..." />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!invoice) {
    return <EmptyState message="Invoice not found." />;
  }

  return (
    <div className="page-stack">
      <div className="flex items-center justify-between gap-2 print-hidden">
        <Link className="page-header-btn" to="/invoices">
          <ArrowLeft size={15} />
          Back to Invoices
        </Link>

        <button className="page-header-btn" onClick={() => window.print()} type="button">
          <Printer size={15} />
          Print Invoice
        </button>
      </div>

      <div className="invoice-paper">
        <div className="invoice-top">
          <div>
            <h3 className="invoice-title">{activeBusiness?.name || "Sajha Karobar"}</h3>
            <p className="invoice-meta">{activeBusiness?.type || "Business Management"}</p>
            <p className="invoice-meta">Invoice Number: {invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="invoice-meta">Generated: {formatDateTime(invoice.createdAt)}</p>
            <p className="invoice-meta">Payment: {invoice.paymentMethod}</p>
            <p className="invoice-meta">Status: {invoice.status}</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-base font-semibold m-0">Bill To</h4>
          <p className="invoice-meta mt-1">{invoice.customerName}</p>
        </div>

        <div className="table-wrap">
          <table className="premium-table" style={{ minWidth: 0 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((lineItem) => (
                <tr key={lineItem.id}>
                  <td>{lineItem.name}</td>
                  <td>{lineItem.quantity}</td>
                  <td>{formatCurrency(lineItem.rate, activeBusiness?.currencySymbol)}</td>
                  <td>{formatCurrency(lineItem.total, activeBusiness?.currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto" style={{ maxWidth: 360 }}>
          <div className="summary-line">
            <span className="label">Sub Total</span>
            <span className="value">{formatCurrency(invoice.subtotal, activeBusiness?.currencySymbol)}</span>
          </div>
          <div className="summary-line">
            <span className="label">Discount</span>
            <span className="value">{formatCurrency(invoice.discountAmount, activeBusiness?.currencySymbol)}</span>
          </div>
          <div className="summary-line">
            <span className="label">Tax</span>
            <span className="value">{formatCurrency(invoice.taxAmount, activeBusiness?.currencySymbol)}</span>
          </div>
          <div className="summary-line total">
            <span className="label">Grand Total</span>
            <span className="value">{formatCurrency(invoice.total, activeBusiness?.currencySymbol)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
