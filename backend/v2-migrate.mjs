// v2-migrate.mjs — add unique constraint + tsvector to existing products table (no data loss)
import pool from './src/db/connection.js';

console.log('🔄 Running v2 migration...');

// Step 1: Remove duplicate product_ids (keep the one with highest rating_count)
console.log('\n1. Removing duplicate product_ids...');
const before = await pool.query('SELECT COUNT(*) FROM products');
console.log('   Before:', before.rows[0].count, 'rows');

await pool.query(`
    DELETE FROM products
    WHERE id NOT IN (
        SELECT DISTINCT ON (product_id) id
        FROM products
        ORDER BY product_id, rating_count DESC NULLS LAST, id ASC
    )
`);

const after = await pool.query('SELECT COUNT(*) FROM products');
console.log('   After:', after.rows[0].count, 'rows', '(removed', parseInt(before.rows[0].count) - parseInt(after.rows[0].count), 'duplicates)');

// Step 2: Add tsvector generated column (if not already there)
console.log('\n2. Adding name_tsv column...');
await pool.query(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS name_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(product_name, ''))) STORED
`);
console.log('   ✅ name_tsv column added');

// Step 3: Add unique index on product_id
console.log('\n3. Adding UNIQUE index on product_id...');
await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_id_unique ON products(product_id)
`);
console.log('   ✅ UNIQUE index on product_id created');

// Step 4: Add GIN index for FTS
console.log('\n4. Adding GIN index on name_tsv...');
await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_name_tsv ON products USING gin(name_tsv)
`);
console.log('   ✅ GIN FTS index created');

// Step 5: Ensure other indexes exist
await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_rating_count ON products(rating_count)`);
await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage)`);
console.log('   ✅ All standard indexes ensured');

// Step 6: Verify
const count = await pool.query('SELECT COUNT(*) FROM products');
const cats = await pool.query('SELECT category, COUNT(*) cnt FROM products GROUP BY category ORDER BY cnt DESC');
console.log('\n✅ Migration complete!');
console.log('Total products:', count.rows[0].count);
console.log('Categories:');
cats.rows.forEach(r => console.log(' ', r.category + ':', r.cnt));

// Step 7: Test FTS
const fts = await pool.query(`SELECT COUNT(*) FROM products WHERE name_tsv @@ plainto_tsquery('english', 'wireless')`);
console.log('\n🔍 FTS test (wireless):', fts.rows[0].count, 'results');

await pool.end();
