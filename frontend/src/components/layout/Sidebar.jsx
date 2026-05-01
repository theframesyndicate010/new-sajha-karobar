import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { sidebarNavigation } from "../../app/page-config.js";

function SidebarItem({ item, isCollapsed, onNavigate }) {
  const Icon = item.icon;

  return (
    <li className="nav-item">
      <NavLink
        end={item.exact}
        to={item.to}
        onClick={onNavigate}
        aria-label={item.label}
        data-tooltip={item.label}
        className={({ isActive }) =>
          `nav-link ${isActive ? "active" : ""} ${isCollapsed ? "collapsed" : ""}`
        }
      >
        <Icon size={18} strokeWidth={2.2} />
        <span className="nav-text">{item.label}</span>
      </NavLink>
    </li>
  );
}

export default function Sidebar({ isDesktopExpanded, isMobile, isMobileOpen, onNavigate }) {
  const handleLogout = () => {
    localStorage.removeItem("sajha-karobar-active-business");
    window.location.assign("/");
  };

  const isExpanded = useMemo(() => {
    if (isMobile) {
      return isMobileOpen;
    }

    return isDesktopExpanded;
  }, [isDesktopExpanded, isMobile, isMobileOpen]);

  return (
    <aside className={`sidebar ${isExpanded ? "expanded" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-box">
          <img src="/logo.png" alt="Sajha Karobar" />
        </div>
        <h4 className="nav-text">Sajha Karobar</h4>
      </div>

      <ul className="sidebar-menu">
        {sidebarNavigation.map((item) => (
          <SidebarItem
            key={item.to}
            isCollapsed={!isExpanded}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      <div className="sidebar-footer">
        <button
          aria-label="Logout"
          className={`nav-link nav-link-btn ${!isExpanded ? "collapsed" : ""}`}
          data-tooltip="Logout"
          onClick={() => {
            if (onNavigate) {
              onNavigate();
            }
            handleLogout();
          }}
          type="button"
        >
          <LogOut size={18} strokeWidth={2.2} />
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
