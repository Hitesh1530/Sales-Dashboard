-- Product Ratings & Review Analytics Schema (v2 — 10/10 improvements)

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    discounted_price NUMERIC(10, 2),
    actual_price NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2),
    rating NUMERIC(3, 1),
    rating_count INTEGER,
    review_title TEXT,
    review_content TEXT,
    img_link TEXT,
    product_link TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Full-text search vector (auto-maintained)
    name_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(product_name, ''))) STORED
);

-- Unique constraint: one row per product_id (prevents duplicate uploads)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_id_unique ON products(product_id);

-- Full-text search GIN index
CREATE INDEX IF NOT EXISTS idx_products_name_tsv ON products USING gin(name_tsv);

-- Standard B-tree indexes for filters/sorts
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_rating_count ON products(rating_count);
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage);
