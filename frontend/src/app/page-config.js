import {
  CreditCard,
  LayoutDashboard,
  Receipt,
  ShoppingBasket,
  ShoppingCart,
  TrendingUp,
  WalletCards,
} from "lucide-react";

export const pageRouteConfig = [
  {
    key: "dashboard",
    path: "dashboard",
    component: "dashboard",
    title: "Dashboard",
    navLabel: "Dashboard",
    icon: LayoutDashboard,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "billing",
    path: "billing",
    component: "billing",
    title: "Billing",
    navLabel: "Billing",
    icon: CreditCard,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "stock",
    path: "stock",
    component: "stock",
    title: "Stock",
    navLabel: "Stock",
    icon: ShoppingBasket,
    showInSidebar: true,
    showInTopTabs: false,
  },
  {
    key: "sales",
    path: "sales",
    component: "sales",
    title: "Sales Tracking",
    navLabel: "Sales Tracking",
    topTabLabel: "Sales",
    icon: ShoppingCart,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "reports",
    path: "reports",
    component: "reports",
    title: "Revenue Reports",
    navLabel: "Revenue Reports",
    topTabLabel: "Reports",
    icon: TrendingUp,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "buying",
    path: "buying",
    component: "buying",
    title: "Buying Transactions",
    navLabel: "Buying",
    icon: WalletCards,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "buying-add",
    path: "buying/add",
    component: "addTransaction",
    title: "Add Buying Entry",
    showInSidebar: false,
    showInTopTabs: false,
  },
  {
    key: "invoices",
    path: "invoices",
    component: "invoices",
    title: "Invoices",
    navLabel: "Invoices",
    icon: Receipt,
    showInSidebar: true,
    showInTopTabs: true,
  },
  {
    key: "invoice-detail",
    path: "invoices/:invoiceId",
    component: "invoiceDetail",
    title: "Invoice Detail",
    showInSidebar: false,
    showInTopTabs: false,
  },
];

export const routeRedirects = [
  { path: "transactions", to: "/buying" },
  { path: "transactions/add", to: "/buying/add" },
];

export const sidebarNavigation = pageRouteConfig
  .filter((entry) => entry.showInSidebar)
  .map((entry) => ({
    label: entry.navLabel || entry.title,
    to: `/${entry.path}`,
    icon: entry.icon,
  }));

export const topTabNavigation = pageRouteConfig
  .filter((entry) => entry.showInTopTabs)
  .map((entry) => ({
    label: entry.topTabLabel || entry.navLabel || entry.title,
    to: `/${entry.path}`,
  }));

function escapeRegexText(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRouteRegex(path) {
  const escaped = escapeRegexText(path);
  const withDynamicSegments = escaped.replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^/${withDynamicSegments}$`);
}

const routeMatchers = pageRouteConfig.map((entry) => ({
  ...entry,
  regex: buildRouteRegex(entry.path),
}));

export function getPageByPath(pathname) {
  if (!pathname) {
    return null;
  }

  const normalizedPath = pathname === "/" ? "/dashboard" : pathname.replace(/\/+$/, "") || "/";
  return routeMatchers.find((entry) => entry.regex.test(normalizedPath)) || null;
}
