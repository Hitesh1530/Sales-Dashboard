# Product Ratings & Review Analytics Dashboard

A full-stack web application that ingests Amazon product review data (CSV/XLSX), stores it in PostgreSQL, exposes analytics REST APIs, and visualises the results through interactive charts and a filterable data table.

---

## What This Project Does

Upload an Amazon product XLSX/CSV file → the backend parses, validates, and batch-inserts the rows into PostgreSQL → six analytics APIs serve aggregated data → a React + MUI frontend renders four ApexCharts and a server-side paginated table with full-text search, sorting, filtering, dark mode, and CSV export.

---

## Feature Set

| Area | Features |
|---|---|
| **Upload** | Drag-and-drop or click-to-select, accepts CSV and XLSX (≤10 MB), shows progress bar and detailed results |
| **Data Table** | Server-side pagination (10/20/50 rows), full-text search, category filter, min-rating filter, click-to-sort on all 7 columns, active filter chips, CSV export |
| **Dashboard Charts** | Products per category (bar), Top 10 reviewed products (horizontal bar), Discount distribution histogram, Category-wise avg rating — all clickable (click a bar → pre-filters Data Table) |
| **Dark Mode** | Toggle in the AppBar, persisted to `localStorage` |
| **Error Handling** | 400 for invalid file type, 400 for file too large, 429 for rate-limit (10 uploads/IP/15 min), empty-state messages, retry buttons on every chart, loading skeletons throughout |
| **Performance** | Connection pool (max 20), batch inserts (100 rows/transaction), GIN full-text index, B-tree indexes on category/rating/rating_count/discount, server-side pagination |

---

## Tech Stack

### Backend
| Library | Version | Purpose |
|---|---|---|
| Node.js | v22 | Runtime |
| Express | ^4.18 | HTTP framework |
| pg | ^8.11 | PostgreSQL client (connection pool) |
| ExcelJS | ^4.4 | XLSX parsing |
| csv-parser | ^3.0 | CSV parsing |
| multer | ^1.4.5-lts | Multipart file uploads |
| express-rate-limit | ^8.2 | Upload rate limiting |
| joi | ^17.11 | Request validation schemas |
| dotenv | ^16.3 | Environment variables |

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | ^18.2 | UI framework |
| Vite | ^5.0 | Dev server + bundler |
| MUI (Material UI) | ^5.15 | Component library + theming |
| Redux Toolkit | ^2.0 | State management |
| react-redux | ^9.0 | React bindings |
| Axios | ^1.6 | HTTP client |
| ApexCharts | ^3.45 | Interactive charts |
| react-router-dom | ^6.20 | Client-side routing |

### Database
- **PostgreSQL 18** — `products` table with tsvector FTS column and 5 B-tree + 1 GIN indexes

---

## How the System Works End-to-End

```
┌─────────────┐     POST /api/upload      ┌──────────────────┐
│  Upload Page │ ─────── XLSX/CSV ──────► │ upload-service   │
└─────────────┘                           │ ExcelJS parser   │
                                          │ Batch INSERT 100 │
                                          └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │   PostgreSQL     │
                                          │  products table  │
                                          │  (1351 rows)     │
                                          └────────┬─────────┘
                                                   │
┌─────────────┐   GET /api/products/*    ┌────────▼─────────┐
│  Dashboard  │ ◄──── JSON responses ─── │ products-service │
│  Data Table │                          │ SQL aggregations │
└──────┬──────┘                          └──────────────────┘
       │
 Redux Toolkit
 productsSlice
 7 async thunks
       │
  React + MUI
  ApexCharts
  Table + Filters
```

---

## Project Structure

```
Sales_Dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── products-controller.js   # 7 route handlers
│   │   │   └── upload-controller.js     # delegates to upload-service
│   │   ├── services/
│   │   │   ├── products-service.js      # all 7 SQL analytics queries
│   │   │   └── upload-service.js        # XLSX/CSV parser + batch inserts
│   │   ├── routes/
│   │   │   ├── products-routes.js       # GET /api/products/*
│   │   │   └── upload-routes.js         # POST /api/upload (rate-limited)
│   │   ├── db/
│   │   │   ├── connection.js            # pg Pool + query/getClient helpers
│   │   │   ├── schema.sql               # CREATE TABLE + indexes
│   │   │   └── init.js                  # schema runner + checkDatabase()
│   │   ├── middleware/
│   │   │   ├── error-handler.js         # central error + 404 middleware
│   │   │   ├── async-handler.js         # try/catch wrapper for controllers
│   │   │   └── validation.js            # Joi middleware factory
│   │   ├── utils/                       # async-handler utility
│   │   ├── validators/                  # Joi schemas
│   │   └── server.js                    # Express app entry point
│   ├── tests/
│   │   └── products-service.test.mjs   # 18 unit tests (Node test runner)
│   ├── .env                             # environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # ColorModeContext + routes
│   │   ├── layout/
│   │   │   └── MainLayout.jsx           # AppBar + dark mode toggle + footer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx        # 4 ApexCharts with click-through
│   │   │   ├── DataTablePage.jsx        # table + sort + filter + CSV export
│   │   │   └── UploadPage.jsx           # drag-drop upload + progress
│   │   ├── redux/
│   │   │   ├── store.js                 # configureStore
│   │   │   └── slices/productsSlice.js  # 7 async thunks + reducers
│   │   ├── api/
│   │   │   └── axios.js                 # Axios instance (baseURL /api)
│   │   ├── components/                  # reusable MUI-based components
│   │   └── theme/theme.js               # createAppTheme(mode) factory
│   ├── vite.config.js
│   └── package.json
│
├── Assignment_-_2_Dataset.xlsx          # Amazon product dataset
├── README.md
├── ARCHITECTURE_RULES.md
└── PROJECT_CONTEXT.md
```

---

## Local Setup

### Prerequisites
- Node.js ≥ 18 (v22 recommended)
- PostgreSQL 18 running locally
- A PostgreSQL database named `sales_dashboard`

### 1 — Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2 — Configure the backend

Copy `.env.example` or create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_dashboard
DB_USER=postgres
DB_PASSWORD=your_password_here

CORS_ORIGIN=http://localhost:5173
```

### 3 — Create the database

```sql
-- In psql or pgAdmin:
CREATE DATABASE sales_dashboard;
```

### 4 — Initialize the schema

```bash
cd backend
node -e "import('./src/db/init.js').then(m => m.initializeDatabase()).then(() => process.exit(0))"
```

### 5 — Load the dataset (optional — can also upload via UI)

```bash
cd backend
node migrate.mjs   # drops old data, creates schema, uploads the XLSX
```

### 6 — Run the servers

```bash
# Terminal 1 — backend (port 5000, auto-reload on changes)
cd backend
npm run dev

# Terminal 2 — frontend (port 5173, HMR)
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend HTTP port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sales_dashboard` | Database name |
| `DB_USER` | `postgres` | DB username |
| `DB_PASSWORD` | *(required)* | DB password |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

---

## Available Scripts

### Backend (`backend/`)
| Script | Command | Description |
|---|---|---|
| `dev` | `node --watch src/server.js` | Dev server with auto-reload |
| `start` | `node src/server.js` | Production start |
| `test` | `node --test tests/**/*.test.mjs` | Run unit tests |

### Frontend (`frontend/`)
| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Dev server with HMR on port 5173 |
| `build` | `vite build` | Production bundle to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Lint all JS/JSX files |

---

## Machine Test Requirements Coverage

| Requirement | Implementation | Verification |
|---|---|---|
| CSV/XLSX file upload | `POST /api/upload` + multer + ExcelJS + csv-parser | Upload tab → select file → check success summary |
| Data stored in PostgreSQL | `products` table, batch transactions | `SELECT COUNT(*) FROM products` → 1351 |
| Products per category chart | `GET /api/products/by-category` → bar chart | Dashboard → Chart 1 (purple bars) |
| Top reviewed products chart | `GET /api/products/top-reviewed` → horizontal bar | Dashboard → Chart 2 (green bars) |
| Discount distribution histogram | `GET /api/products/discount-distribution` → bar | Dashboard → Chart 3 (amber bars) |
| Avg rating by category chart | `GET /api/products/avg-rating-by-category` → bar | Dashboard → Chart 4 (pink bars) |
| Paginated data table | `GET /api/products?page=&limit=` + `TablePagination` | Data Table → next/prev page buttons |
| Product name search | Full-text search `name_tsv @@ plainto_tsquery` | Data Table → search box |
| Category filter | `WHERE category = $n` | Data Table → Category dropdown |
| Min rating filter | `WHERE rating >= $n` | Data Table → Min Rating dropdown |
| Column sorting | `ORDER BY col ASC/DESC` (whitelist) | Data Table → click any column header |
| CSV export | `GET /api/products/export` | Data Table → Export CSV button |
| Chart click → filter table | `navigate('/data?category=...')` | Dashboard → click any bar |
| Upload validation (type) | multer fileFilter → `400` | Upload a `.txt` or `.pdf` → see error |
| Upload rate limiting | `express-rate-limit` (10/IP/15 min) | Upload 11 times → `429` |
| Loading states | Skeleton rows, Skeleton cards | Observe table/chart skeleton on page load |
| Empty state | Custom messages in table and charts | Search for "XYZNOTFOUND" |
| Dark mode | `ColorModeContext` + `createAppTheme(mode)` | Click moon icon in top-right of nav |
| Unit tests (18 tests) | `tests/products-service.test.mjs` | `node --test tests/products-service.test.mjs` |
| Retry on chart error | Retry button in `ChartCard` | Observe Retry button on each chart card |
