/**
 * src/migrate.js — Safe, idempotent boot script
 *
 * Run once before starting the server (in production AND local dev).
 * It is safe to run on every deploy / restart because every step is
 * guarded with IF NOT EXISTS / conditional checks.
 *
 * What it does:
 *  1. Creates the products table + all indexes (idempotent)
 *  2. Applies v2 schema upgrades: name_tsv tsvector column + UNIQUE index (safe to re-run)
 *  3. If the table is empty AND the bundled XLSX dataset is present → auto-seeds data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/connection.js';
import { initializeDatabase } from './db/init.js';
import { processUpload } from './services/upload-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the bundled Amazon dataset (committed to the repo root)
const DATASET_PATH = path.join(__dirname, '..', '..', 'Assignment_-_2_Dataset.xlsx');

async function run() {
    console.log('\n🚀 Starting boot sequence...\n');

    // ── Step 1: Ensure schema exists (CREATE TABLE / INDEX IF NOT EXISTS) ───
    console.log('1️⃣  Initialising database schema...');
    await initializeDatabase();
    console.log('   ✅ Schema OK\n');

    // ── Step 2: Apply v2 upgrades (safe to run multiple times) ───────────────
    console.log('2️⃣  Applying schema upgrades (tsvector + UNIQUE index)...');

    await pool.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS name_tsv
            TSVECTOR GENERATED ALWAYS AS (
                to_tsvector('english', coalesce(product_name, ''))
            ) STORED
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_id_unique
        ON products(product_id)
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_products_name_tsv
        ON products USING gin(name_tsv)
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category        ON products(category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_rating          ON products(rating)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_rating_count    ON products(rating_count)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_discount        ON products(discount_percentage)`);

    console.log('   ✅ Schema upgrades applied\n');

    // ── Step 3: Seed data only if the products table is empty ────────────────
    console.log('3️⃣  Checking for existing data...');
    const { rows } = await pool.query('SELECT COUNT(*) AS cnt FROM products');
    const count = parseInt(rows[0].cnt);

    if (count > 0) {
        console.log(`   ℹ️  Table already has ${count} products — skipping seed\n`);
    } else if (fs.existsSync(DATASET_PATH)) {
        console.log(`   📂 Table is empty. Seeding from dataset...`);
        const result = await processUpload(DATASET_PATH);
        console.log(
            `   ✅ Seeded: ${result.inserted} inserted, ${result.failed} skipped/failed\n`
        );
    } else {
        console.log(
            '   ⚠️  Table is empty and dataset file not found.\n' +
            '       Upload data via the UI at /upload once the server starts.\n'
        );
    }

    const final = await pool.query('SELECT COUNT(*) AS cnt FROM products');
    console.log(`📊 Products in database: ${final.rows[0].cnt}`);
    console.log('\n✅ Boot sequence complete — starting server...\n');
}

// Export so server.js can call it, or run standalone via the CLI scripts
export { run as migrate };

// When called directly: node src/migrate.js
// (used by npm run setup)
if (
    process.argv[1] &&
    (process.argv[1].endsWith('migrate.js') || process.argv[1].endsWith('migrate'))
) {
    run()
        .then(() => {
            console.log('Migration complete. Exiting.\n');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Boot sequence failed:', err.message);
            process.exit(1);
        });
}
