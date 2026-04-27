import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
} from "lucide-react";
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
          <BarChart3 size={16} />
          <p>SAJHA</p>
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
    </aside>
  );
}
