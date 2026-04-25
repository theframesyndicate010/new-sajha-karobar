import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { useBusiness } from "../../context/useBusiness.js";
import PwaUpdatePrompt from "../common/PwaUpdatePrompt.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

const MOBILE_BREAKPOINT = 768;

export default function AppShell() {
  const [isDesktopExpanded, setDesktopExpanded] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const { loading, error } = useBusiness();

  useEffect(() => {
    const onResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = useMemo(() => windowWidth <= MOBILE_BREAKPOINT, [windowWidth]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((previous) => !previous);
      return;
    }

    setDesktopExpanded((previous) => !previous);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <div
        aria-label="Sidebar overlay"
        className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`}
        onClick={closeMobileSidebar}
      />

      <Sidebar
        isDesktopExpanded={isDesktopExpanded}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onNavigate={closeMobileSidebar}
      />

      <main className="main-content">
        <Header onToggleSidebar={toggleSidebar} />

        <section className="dashboard-scroll">
          {loading && (
            <div className="state-wrap">
              <div className="state-card">Loading business data...</div>
            </div>
          )}

          {!loading && error && (
            <div className="state-wrap">
              <div className="state-card state-error">{error}</div>
            </div>
          )}

          {!loading && !error && <Outlet />}
        </section>
      </main>

      <PwaUpdatePrompt />
    </div>
  );
}
