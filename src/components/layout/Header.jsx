import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

import { useBusiness } from "../../context/useBusiness.js";

const topTabs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Billing", to: "/billing" },
  { label: "Sales", to: "/sales" },
  { label: "Reports", to: "/reports" },
  { label: "Buying", to: "/buying" },
  { label: "Invoices", to: "/invoices" },
];

export default function Header({ onToggleSidebar }) {
  const { businesses, activeBusinessId, setActiveBusinessId, activeBusiness } = useBusiness();

  const businessTypeLabel = useMemo(() => {
    const type = activeBusiness?.type || "business";
    return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  }, [activeBusiness]);

  return (
    <header className="topbar">
      <div className="header-left">
        <button className="icon-btn" onClick={onToggleSidebar} type="button">
          <Menu size={17} />
        </button>
      </div>

      <nav className="header-tabs" aria-label="Header navigation tabs">
        {topTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `nav-tab ${isActive ? "active-tab" : ""}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <span className="invoice-meta">Business Type: {businessTypeLabel}</span>

        <div className="business-select-wrap">
          <select
            aria-label="Select active business"
            className="business-select"
            disabled={!businesses.length}
            value={activeBusinessId || ""}
            onChange={(event) => setActiveBusinessId(event.target.value)}
          >
            {businesses.length ? (
              businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))
            ) : (
              <option value="">Business chaina</option>
            )}
          </select>
        </div>
      </div>
    </header>
  );
}
