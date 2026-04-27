import { useCallback, useEffect, useState } from "react";
import { Eye, ReceiptText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import ContentCard from "../components/common/ContentCard.jsx";
import DataTable from "../components/common/DataTable.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import PageHeaderCard from "../components/common/PageHeaderCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";
import { formatCurrency, formatDateTime } from "../services/formatters.js";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { activeBusiness, activeBusinessId } = useBusiness();

  const loadInvoices = useCallback(async () => {
    if (!activeBusinessId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.getInvoices(activeBusinessId);
      setInvoices(response.data || []);
    } catch (loadError) {
      setError(loadError.message || "Invoices load bhayena");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice No",
    },
    {
      key: "customerName",
      label: "Customer",
    },
    {
      key: "total",
      label: "Total",
      render: (row) => formatCurrency(row.total, activeBusiness?.currencySymbol),
    },
    {
      key: "paymentMethod",
      label: "Payment",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2" title="Invoice detail kholnus">
          <Link className="icon-btn" to={`/invoices/${row.id}`}>
            <Eye size={14} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Invoice Management"
        subtitle="Generated invoices hernus ra print-ready detail kholnus"
        actionLabel="Billing ma janus"
        actionIcon={<ReceiptText size={15} />}
        onActionClick={() => navigate("/billing")}
      />

      <ContentCard>
        {loading ? <EmptyState title="Invoices load hudai cha" message="Latest invoice records liyera aundai..." /> : null}
        {!loading && error ? <EmptyState title="Invoices load bhayena" message={error} tone="error" /> : null}
        {!loading && !error ? (
          <DataTable
            columns={columns}
            rows={invoices}
            title="Generated Invoices"
            searchPlaceholder="Invoice no., customer, ya payment method search garnus"
          />
        ) : null}
      </ContentCard>
    </div>
  );
}
