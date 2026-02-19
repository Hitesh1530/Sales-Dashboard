# API Documentation

Base URL: `http://localhost:5000`

All endpoints return JSON. All responses include a `"success": true/false` field.

---

## Health Check

### `GET /health`

Check that the server and database are running.

**Response**
```json
{
  "success": true,
  "message": "Server is running. products table is ready.",
  "timestamp": "2026-02-19T10:31:44.000Z"
}
```

---

## Upload

### `POST /api/upload`

Upload a CSV or XLSX file to seed or append product data.

**Rate Limit:** 10 requests per IP per 15 minutes

**Request**
- `Content-Type: multipart/form-data`
- Form field: `file` — a `.csv`, `.xlsx`, or `.xls` file (max 10 MB)

**Response — Success (200)**
```json
{
  "success": true,
  "message": "File processed successfully",
  "total": 1465,
  "inserted": 1351,
  "failed": 114,
  "skipped": 0,
  "errors": []
}
```

**Response — Invalid File Type (400)**
```json
{
  "success": false,
  "error": "Invalid file type. Only CSV and XLSX files are allowed."
}
```

**Response — File Too Large (400)**
```json
{
  "success": false,
  "error": "File too large. Maximum size is 10MB."
}
```

**Response — Rate Limited (429)**
```json
{
  "success": false,
  "error": "Too many upload requests. Please wait 15 minutes."
}
```

---

## Products

### `GET /api/products`

Retrieve paginated, filterable, and sortable product rows.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Rows per page (recommended: 10, 20, 50) |
| `search` | string | — | Full-text search on `product_name` (≥3 chars uses GIN index; 1-2 chars uses ILIKE) |
| `category` | string | — | Exact match filter on `category` |
| `minRating` | number | — | Minimum `rating` threshold (e.g. `4.5`) |
| `sortBy` | string | `rating_count` | Column to sort by. Allowed values: `product_name`, `category`, `discounted_price`, `actual_price`, `discount_percentage`, `rating`, `rating_count` |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |

**Example Requests**
```
GET /api/products
GET /api/products?search=wireless&page=1&limit=20
GET /api/products?category=Electronics&minRating=4.0
GET /api/products?sortBy=discounted_price&sortOrder=asc&limit=50
GET /api/products?search=boat&category=Electronics&minRating=3.5&sortBy=rating&sortOrder=desc
```

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 13,
      "product_id": "B07KSMBL2H",
      "product_name": "boAt Rockerz 450 Bluetooth On-Ear Headphone...",
      "category": "Electronics",
      "discounted_price": "998.00",
      "actual_price": "3990.00",
      "discount_percentage": "75.00",
      "rating": "4.1",
      "rating_count": 363713,
      "review_title": "Best value for money"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1351,
    "totalPages": 68
  }
}
```

---

### `GET /api/products/export`

Download all products matching the current filters as a CSV file.

**Query Parameters**  
Same as `GET /api/products` except `page` and `limit` are ignored (returns all matching rows).

**Response**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="products-<timestamp>.csv"`

**CSV Headers**
```
ID,Product ID,Product Name,Category,Discounted Price,Actual Price,Discount %,Rating,Reviews,Review Title
```

**Example**
```
GET /api/products/export?category=Electronics&sortBy=rating&sortOrder=desc
```

---

### `GET /api/products/categories`

Get a sorted list of all distinct category names.

**Response (200)**
```json
{
  "success": true,
  "data": [
    "Car&Motorbike",
    "Computers&Accessories",
    "Electronics",
    "Health&PersonalCare",
    "Home&Kitchen",
    "HomeImprovement",
    "MusicalInstruments",
    "OfficeProducts",
    "Toys&Games"
  ]
}
```

---

### `GET /api/products/by-category`

Count of products grouped by category, ordered by count descending.

**Response (200)**
```json
{
  "success": true,
  "data": [
    { "category": "Electronics",          "product_count": "490" },
    { "category": "Home&Kitchen",         "product_count": "448" },
    { "category": "Computers&Accessories","product_count": "375" },
    { "category": "OfficeProducts",       "product_count": "31"  },
    { "category": "MusicalInstruments",   "product_count": "2"   }
  ]
}
```

---

### `GET /api/products/top-reviewed`

Get the top N products by `rating_count` (most-reviewed).

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `10` | Number of products to return |

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "product_name": "AmazonBasics USB Type-C to Type-A...",
      "category": "Computers&Accessories",
      "rating": "4.1",
      "rating_count": 426973
    }
  ]
}
```

---

### `GET /api/products/discount-distribution`

Count of products bucketed by discount percentage into 5 ranges.

**Response (200)**
```json
{
  "success": true,
  "data": [
    { "bucket": "0-20%",   "count": "7"   },
    { "bucket": "20-40%",  "count": "19"  },
    { "bucket": "40-60%",  "count": "141" },
    { "bucket": "60-80%",  "count": "802" },
    { "bucket": "80-100%", "count": "358" }
  ]
}
```

---

### `GET /api/products/avg-rating-by-category`

Average product rating per category, ordered by avg descending.

**Response (200)**
```json
{
  "success": true,
  "data": [
    { "category": "MusicalInstruments",   "avg_rating": "4.25", "product_count": "2" },
    { "category": "Electronics",          "avg_rating": "3.98", "product_count": "490" },
    { "category": "Home&Kitchen",         "avg_rating": "3.95", "product_count": "448" },
    { "category": "Computers&Accessories","avg_rating": "3.94", "product_count": "375" }
  ]
}
```

---

## Error Responses

All error responses follow this shape:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "stack": "..." // Only included in NODE_ENV=development
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Bad request — invalid file type, file too large, validation failure |
| `404` | Route not found |
| `429` | Too many requests — upload rate limit exceeded |
| `500` | Internal server error — unexpected failure |

---

## Database Schema

```sql
CREATE TABLE products (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          TEXT NOT NULL,
    product_name        TEXT NOT NULL,
    category            TEXT NOT NULL,
    discounted_price    NUMERIC(10, 2),
    actual_price        NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2),
    rating              NUMERIC(3, 1),
    rating_count        INTEGER,
    review_title        TEXT,
    review_content      TEXT,
    img_link            TEXT,
    product_link        TEXT,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    name_tsv            TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(product_name, ''))) STORED
);

-- Unique constraint: one row per product_id
CREATE UNIQUE INDEX idx_products_product_id_unique ON products(product_id);

-- Full-text search
CREATE INDEX idx_products_name_tsv   ON products USING gin(name_tsv);

-- Filter/sort performance
CREATE INDEX idx_products_category   ON products(category);
CREATE INDEX idx_products_rating     ON products(rating);
CREATE INDEX idx_products_rating_count ON products(rating_count);
CREATE INDEX idx_products_discount   ON products(discount_percentage);
```
