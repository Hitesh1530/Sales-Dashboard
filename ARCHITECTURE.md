# Architecture Overview

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  BROWSER  (http://localhost:5173)                                   │
│                                                                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ DashboardPage│  │  DataTablePage   │  │    UploadPage      │  │
│  │  4 ApexCharts│  │ Table+Sort+Filter│  │ Drag-drop + Axios  │  │
│  └──────┬───────┘  └───────┬──────────┘  └────────┬───────────┘  │
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            │                                       │
│             ┌──────────────▼──────────────┐                       │
│             │      Redux Toolkit Store    │                       │
│             │   productsSlice (7 thunks)  │                       │
│             │  fetchProducts              │                       │
│             │  fetchCategories            │                       │
│             │  fetchByCategory            │                       │
│             │  fetchTopReviewed           │                       │
│             │  fetchDiscountDistribution  │                       │
│             │  fetchAvgRatingByCategory   │                       │
│             │  uploadFile                 │                       │
│             └──────────────┬──────────────┘                       │
│                            │ Axios (baseURL: /api via Vite proxy)  │
└────────────────────────────┼───────────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼───────────────────────────────────────┐
│  EXPRESS SERVER  (http://localhost:5000)                            │
│                                                                    │
│  ─── Middleware Stack ──────────────────────────────────────────   │
│  cors({ origin: CORS_ORIGIN })                                     │
│  express.json()    express.urlencoded()                            │
│  upload-rate-limit (10/IP/15 min — upload route only)             │
│  error-handler (central 4xx/5xx formatter)                         │
│                                                                    │
│  ─── Routes ────────────────────────────────────────────────────   │
│  POST /api/upload              → upload-routes.js                  │
│  GET  /api/products            → products-routes.js                │
│  GET  /api/products/export     → products-routes.js                │
│  GET  /api/products/categories → products-routes.js                │
│  GET  /api/products/by-category          → products-routes.js      │
│  GET  /api/products/top-reviewed         → products-routes.js      │
│  GET  /api/products/discount-distribution→ products-routes.js      │
│  GET  /api/products/avg-rating-by-category→products-routes.js      │
│                                                                    │
│  ─── Service Layer ─────────────────────────────────────────────   │
│  upload-service.js                                                 │
│    ├─ parseXLSX()   (ExcelJS, row 2 = headers)                     │
│    ├─ parseCSV()    (csv-parser streaming)                         │
│    ├─ cleanRow()    (₹ and % stripping, toNum / toInt helpers)     │
│    └─ batchInsert() (100 rows per transaction)                     │
│                                                                    │
│  products-service.js                                               │
│    ├─ getProducts()             (FTS + filters + sort + paginate)  │
│    ├─ getAllProductsForExport()  (same but no LIMIT)                │
│    ├─ getProductsByCategory()   (COUNT GROUP BY category)          │
│    ├─ getTopReviewed()          (ORDER BY rating_count DESC)        │
│    ├─ getDiscountDistribution() (CASE WHEN bucket grouping)         │
│    ├─ getCategoryAvgRating()    (AVG(rating) GROUP BY category)    │
│    └─ getCategories()           (DISTINCT category)                │
│                                                                    │
│  ─── DB Layer ──────────────────────────────────────────────────   │
│  connection.js: pg.Pool (max 20 clients)                           │
│  query()        → wrapped pg.Pool.query + duration logging         │
│  getClient()    → raw client for transactions                      │
└────────────────────────────┬───────────────────────────────────────┘
                             │ pg (TCP)
┌────────────────────────────▼───────────────────────────────────────┐
│  PostgreSQL 18   database: sales_dashboard                         │
│                                                                    │
│  TABLE: products (1,351 rows)                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ id  BIGSERIAL PK                                             │  │
│  │ product_id  TEXT  ← UNIQUE INDEX                             │  │
│  │ product_name TEXT                                            │  │
│  │ category TEXT ← B-tree INDEX                                 │  │
│  │ discounted_price NUMERIC(10,2)                               │  │
│  │ actual_price NUMERIC(10,2)                                   │  │
│  │ discount_percentage NUMERIC(5,2) ← B-tree INDEX              │  │
│  │ rating NUMERIC(3,1)    ← B-tree INDEX                        │  │
│  │ rating_count INTEGER   ← B-tree INDEX                        │  │
│  │ review_title TEXT                                            │  │
│  │ review_content TEXT                                          │  │
│  │ img_link TEXT                                                │  │
│  │ product_link TEXT                                            │  │
│  │ created_at TIMESTAMPTZ                                       │  │
│  │ name_tsv TSVECTOR GENERATED ← GIN INDEX (full-text search)  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow — File Upload → UI Charts

```
1. USER drags XLSX onto Upload Page
        │
        ▼
2. React dispatches uploadFile thunk
   → Axios POST /api/upload  (multipart/form-data)
        │
        ▼
3. Multer fileFilter validates extension (.csv/.xlsx only)
   → If rejected: returns 400 JSON error immediately
        │
        ▼
4. upload-controller calls processUpload(filePath)
        │
        ▼
5. upload-service.parseXLSX():
   - ExcelJS reads workbook
   - Row 1  = Amazon internal header (skipped)
   - Row 2  = actual column headers
   - Row 3… = product data rows
   - Each row cleaned: ₹ stripped, % stripped, toNum(), topCategory()
        │
        ▼
6. batchInsert(rows):
   - Chunks rows into groups of 100
   - For each chunk: BEGIN; INSERT … ON CONFLICT (product_id) DO NOTHING; COMMIT
   - Tracks inserted / failed counts
        │
        ▼
7. Upload-controller returns:
   { total, inserted, failed, errors[] }
        │
        ▼
8. Redux uploadFile.fulfilled updates state
   UI shows success Alert with row counts
        │
        ▼
9. User navigates to Dashboard
   → useEffect dispatches all 4 fetch thunks (Axios GET)
   → Backend runs aggregate SQL queries on products table
   → Redux fulfills byCategory / topReviewed / discountDistribution / avgRating state
   → ApexCharts render with real data

10. User clicks a bar on "Products per Category" chart
    → DashboardPage.handleCategoryBarClick()
    → navigate('/data?category=Electronics')
    → DataTablePage reads URL param on mount
    → Pre-populates category filter
    → Dispatches fetchProducts({ category: 'Electronics' })
    → Table shows filtered results
```

---

## Redux State Shape (`productsSlice`)

```js
{
  // Paginated table
  products:          [],        // rows from GET /api/products
  pagination:        { page: 1, limit: 20, total: 0, totalPages: 0 },
  productsLoading:   false,
  productsError:     null,

  // Filter state (shared between table and URL params)
  filters:           { search: '', category: '', minRating: '', limit: 20 },

  // Categories dropdown
  categories:        [],
  categoriesLoading: false,

  // Dashboard charts
  byCategory:            [],    // [ { category, product_count } ]
  byCategoryLoading:     false,

  topReviewed:           [],    // [ { product_name, category, rating, rating_count } ]
  topReviewedLoading:    false,

  discountDistribution:  [],    // [ { bucket, count } ]
  discountLoading:       false,

  avgRatingByCategory:   [],    // [ { category, avg_rating, product_count } ]
  avgRatingLoading:      false,

  // Upload
  uploadLoading:         false,
  uploadResult:          null,  // { total, inserted, failed, errors }
  uploadError:           null,
}
```

---

## Frontend Routing

| Path | Component | Purpose |
|---|---|---|
| `/` | `DashboardPage` | 4 interactive ApexCharts |
| `/data` | `DataTablePage` | Paginated table + filters + CSV export |
| `/data?category=X` | `DataTablePage` | Pre-filtered from chart click |
| `/upload` | `UploadPage` | File upload with progress |

All routes are children of `MainLayout` (AppBar + footer).

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| SQL Injection via `sortBy` | Whitelist of 7 allowed column names in `products-service.js` |
| SQL Injection via search | Parameterised query (`$1`, `$2`, …) — never string interpolation |
| File type bypass | Extension + MIME type checked in multer `fileFilter` |
| Upload abuse | `express-rate-limit` — 10 uploads per IP per 15 minutes |
| File size abuse | `multer limits.fileSize = 10 MB` |
| CORS | Only `CORS_ORIGIN` env value is whitelisted |
