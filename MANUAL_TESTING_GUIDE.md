# Manual Testing Guide

A step-by-step walkthrough for non-developer evaluators to fully test every feature of the Product Analytics Dashboard.

> **Before you start:** Make sure both the backend (port 5000) and frontend (port 5173) are running. See `QUICK_START_COMMANDS.md` if you need setup help.

---

## 0 — Open the Application

1. Open your browser and navigate to **http://localhost:5173**
2. You should see the **Dashboard** page with the title "📊 Product Analytics Dashboard"
3. The navigation bar at the top shows: **Dashboard | Data Table | Upload**

**Expected:** Charts begin loading immediately (skeleton rectangles appear briefly, then real charts appear). If you see empty blue "No data yet" messages, go to the **Upload** section first (Section 2).

---

## 1 — Dark Mode Toggle

1. Look at the top-right corner of the navigation bar
2. There is a moon icon (🌙) — click it
3. The entire application should switch to **dark mode** (dark background, light text)
4. Click the sun icon (☀️) to switch back to **light mode**
5. Refresh the browser — the mode you selected should persist

**Expected result per step:**
- Moon icon → dark background, white text, dark card surfaces ✅
- Sun icon → white/grey background, dark text ✅
- After refresh → same mode remains (persisted to localStorage) ✅

---

## 2 — Upload Page

### 2a — Navigate to Upload

1. Click **"Upload"** in the navigation bar
2. You should see a drag-and-drop zone, file type guidance, and a column format table

### 2b — Upload the XLSX file (happy path)

1. Click **"Click to browse"** OR drag the file `Assignment_-_2_Dataset.xlsx` onto the drop zone
2. The file name appears under the drop zone
3. Click **"Upload File"**
4. A **linear progress bar** appears while the upload processes
5. After ~3-10 seconds, a green success alert appears

**Expected success message:**
```
✅ File Processed Successfully
Total rows processed: 1465
Successfully inserted: 1351
Failed rows: 114
```

> Note: 114 rows fail because they are duplicate `product_id` values — this is correct behaviour (UNIQUE constraint prevents duplicates).

### 2c — Upload an invalid file type (error path)

1. Try to drag-and-drop a `.txt`, `.pdf`, or `.docx` file onto the zone
2. Before even clicking Upload, the UI shows a red error chip: **"Invalid file type. Only .csv and .xlsx are accepted."**
3. If you somehow submit it anyway, a red error alert appears

**Expected result:** Red error state before upload attempt ✅

### 2d — Upload the same file twice (duplicate handling)

1. Upload `Assignment_-_2_Dataset.xlsx` a second time
2. The upload succeeds with `inserted: 0` (all rows already exist — UNIQUE constraint)
3. No crash, no duplicate data

**Expected result:** `Total: 1465, Inserted: 0, Failed: 1465` ✅

---

## 3 — Dashboard Page — Chart Verification

Click **"Dashboard"** in the navigation bar.

### Chart 1: Products per Category

**What it shows:** A bar chart — each bar represents one product category, height = number of products in that category.

**How to verify (cross-check with Data Table):**
1. Note the height of the "Electronics" bar — should be approximately **490** products
2. Navigate to **Data Table → Category filter → select "Electronics"**
3. Check the "X products" count in the pagination footer
4. The number should match the chart

**Expected categories and approximate counts:**

| Category | Count |
|---|---|
| Electronics | 490 |
| Home&Kitchen | 448 |
| Computers&Accessories | 375 |
| OfficeProducts | 31 |
| (smaller categories) | 1–2 each |

**Chart interactivity:** Click the **"Electronics"** bar — the browser should navigate to the **Data Table** page with the Electronics filter pre-applied.

### Chart 2: Top 10 Reviewed Products

**What it shows:** A horizontal bar chart — the 10 most-reviewed products, ordered by review count.

**How to verify:**
1. The longest bar should be labeled "AmazonBasics USB Type-C" with ~426,973 reviews
2. All bars should decrease left to right (sorted descending)

**Expected result:** AmazonBasics appears at the top ✅

### Chart 3: Discount Distribution

**What it shows:** A histogram of how many products fall into each 20% discount bracket.

**Expected buckets and counts:**

| Bucket | Approx. Count |
|---|---|
| 0–20% | 7 |
| 20–40% | 19 |
| 40–60% | 141 |
| 60–80% | 802 |
| 80–100% | 358 |

**How to verify:** Most products (60–80%) should have the tallest bar — Amazon products are typically heavily discounted.

### Chart 4: Average Rating by Category

**What it shows:** Average star rating per category (scale 1–5).

**How to verify:**
1. All bars should be between **3.5 and 4.5**
2. Sorted from highest to lowest average rating
3. Click a bar → navigates to Data Table with that category pre-filtered

**Expected result:** MusicalInstruments should have the highest avg rating (~4.25) ✅

### Retry Buttons

1. All 4 chart cards have a **"↺ Retry"** button in the top-right corner (visible when not loading)
2. Click Retry on any chart
3. That chart should briefly show a loading skeleton, then reload with the same data

**Expected result:** Chart reloads and shows identical data ✅

---

## 4 — Data Table Page

Click **"Data Table"** in the navigation bar.

### 4a — Base state

- The table shows **1,351 rows** (or your uploaded count) in the footer
- Pagination: "1–20 of 1351" with Previous/Next buttons
- Columns: Product Name, Category, Price (₹), Actual Price (₹), Discount, Rating, Reviews
- Default sort: most-reviewed products appear first

### 4b — Pagination

1. Click the **Next page** (>) button
2. The table scrolls to the top and shows rows 21–40
3. Change "Rows per page" to **50** — the table should show 50 rows, total stays 1,351
4. Click the **Last page** (⏭) button — goes to final page
5. Click the **First page** (⏮) button — returns to page 1

**Expected result:** All navigation controls work, row IDs change between pages ✅

### 4c — Product Name Search

1. Click the search box labelled "Search product name..."
2. Type **"boat"** (3+ characters)
3. After ~400ms the table updates automatically (debounced)
4. A filter chip **"boat"** appears below the search box
5. The row count should show approximately **104 results**

**Expected result:** Only products containing "boat" in their name appear ✅

6. Clear the search — click the ✕ on the filter chip OR delete the text
7. All 1,351 products reappear ✅

### 4d — Category Filter

1. Click the **"Category"** dropdown
2. Select **"Electronics"**
3. The table narrows to ~490 rows, a blue "Electronics" chip appears
4. Select **"Home&Kitchen"** — updates to ~448 rows ✅
5. Select **"All Categories"** — returns to 1,351 results ✅

### 4e — Min Rating Filter

1. Click the **"Min Rating"** dropdown
2. Select **"⭐ 4.5+"**
3. The table narrows to only products rated 4.5 or higher
4. Spot-check: check the Rating column — every visible row should show ≥ 4.5 stars ✅
5. Select **"All Ratings"** — full results return ✅

### 4f — Combined Filters

1. Set: Category = **Electronics**, Min Rating = **4.0+**, Search = **"wireless"**
2. Three filter chips appear: "wireless", "Electronics" (blue), "≥ 4.0★" (amber)
3. Results are filtered by all three simultaneously
4. Remove each chip one by one — results expand at each removal ✅

### 4g — Column Sorting

1. Click the **"Reviews"** column header
2. An arrow appears — results sort by `rating_count` ascending (lowest reviews first)
3. Click again — sorts descending (highest reviews first)
4. Click the **"Rating"** column header — sorts by star rating
5. Click the **"Price (₹)"** column header — sorts by discounted price
6. All 7 columns support this behaviour ✅

### 4h — Empty State

1. In the search box type: **"XYZNOTFOUNDPRODUCT123"**
2. The table shows no rows
3. A message appears: **"🔍 No products match your filters — try clearing some filters"** ✅

### 4i — Export CSV

1. Set a filter (e.g. Category = Electronics)
2. Click the **"Export CSV (490)"** button at the top-right
3. A `.csv` file is downloaded to your computer
4. Open the file in Excel or a text editor
5. The first row should contain headers: `ID,Product ID,Product Name,Category,...`
6. Data rows below should all be Electronics products ✅
7. Without filters, click **"Export CSV (1351)"** — downloads all 1,351 rows ✅

---

## 5 — Chart → Table Interaction (Cross-Page Filtering)

1. Go to the **Dashboard** page
2. On Chart 1 ("Products per Category"), click the **"Electronics"** bar
3. You should be automatically redirected to the **Data Table** page
4. The Category filter is pre-set to **"Electronics"**
5. The table shows only Electronics products

**Expected result:** Seamless navigation with pre-applied filter ✅

---

## 6 — Error States

### 6a — Invalid file type on upload

1. On the Upload page, drag a `.pdf` or `.txt` file
2. Error appears: **"Invalid file type. Only .csv and .xlsx are accepted."** — no upload is attempted ✅

### 6b — Empty result from search

See Section 4h — the empty state message is shown ✅

### 6c — Chart retry

1. On the Dashboard, click any **"Retry"** button
2. The chart reloads ✅

---

## 7 — Full End-to-End Flow

To test the complete pipeline in order:

1. Open http://localhost:5173/upload
2. Upload `Assignment_-_2_Dataset.xlsx` → confirm `inserted: 1351`
3. Click **Dashboard** → verify all 4 charts show data
4. Click the **Electronics** bar on Chart 1 → redirects to Data Table with filter
5. Clear the filter → export all 1,351 rows as CSV → verify the download
6. Type "wireless" in search → verify ~95 results (FTS)
7. Sort by Rating ↑ → verify lowest-rated products appear first
8. Toggle **dark mode** → confirm all pages remain readable
9. Navigate to Upload → try uploading a `.txt` file → confirm 400 error

All steps should complete without any errors or broken rendering. ✅
