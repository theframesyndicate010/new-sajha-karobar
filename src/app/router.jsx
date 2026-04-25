import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import PageLoader from "../components/common/PageLoader.jsx";

const AppShell = lazy(() => import("../components/layout/AppShell.jsx"));
const AddTransactionPage = lazy(() => import("../pages/AddTransactionPage.jsx"));
const BillingPage = lazy(() => import("../pages/BillingPage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));
const InvoiceDetailPage = lazy(() => import("../pages/InvoiceDetailPage.jsx"));
const InvoicesPage = lazy(() => import("../pages/InvoicesPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const ReportsPage = lazy(() => import("../pages/ReportsPage.jsx"));
const SalesPage = lazy(() => import("../pages/SalesPage.jsx"));
const StockPage = lazy(() => import("../pages/StockPage.jsx"));
const BuyingPage = lazy(() => import("../pages/TransactionsPage.jsx"));

function withPageLoader(node) {
  return <Suspense fallback={<PageLoader message="Loading page..." />}>{node}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withPageLoader(<AppShell />),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: withPageLoader(<DashboardPage />),
      },
      {
        path: "sales",
        element: withPageLoader(<SalesPage />),
      },
      {
        path: "stock",
        element: withPageLoader(<StockPage />),
      },
      {
        path: "billing",
        element: withPageLoader(<BillingPage />),
      },
      {
        path: "invoices",
        element: withPageLoader(<InvoicesPage />),
      },
      {
        path: "invoices/:invoiceId",
        element: withPageLoader(<InvoiceDetailPage />),
      },
      {
        path: "buying",
        element: withPageLoader(<BuyingPage />),
      },
      {
        path: "buying/add",
        element: withPageLoader(<AddTransactionPage />),
      },
      {
        path: "transactions",
        element: <Navigate to="/buying" replace />,
      },
      {
        path: "transactions/add",
        element: <Navigate to="/buying/add" replace />,
      },
      {
        path: "reports",
        element: withPageLoader(<ReportsPage />),
      },
    ],
  },
  {
    path: "*",
    element: withPageLoader(<NotFoundPage />),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} fallbackElement={<PageLoader message="Preparing route..." />} />;
}
