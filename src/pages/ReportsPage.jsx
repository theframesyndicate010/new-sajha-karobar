import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { ArrowDownCircle, ArrowUpCircle, Calendar, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Bar } from "react-chartjs-2";

import ContentCard from "../components/common/ContentCard.jsx";
import DataTable from "../components/common/DataTable.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import PageHeaderCard from "../components/common/PageHeaderCard.jsx";
import { useBusiness } from "../context/useBusiness.js";
import { apiClient } from "../services/apiClient.js";
import { formatCurrency } from "../services/formatters.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

const periodOptions = ["weekly", "monthly", "yearly"];
const periodLabelMap = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function getTrendSummary(rows, currencySymbol) {
  if (rows.length < 2) {
    return {
      tone: "neutral",
      text: "Add more revenue records to unlock a growth trend summary.",
    };
  }

  const firstValue = Number(rows[0]?.revenue || 0);
  const lastValue = Number(rows[rows.length - 1]?.revenue || 0);
  const difference = lastValue - firstValue;

  if (!difference) {
    return {
      tone: "neutral",
      text: "Revenue stayed steady between your first and latest period.",
    };
  }

  const amountText = formatCurrency(Math.abs(difference), currencySymbol);

  if (difference > 0) {
    return {
      tone: "up",
      text: `Revenue increased by ${amountText} from first to latest period.`,
    };
  }

  return {
    tone: "down",
    text: `Revenue dropped by ${amountText} from first to latest period.`,
  };
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [revenueRows, setRevenueRows] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { activeBusiness, activeBusinessId } = useBusiness();
  const currencySymbol = activeBusiness?.currencySymbol;

  useEffect(() => {
    if (!activeBusinessId) {
      return;
    }

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryResponse, revenueResponse] = await Promise.all([
          apiClient.getReportSummary(activeBusinessId),
          apiClient.getRevenueReport(activeBusinessId, period),
        ]);

        setSummary(summaryResponse.data || null);
        setRevenueRows(revenueResponse.data?.revenueSeries || []);
      } catch (loadError) {
        setError(loadError.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [activeBusinessId, period]);

  const chartData = useMemo(
    () => ({
      labels: revenueRows.map((row) => row.label),
      datasets: [
        {
          label: `${periodLabelMap[period]} Revenue`,
          data: revenueRows.map((row) => row.revenue),
          backgroundColor: "#16a34a",
          borderRadius: 4,
        },
      ],
    }),
    [period, revenueRows],
  );

  const trendSummary = useMemo(
    () => getTrendSummary(revenueRows, currencySymbol),
    [currencySymbol, revenueRows],
  );

  const netPositive = (summary?.netCashflow || 0) >= 0;

  const columns = [
    {
      key: "label",
      label: "Period",
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (row) => formatCurrency(row.revenue, currencySymbol),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeaderCard
        title="Revenue Reports"
        subtitle="Friendly overview of revenue, cash movement, and trend performance"
      />

      <ContentCard>
        <div className="reports-toolbar">
          <div className="reports-toolbar-copy">
            <p className="reports-toolbar-title">View by time range</p>
            <p className="reports-toolbar-subtitle">Choose how you want to read your revenue story.</p>
          </div>

          <div className="report-period-switch" role="tablist" aria-label="Revenue period selector">
            {periodOptions.map((option) => (
              <button
                className={`period-pill ${period === option ? "active" : ""}`}
                key={option}
                onClick={() => setPeriod(option)}
                role="tab"
                type="button"
                aria-selected={period === option}
              >
                {periodLabelMap[option]}
              </button>
            ))}
          </div>
        </div>

        {loading ? <EmptyState message="Generating report..." /> : null}
        {!loading && error ? <EmptyState message={error} /> : null}

        {!loading && !error && summary ? (
          <>
            <div className={`report-insight-banner ${trendSummary.tone}`}>
              <div className="report-insight-icon">
                {trendSummary.tone === "up" ? <TrendingUp size={16} /> : null}
                {trendSummary.tone === "down" ? <TrendingDown size={16} /> : null}
                {trendSummary.tone === "neutral" ? <Calendar size={16} /> : null}
              </div>
              <div>
                <p className="report-insight-title">Quick Insight</p>
                <p className="report-insight-text">{trendSummary.text}</p>
              </div>
            </div>

            <div className="payment-grid reports-summary-grid">
              <div className="payment-card report-metric-card revenue">
                <div className="report-metric-head">
                  <span className="report-metric-icon">
                    <Wallet size={16} />
                  </span>
                  <p className="payment-label">Total Revenue</p>
                </div>
                <h5 className="payment-amount">
                  {formatCurrency(summary.totalRevenue, currencySymbol)}
                </h5>
                <p className="report-metric-note">Gross revenue across all recorded sales.</p>
              </div>
              <div className="payment-card report-metric-card incoming">
                <div className="report-metric-head">
                  <span className="report-metric-icon">
                    <ArrowUpCircle size={16} />
                  </span>
                  <p className="payment-label">Incoming</p>
                </div>
                <h5 className="payment-amount">
                  {formatCurrency(summary.totalIncoming, currencySymbol)}
                </h5>
                <p className="report-metric-note">Money received into your business.</p>
              </div>
              <div className="payment-card report-metric-card outgoing">
                <div className="report-metric-head">
                  <span className="report-metric-icon">
                    <ArrowDownCircle size={16} />
                  </span>
                  <p className="payment-label">Outgoing</p>
                </div>
                <h5 className="payment-amount">
                  {formatCurrency(summary.totalOutgoing, currencySymbol)}
                </h5>
                <p className="report-metric-note">Payments and expenses going out.</p>
              </div>
              <div className={`payment-card report-metric-card ${netPositive ? "positive" : "negative"}`}>
                <div className="report-metric-head">
                  <span className="report-metric-icon">
                    {netPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </span>
                  <p className="payment-label">Net Cashflow</p>
                </div>
                <h5 className="payment-amount">
                  {formatCurrency(summary.netCashflow, currencySymbol)}
                </h5>
                <p className="report-metric-note">
                  {netPositive ? "Positive balance after expenses." : "Cash outflow is higher than inflow."}
                </p>
              </div>
            </div>

            <div className="dash-card reports-chart-card">
              <div className="reports-section-head">
                <h3 className="reports-section-title">{periodLabelMap[period]} Revenue Trend</h3>
                <p className="reports-section-subtitle">
                  Simple chart view to compare period-by-period revenue.
                </p>
              </div>

              <div className="reports-chart-holder">
                <Bar
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        displayColors: false,
                      },
                    },
                    scales: {
                      y: { beginAtZero: true },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="dash-card reports-table-card">
              <div className="reports-section-head">
                <h3 className="reports-section-title">Revenue Breakdown</h3>
                <p className="reports-section-subtitle">Search and review period-level revenue records.</p>
              </div>

              <DataTable
                columns={columns}
                rows={revenueRows}
                title={`${periodLabelMap[period]} Revenue`}
                searchPlaceholder="Search period"
              />
            </div>
          </>
        ) : null}
      </ContentCard>
    </div>
  );
}
