# Sajha Karobar System

Sajha Karobar System is a multi-business management system built with React, Tailwind CSS, and Express.
The UI design system is intentionally reused from the cafe-leadingedge project:

- Collapsible dark sidebar layout
- White topbar with tab-style navigation
- Same card style, spacing, palette, and typography direction
- Dashboard visual language and billing style consistency

The business logic is generalized so the same app supports restaurant, gym, and retail (and can be extended for more).

## Core Features

- Sales tracking
- Revenue reports
- Billing system
- Invoice generation
- Incoming and outgoing transaction management
- Printable invoice layout

## Tech Stack

- Frontend: React + React Router + Tailwind CSS + custom CSS tokens
- Charts: Chart.js + react-chartjs-2
- Backend: Node.js + Express
- Data Store: JSON persistence (`server/data/db.json`)

## Frontend Production Hardening

The frontend now includes a production-focused baseline:

- Global runtime crash protection with React error boundary
- Route-level lazy loading with loading fallback for better initial performance
- API request timeout + retry (for idempotent requests) with normalized user-friendly errors

## Progressive Web App (PWA)

The frontend is now configured as a PWA using a standards-based manifest + service worker setup.

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- Offline fallback page: `public/offline.html`
- Install icons:
	- `public/pwa-180x180.png`
	- `public/pwa-192x192.png`
	- `public/pwa-512x512.png`
	- `public/pwa-maskable-512x512.png`

### Browser and Device Coverage

- Chrome / Edge / Samsung Internet (Android + Desktop): install prompt + offline caching
- Safari (iOS + macOS): Add to Home Screen + standalone launch + offline caching
- Firefox: offline caching and manifest support (install UX differs by platform/version)
- Older browsers without Service Worker support: normal web app behavior (graceful fallback)

### Deployment Requirements

- Use HTTPS in production (required by service workers and installability checks)
- `localhost` works for development testing

Environment variables (`.env.example`):

- `VITE_API_BASE_URL` API base path
- `VITE_API_TIMEOUT_MS` request timeout in milliseconds
- `VITE_API_RETRY_COUNT` retry count for safe GET/HEAD requests

## Project Structure

```text
sajha-karobar-system/
	src/
		app/
			router.jsx
		components/
			common/
			layout/
		context/
			BusinessContext.jsx
		pages/
			DashboardPage.jsx
			SalesPage.jsx
			BillingPage.jsx
			InvoicesPage.jsx
			InvoiceDetailPage.jsx
			TransactionsPage.jsx
			ReportsPage.jsx
		services/
			apiClient.js
			formatters.js
		styles/
			design-system.css
	server/
		data/
			db.json
		routes/
			businesses.routes.js
			catalog.routes.js
			dashboard.routes.js
			invoices.routes.js
			sales.routes.js
			transactions.routes.js
			reports.routes.js
		services/
			db.service.js
			reporting.service.js
		utils/
			business.js
			finance.js
		app.js
		index.js
```

## How It Works

1. `BusinessContext` loads available businesses and keeps active business state globally.
2. Every page reads the active business and calls the backend with `businessId`.
3. Billing creates invoices; invoice creation automatically writes:
	 - invoice record
	 - sales record
	 - incoming transaction record
4. Reports and dashboard are calculated from those records.

## API Endpoints

- `GET /api/health`
- `GET /api/businesses`
- `POST /api/businesses`
- `GET /api/catalog?businessId=...&search=...&category=...`
- `GET /api/dashboard?businessId=...`
- `GET /api/sales?businessId=...`
- `POST /api/sales`
- `GET /api/invoices?businessId=...`
- `GET /api/invoices/:invoiceId`
- `POST /api/invoices`
- `GET /api/transactions?businessId=...&type=...`
- `POST /api/transactions`
- `GET /api/reports/summary?businessId=...`
- `GET /api/reports/revenue?businessId=...&period=weekly|monthly|yearly`

## Run Locally

Install dependencies:

```bash
npm install
```

Run frontend + backend together:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5174`

Build frontend:

```bash
npm run build
```

Run backend only (production-style API start):

```bash
npm run start
```

## Printing Invoices

- Open an invoice detail page from Invoices module.
- Click **Print Invoice**.
- The print stylesheet hides sidebar/topbar and formats invoice content for paper.

## Notes for Extension

- Add new business types by inserting business records and catalog mappings.
- Move from JSON to SQL/NoSQL by replacing `db.service.js` with repository adapters.
- Add authentication/authorization in `server/app.js` middleware layer.
