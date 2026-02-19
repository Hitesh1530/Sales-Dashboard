# Requirement Traceability Matrix

Maps every machine test requirement to the exact implementation and how to verify it in the running application.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Fully implemented and verified |
| 📍 | Where to verify in the UI |
| 🔌 | API endpoint |
| 💾 | Database implementation |
| ⚙️ | Code location |

---

## Category 1 — Data Ingestion

### REQ-01: Accept CSV and XLSX file uploads

| Field | Detail |
|---|---|
| **Requirement** | System must accept product data via CSV and XLSX file upload |
| **Status** | ✅ Implemented |
| **API** | `POST /api/upload` (multipart/form-data, field name: `file`) |
| **Code** | `backend/src/routes/upload-routes.js` — multer `fileFilter` accepts `.csv/.xlsx/.xls` by extension and MIME type |
| **Code** | `backend/src/services/upload-service.js` — `parseXLSX()` (ExcelJS) and `parseCSV()` (csv-parser) |
| **UI Verification** | Navigate to **Upload** tab → drag `Assignment_-_2_Dataset.xlsx` → click Upload → green success alert |
| **Expected Result** | `{ total: 1465, inserted: 1351, failed: 114 }` |

---

### REQ-02: Parse Amazon XLSX format (row 2 = headers)

| Field | Detail |
|---|---|
| **Requirement** | The XLSX parser must correctly identify row 2 as column headers, skip row 1 |
| **Status** | ✅ Implemented |
| **Code** | `upload-service.js` — loop starts at `rowNumber >= 2`; row 2 is mapped to header names, rows 3+ are data |
| **Verification** | After upload, `SELECT product_name FROM products LIMIT 1` returns a real product name, not "product_name" |

---

### REQ-03: Data cleaning — strip currency and percentage symbols

| Field | Detail |
|---|---|
| **Requirement** | `discounted_price`, `actual_price` come as "₹999", `discount_percentage` as "75%" — must be stored as numbers |
| **Status** | ✅ Implemented |
| **Code** | `upload-service.js` — `toNum()` removes `₹`, `,`, `%` using regex; `toInt()` for integer columns |
| **Verification** | **Data Table** → "Price (₹)" column shows plain numbers like `999.00`, not `₹999` |

---

### REQ-04: Batch insert with transaction support

| Field | Detail |
|---|---|
| **Requirement** | Rows should be inserted in batches (not one by one) for performance |
| **Status** | ✅ Implemented |
| **Code** | `upload-service.js` — `batchInsert()` chunks rows into groups of 100, wraps each in `BEGIN…COMMIT` |
| **Verification** | Run `node --test tests/products-service.test.mjs` — all 18 tests pass including export tests that verify data |

---

### REQ-05: Prevent duplicate product_id uploads

| Field | Detail |
|---|---|
| **Requirement** | Re-uploading the same file must not create duplicate records |
| **Status** | ✅ Implemented |
| **Database** | `CREATE UNIQUE INDEX idx_products_product_id_unique ON products(product_id)` |
| **Code** | `upload-service.js` — `batchInsert` uses `ON CONFLICT (product_id) DO NOTHING` |
| **Verification** | Upload the same XLSX twice → second upload shows `inserted: 0, failed: 1351` — no duplicates added |

---

## Category 2 — Database

### REQ-06: PostgreSQL products table with correct schema

| Field | Detail |
|---|---|
| **Requirement** | Products must be stored in a PostgreSQL table with all 12 required columns |
| **Status** | ✅ Implemented |
| **Database** | `backend/src/db/schema.sql` — `products` table with 15 columns (12 data + id, created_at, name_tsv) |
| **Verification** | `SELECT COUNT(*) FROM products` → `1351`; `\d products` → shows all columns |

---

### REQ-07: Full-text search index

| Field | Detail |
|---|---|
| **Requirement** | Product name search must be efficient at scale |
| **Status** | ✅ Implemented |
| **Database** | `name_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(product_name,''))) STORED` |
| **Database** | `CREATE INDEX idx_products_name_tsv ON products USING gin(name_tsv)` |
| **Code** | `products-service.js` — `getProducts()` uses `name_tsv @@ plainto_tsquery('english', $1)` for ≥3 char queries |
| **Verification** | Data Table → search "wireless" → ~95 results returned in <100ms |

---

### REQ-08: Performance indexes

| Field | Detail |
|---|---|
| **Requirement** | Filter and sort operations on category, rating, discount must be fast |
| **Status** | ✅ Implemented |
| **Database** | B-tree indexes on `category`, `rating`, `rating_count`, `discount_percentage` |
| **Verification** | API queries return in <300ms confirmed by backend console `duration:` logs |

---

## Category 3 — Analytics APIs

### REQ-09: Paginated product data API

| Field | Detail |
|---|---|
| **Requirement** | API must return paginated rows with total count |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products?page=1&limit=20` |
| **Code** | `products-service.js → getProducts()` — LIMIT/OFFSET based, returns `{ data, pagination }` |
| **Verification** | `GET /api/products` → `pagination.total: 1351, totalPages: 68` |

---

### REQ-10: Category count aggregation API

| Field | Detail |
|---|---|
| **Requirement** | API must return product count per category |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products/by-category` |
| **SQL** | `SELECT category, COUNT(*) FROM products GROUP BY category ORDER BY product_count DESC` |
| **Verification** | Response: `[{ category: "Electronics", product_count: "490" }, …]` |

---

### REQ-11: Top reviewed products API

| Field | Detail |
|---|---|
| **Requirement** | API must return the N most-reviewed products |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products/top-reviewed?limit=10` |
| **SQL** | `SELECT product_name, rating, rating_count FROM products ORDER BY rating_count DESC LIMIT $1` |
| **Verification** | First result: AmazonBasics USB cable with ~426,973 reviews |

---

### REQ-12: Discount distribution histogram API

| Field | Detail |
|---|---|
| **Requirement** | API must bucket products by discount range |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products/discount-distribution` |
| **SQL** | `CASE WHEN discount_percentage < 20 THEN '0-20%' … END AS bucket, COUNT(*)` |
| **Verification** | Returns 5 buckets; `60-80%` bucket has the most products (~802) |

---

### REQ-13: Average rating by category API

| Field | Detail |
|---|---|
| **Requirement** | API must return mean rating per category |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products/avg-rating-by-category` |
| **SQL** | `SELECT category, ROUND(AVG(rating)::NUMERIC, 2) FROM products GROUP BY category ORDER BY avg_rating DESC` |
| **Verification** | All avg_rating values between 3.5 and 5.0 ✅ |

---

### REQ-14: CSV export API

| Field | Detail |
|---|---|
| **Requirement** | System must allow downloading all matching data as CSV |
| **Status** | ✅ Implemented |
| **API** | `GET /api/products/export?category=Electronics` |
| **Code** | `products-controller.js → exportProducts()` — streams CSV with proper `Content-Disposition` header |
| **Verification** | Download starts immediately; file has headers + 490 data rows for Electronics filter |

---

## Category 4 — Frontend

### REQ-15: Products per category bar chart

| Field | Detail |
|---|---|
| **Requirement** | Dashboard must show a bar chart of product count per category |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — Chart 1, ApexCharts `type: 'bar'`, data from `fetchByCategory` thunk |
| **Verification** | Dashboard → purple bar chart, Electronics bar tallest (~490) |

---

### REQ-16: Top reviewed products chart

| Field | Detail |
|---|---|
| **Requirement** | Dashboard must show top 10 most-reviewed products |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — Chart 2, horizontal bar, data from `fetchTopReviewed(10)` thunk |
| **Verification** | Dashboard → green horizontal bar chart, AmazonBasics at top |

---

### REQ-17: Discount distribution histogram

| Field | Detail |
|---|---|
| **Requirement** | Dashboard must show distribution of product discounts |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — Chart 3, `type: 'bar'`, 5 buckets, amber colour |
| **Verification** | Dashboard → amber histogram, 60-80% bucket tallest |

---

### REQ-18: Average rating by category chart

| Field | Detail |
|---|---|
| **Requirement** | Dashboard must show mean rating per category |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — Chart 4, pink bar chart, data from `fetchAvgRatingByCategory` thunk |
| **Verification** | Dashboard → all bars between 3.5–4.5, MusicalInstruments highest |

---

### REQ-19: Server-side paginated data table

| Field | Detail |
|---|---|
| **Requirement** | Table must paginate on the server (not load all rows to browser) |
| **Status** | ✅ Implemented |
| **Component** | `DataTablePage.jsx` — MUI `Table` + `TablePagination`, dispatches `fetchProducts` with `page` and `limit` |
| **Verification** | Data Table → page 2 → Network tab shows `GET /api/products?page=2&limit=20` |

---

### REQ-20: Product name search (full-text)

| Field | Detail |
|---|---|
| **Requirement** | User must be able to search products by name |
| **Status** | ✅ Implemented |
| **Component** | `DataTablePage.jsx` — debounced `TextField`, dispatches `fetchProducts({ search })` after 400ms |
| **Verification** | Type "wireless" → ~95 results; type "XYZNOTFOUND" → 0 results + empty state message |

---

### REQ-21: Category filter dropdown

| Field | Detail |
|---|---|
| **Requirement** | User must be able to filter by category |
| **Status** | ✅ Implemented |
| **Component** | `DataTablePage.jsx` — MUI `Select` populated from `fetchCategories` thunk |
| **Verification** | Select "Electronics" → 490 rows, blue chip appears |

---

### REQ-22: Minimum rating filter

| Field | Detail |
|---|---|
| **Requirement** | User must be able to filter products by minimum rating |
| **Status** | ✅ Implemented |
| **Component** | `DataTablePage.jsx` — MUI `Select` with options 3.0+, 3.5+, 4.0+, 4.5+ |
| **Verification** | Select "4.5+" → all visible rows have ≥ 4.5 stars in the Rating column |

---

### REQ-23: Column sorting

| Field | Detail |
|---|---|
| **Requirement** | Table columns must be sortable |
| **Status** | ✅ Implemented |
| **Component** | `DataTablePage.jsx` — MUI `TableSortLabel` on all 7 columns; dispatches `fetchProducts({ sortBy, sortOrder })` |
| **Verification** | Click "Reviews" header → sorts ascending; click again → descending |

---

### REQ-24: Redux Toolkit state management

| Field | Detail |
|---|---|
| **Requirement** | All API calls must go through Redux, no direct API calls in components |
| **Status** | ✅ Implemented |
| **Code** | `frontend/src/redux/slices/productsSlice.js` — 7 `createAsyncThunk` thunks |
| **Code** | `frontend/src/redux/store.js` — `configureStore({ reducer: { products: productsReducer } })` |
| **Verification** | Open Redux DevTools → all thunk lifecycle actions (`pending`, `fulfilled`) visible on every navigation |

---

### REQ-25: Loading states

| Field | Detail |
|---|---|
| **Requirement** | The UI must show loading indicators while data is fetching |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — `Skeleton` rectangular cards while charts load |
| **Component** | `DataTablePage.jsx` — `Skeleton` text rows in table body while fetching |
| **Verification** | Hard-refresh → observe skeleton rows/cards briefly before data appears |

---

### REQ-26: Upload validation — 400 error for wrong file type

| Field | Detail |
|---|---|
| **Requirement** | Uploading a non-CSV/XLSX file must return HTTP 400, not 500 |
| **Status** | ✅ Implemented |
| **Code** | `upload-routes.js` — route-level multer error handler: `if (err) return res.status(400).json(...)` |
| **Verification** | Upload a `.pdf` → HTTP 400 + `{ success: false, error: "Invalid file type..." }` |

---

### REQ-27: Rate limiting on upload

| Field | Detail |
|---|---|
| **Requirement** | Upload endpoint must have rate limiting to prevent abuse |
| **Status** | ✅ Implemented |
| **Code** | `upload-routes.js` — `rateLimit({ windowMs: 15*60*1000, max: 10 })` |
| **Verification** | Upload 11 times rapidly → 11th request returns HTTP 429 + `"Too many upload requests. Wait 15 minutes."` |

---

### REQ-28: Chart click → Data Table filter

| Field | Detail |
|---|---|
| **Requirement** | Clicking a chart bar must navigate to the Data Table with that category pre-filtered |
| **Status** | ✅ Implemented |
| **Code** | `DashboardPage.jsx` — `chart.events.dataPointSelection` calls `navigate('/data?category=...')` |
| **Code** | `DataTablePage.jsx` — `useSearchParams()` reads `?category=` on mount and pre-populates filter |
| **Verification** | Dashboard → click Electronics bar → redirected to `/data?category=Electronics` → table pre-filtered |

---

### REQ-29: Dark mode support

| Field | Detail |
|---|---|
| **Requirement** | Application must support dark/light mode toggle |
| **Status** | ✅ Implemented |
| **Code** | `App.jsx` — `ColorModeContext` with `toggleColorMode`, persisted to `localStorage` |
| **Code** | `theme.js` — `createAppTheme(mode)` factory function |
| **Code** | `MainLayout.jsx` — `Brightness4Icon`/`Brightness7Icon` toggle in AppBar |
| **Verification** | Click moon icon → dark mode; click sun icon → light mode; refresh → mode persists |

---

### REQ-30: Retry buttons on chart errors

| Field | Detail |
|---|---|
| **Requirement** | Charts must have retry functionality when data fails to load |
| **Status** | ✅ Implemented |
| **Component** | `DashboardPage.jsx` — `ChartCard` component has `onRetry` prop, shows Retry button |
| **Verification** | Dashboard → each chart card shows "↺ Retry" button; click it → chart reloads |

---

### REQ-31: Unit tests for service layer

| Field | Detail |
|---|---|
| **Requirement** | Service functions must have unit test coverage |
| **Status** | ✅ Implemented |
| **Code** | `backend/tests/products-service.test.mjs` — 18 tests across 7 describe blocks |
| **Command** | `node --test tests/products-service.test.mjs` |
| **Verification** | `ℹ tests 18 \| pass 18 \| fail 0` |

---

## Summary Table

| Req ID | Description | Status |
|---|---|---|
| REQ-01 | CSV + XLSX upload | ✅ |
| REQ-02 | XLSX row-2 header parsing | ✅ |
| REQ-03 | ₹ and % data cleaning | ✅ |
| REQ-04 | Batch insert transactions | ✅ |
| REQ-05 | UNIQUE constraint on product_id | ✅ |
| REQ-06 | PostgreSQL products table | ✅ |
| REQ-07 | Full-text search GIN index | ✅ |
| REQ-08 | Performance indexes | ✅ |
| REQ-09 | Paginated products API | ✅ |
| REQ-10 | Category count API | ✅ |
| REQ-11 | Top reviewed API | ✅ |
| REQ-12 | Discount distribution API | ✅ |
| REQ-13 | Avg rating by category API | ✅ |
| REQ-14 | CSV export API | ✅ |
| REQ-15 | Products/category bar chart | ✅ |
| REQ-16 | Top reviewed chart | ✅ |
| REQ-17 | Discount histogram | ✅ |
| REQ-18 | Avg rating chart | ✅ |
| REQ-19 | Server-side paginated table | ✅ |
| REQ-20 | Full-text product name search | ✅ |
| REQ-21 | Category filter dropdown | ✅ |
| REQ-22 | Min rating filter | ✅ |
| REQ-23 | Column sorting | ✅ |
| REQ-24 | Redux Toolkit (all API via thunks) | ✅ |
| REQ-25 | Loading states (skeletons) | ✅ |
| REQ-26 | 400 for invalid file type | ✅ |
| REQ-27 | Rate limiting on upload | ✅ |
| REQ-28 | Chart click → table filter | ✅ |
| REQ-29 | Dark mode toggle | ✅ |
| REQ-30 | Retry buttons on charts | ✅ |
| REQ-31 | Unit tests (18 tests, 0 failures) | ✅ |

**Total: 31 / 31 requirements implemented ✅**
