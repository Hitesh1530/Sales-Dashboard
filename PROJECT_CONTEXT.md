# Sales & Revenue Analytics Dashboard – Functional Specification

## 🎯 Objective
Build a full-stack analytics dashboard that allows users to:

- Upload sales data via CSV/Excel
- Store & process it in PostgreSQL
- Analyze revenue trends
- Filter by product, category, region, and date
- Visualize insights using charts

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- pg (node-postgres)
- Multer → file upload
- ExcelJS / CSV parser → file processing
- Joi → validation
- Jest + Supertest → testing

### Frontend
- React
- MUI
- Redux Toolkit
- Axios
- ApexCharts (or Recharts)

---

## 🗃️ Core Data Model

### sales table

| column        | type            |
|--------------|-----------------|
id              | bigserial PK
sale_date       | date
order_id        | text
product_id      | text
product_name    | text
category        | text
region          | text
units           | integer
unit_price      | numeric(12,2)
revenue         | generated column
created_at      | timestamptz

---

## ⚙️ Backend Functional Requirements

### File Upload API
POST /api/upload

- Accept CSV/XLSX
- Validate schema
- Batch insert
- Transactional safety
- Return:
  { inserted, failed, errors }

---

### Analytics APIs

#### 1. Overview
GET /api/overview?start=&end=

Returns:
- total revenue
- total units
- total orders

---

#### 2. Revenue Trends
GET /api/trends?start=&end=&interval=daily|weekly|monthly

Returns time-series revenue.

---

#### 3. Product-wise Sales
GET /api/by-product

Aggregation:
SUM(revenue), SUM(units)

---

#### 4. Region-wise Revenue
GET /api/by-region

---

#### 5. Filtered Sales (table view)
GET /api/sales

Query params:
- product
- category
- region
- start
- end
- page
- limit

---

## 📊 Frontend Functional Requirements

### Upload Page
- File picker
- Upload progress
- Import summary

### Dashboard Page

#### Filters
- Date range
- Category
- Region

#### Charts
- Line → revenue trend
- Bar → product sales
- Pie → region revenue

---

## 🧠 State Management

Redux slices:

salesSlice:
- filters
- overview
- trends
- products
- regions
- loading
- error

---

## ❗ Error Handling Rules

Backend:
- Standard response format
- 400 → validation
- 500 → server error

Frontend:
- Global loader
- Error alerts
- Empty states

---

## 🚀 Deployment Targets

Frontend → Vercel  
Backend → Render / Railway  
Database → PostgreSQL

---

## 📈 Performance Strategy (Future Scope)

- Index on sale_date
- Redis caching for heavy aggregations
- PostgreSQL COPY for large imports
- Table partitioning by month

---

## 🧪 Testing Scope

Backend:
- upload API
- trends API

Frontend:
- Upload component render
- Dashboard data flow

---

## 📦 Deliverables

- Clean folder structure
- Environment config
- README with setup steps
- Live deployed links (bonus)
