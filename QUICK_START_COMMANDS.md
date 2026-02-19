# Quick Start Commands

Everything you need to run the Product Analytics Dashboard from a fresh clone.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|---|---|---|
| Node.js | ≥ 18 (v22 recommended) | `node --version` |
| npm | ≥ 9 | `npm --version` |
| PostgreSQL | 14 or later | `psql --version` |

---

## Step 1 — Clone the repository

```bash
git clone <repository-url>
cd Sales_Dashboard
```

---

## Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

This installs: `express`, `pg`, `exceljs`, `csv-parser`, `multer`, `express-rate-limit`, `joi`, `dotenv`, and dev dependencies `jest`, `supertest`.

---

## Step 3 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

This installs: `react`, `react-dom`, `@mui/material`, `@mui/icons-material`, `@reduxjs/toolkit`, `react-redux`, `axios`, `apexcharts`, `react-apexcharts`, `react-router-dom`, and Vite dev tools.

---

## Step 4 — Configure the backend environment

```bash
cd ../backend
```

Create (or confirm) the file `backend/.env` with the following content — adjust `DB_PASSWORD` to match your PostgreSQL setup:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgres_password

CORS_ORIGIN=http://localhost:5173
```

> The `.env` file is already present in the repo. Only `DB_PASSWORD` typically needs changing.

---

## Step 5 — Create the database

Open a terminal and connect to PostgreSQL:

```bash
# Windows (default install path)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# macOS / Linux
psql -U postgres
```

Then run:

```sql
CREATE DATABASE sales_dashboard;
\q
```

---

## Step 6 — Initialize the schema (create the products table)

```bash
cd backend
node -e "import('./src/db/init.js').then(m => m.initializeDatabase()).then(() => { console.log('Done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database schema initialized successfully
```

---

## Step 7 — Load the dataset (recommended — or skip and upload via UI)

The repository includes `Assignment_-_2_Dataset.xlsx`. Run the migration script to automatically load all 1,351 unique products:

```bash
cd backend
node v2-migrate.mjs
```

Expected output:
```
🔄 Running v2 migration...
1. Removing duplicate product_ids...
   Before: 1465 rows
   After: 1351 rows (removed 114 duplicates)
2. Adding name_tsv column... ✅
3. Adding UNIQUE index on product_id... ✅
4. Adding GIN index on name_tsv... ✅
✅ Migration complete! Total products: 1351
🔍 FTS test (wireless): 95 results
```

> **Skip this step** if you prefer to upload the file manually via the UI on the Upload page.

---

## Step 8 — Run the backend server

```bash
cd backend
npm run dev
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database schema initialized successfully
🚀 Server running on port 5000
```

Verify: open http://localhost:5000/health in a browser — should return `{"success":true}`.

---

## Step 9 — Run the frontend dev server

Open a **new terminal**:

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x  ready in 350ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## Running Both Servers Together (Windows PowerShell)

```powershell
# From Sales_Dashboard root — runs both in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

---

## Run the Unit Tests

```bash
cd backend
node --test tests/products-service.test.mjs
```

Expected output:
```
ℹ tests 18 | pass 18 | fail 0 | duration_ms ~1200
```

---

## Production Build (Frontend)

```bash
cd frontend
npm run build
npm run preview    # preview the production build at http://localhost:4173
```

The built files are output to `frontend/dist/`.

---

## Verify Everything Is Working

After completing the steps above, open http://localhost:5173 and confirm:

1. **Dashboard** loads with 4 charts showing real data
2. **Data Table** shows 1,351 rows (or the number you uploaded), with pagination controls
3. **Upload** page is accessible and accepts XLSX/CSV files
4. **Dark mode** toggle (moon icon) in the top-right works
5. **Health endpoint** returns `200 OK`: http://localhost:5000/health

---

## Common Issues

| Issue | Solution |
|---|---|
| `ECONNREFUSED` on port 5432 | PostgreSQL service is not running — start it: `net start postgresql-x64-18` (Windows) |
| `DB password authentication failed` | Update `DB_PASSWORD` in `backend/.env` |
| `relation "products" does not exist` | Run Step 6 (schema init) |
| Port 5000 already in use | Change `PORT` in `.env` and restart backend |
| Port 5173 already in use | Vite auto-increments to 5174 — update `CORS_ORIGIN` in `.env` to match |
