import { useCallback, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ContentCard from "../components/common/ContentCard.jsx";
import DataTable from "../components/common/DataTable.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import PageHeaderCard from "../components/common/PageHeaderCard.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";
import { formatCurrency, formatDateTime } from "../services/formatters.js";

export default function TransactionsPage() {
  const [buyingRecords, setBuyingRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { activeBusiness, activeBusinessId } = useBusiness();

  const loadBuyingRecords = useCallback(async () => {
    if (!activeBusinessId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.getTransactions(activeBusinessId);
      setBuyingRecords(response.data || []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load buying records");
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    loadBuyingRecords();
  }, [loadBuyingRecords]);

  const columns = [
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className={row.type === "incoming" ? "badge-active" : "badge-inactive"}>{row.type}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "paymentMethod",
      label: "Payment",
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => formatCurrency(row.amount, activeBusiness?.currencySymbol),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Incoming & Outgoing Buying"
        subtitle="Track buying-related cash movement along with billing-linked entries"
        actionLabel="Add Buying"
        actionIcon={<PlusCircle size={15} />}
        onActionClick={() => navigate("/buying/add")}
      />

      <ContentCard>
        {error ? <EmptyState message={error} /> : null}

        {loading ? <EmptyState message="Loading buying records..." /> : null}
        {!loading ? (
          <DataTable
            columns={columns}
            rows={buyingRecords}
            title="Buying Ledger"
            searchPlaceholder="Search category or description"
          />
        ) : null}
      </ContentCard>
    </div>
  );
}
