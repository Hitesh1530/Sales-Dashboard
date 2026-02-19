import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import pool from '../db/connection.js';

// ─── Cell / value helpers ────────────────────────────────────────────────────

const rawCell = (cell) => {
    const v = cell.value;
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.toISOString().split('T')[0];
    if (typeof v === 'object') {
        if (v.richText) return v.richText.map((t) => t.text).join('').trim();
        if (v.text !== undefined) return String(v.text).trim();
        if (v.formula !== undefined) return v.result !== undefined ? String(v.result).trim() : null;
        if (v.hyperlink !== undefined) return v.text ?? String(v.hyperlink);
    }
    return String(v).trim();
};

/** Strip ₹, %, commas — return float or null */
const toNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(String(val).replace(/[₹,%\s]/g, ''));
    return isNaN(n) ? null : n;
};

/** Parse comma-formatted integers like "7,928" → 7928 */
const toInt = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseInt(String(val).replace(/[,\s]/g, ''));
    return isNaN(n) ? null : n;
};

/** "Computers|Accessories|Cables" → "Computers" */
const topCategory = (raw) => {
    if (!raw) return 'Uncategorized';
    return String(raw).split('|')[0].trim().substring(0, 80);
};

// ─── Parsers ─────────────────────────────────────────────────────────────────

const parseXLSX = async (filePath) => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];

    // Row 1 = amazon urls (skip), Row 2 = real headers, Row 3+ = data
    const headerRow = ws.getRow(2);
    const headerMap = {};
    const maxCol = Math.min(ws.columnCount, 20);
    for (let c = 1; c <= maxCol; c++) {
        const v = rawCell(headerRow.getCell(c));
        if (v && v !== 'amazon') headerMap[v.trim().toLowerCase()] = c;
    }

    const records = [];
    const errors = [];

    for (let r = 3; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const get = (col) => (headerMap[col] ? rawCell(row.getCell(headerMap[col])) : null);

        const product_id = get('product_id');
        const product_name = get('product_name');
        if (!product_id || !product_name) continue;

        let discount_pct = toNum(get('discount_percentage'));
        if (discount_pct !== null && discount_pct <= 1) discount_pct = Math.round(discount_pct * 100);

        records.push({
            product_id: product_id.substring(0, 40),
            product_name: product_name.substring(0, 500),
            category: topCategory(get('category')),
            discounted_price: toNum(get('discounted_price')),
            actual_price: toNum(get('actual_price')),
            discount_percentage: discount_pct,
            rating: toNum(get('rating')),
            rating_count: toInt(get('rating_count')),
            review_title: (get('review_title') || '').substring(0, 500) || null,
            review_content: (get('review_content') || '').substring(0, 2000) || null,
            img_link: (get('img_link') || '').substring(0, 500) || null,
            product_link: (get('product_link') || '').substring(0, 500) || null,
        });
    }

    return { records, errors };
};

const parseCSV = (filePath) =>
    new Promise((resolve, reject) => {
        const records = [];
        const errors = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                const product_id = (row.product_id || '').trim();
                const product_name = (row.product_name || '').trim();
                if (!product_id || !product_name) return;

                let discount_pct = toNum(row.discount_percentage);
                if (discount_pct !== null && discount_pct <= 1) discount_pct = Math.round(discount_pct * 100);

                records.push({
                    product_id: product_id.substring(0, 40),
                    product_name: product_name.substring(0, 500),
                    category: topCategory(row.category),
                    discounted_price: toNum(row.discounted_price),
                    actual_price: toNum(row.actual_price),
                    discount_percentage: discount_pct,
                    rating: toNum(row.rating),
                    rating_count: toInt(row.rating_count),
                    review_title: (row.review_title || '').substring(0, 500) || null,
                    review_content: (row.review_content || '').substring(0, 2000) || null,
                    img_link: null,
                    product_link: null,
                });
            })
            .on('error', reject)
            .on('end', () => resolve({ records, errors }));
    });

// ─── Deduplication ───────────────────────────────────────────────────────────

/**
 * Remove duplicate product_ids keeping the first occurrence.
 * This is REQUIRED before batch insert — PostgreSQL's ON CONFLICT
 * cannot resolve two rows with the same key in a single INSERT statement.
 */
const deduplicateByProductId = (records) => {
    const seen = new Set();
    const unique = [];
    let dupes = 0;
    for (const r of records) {
        if (seen.has(r.product_id)) {
            dupes++;
        } else {
            seen.add(r.product_id);
            unique.push(r);
        }
    }
    return { unique, dupes };
};

// ─── Batch upsert ────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

/**
 * Insert records in independent batches of BATCH_SIZE.
 * Each batch is its own transaction so a failure in one batch
 * does NOT roll back rows already inserted.
 * ON CONFLICT DO NOTHING handles rows that already exist in the DB.
 */
const batchInsert = async (records) => {
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const valuePlaceholders = batch
                .map((_, idx) => {
                    const b = idx * 12;
                    return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12})`;
                })
                .join(',');

            const flatValues = batch.flatMap((r) => [
                r.product_id, r.product_name, r.category,
                r.discounted_price, r.actual_price, r.discount_percentage,
                r.rating, r.rating_count,
                r.review_title, r.review_content,
                r.img_link, r.product_link,
            ]);

            const result = await client.query(
                `INSERT INTO products (
                    product_id, product_name, category,
                    discounted_price, actual_price, discount_percentage,
                    rating, rating_count, review_title, review_content,
                    img_link, product_link
                ) VALUES ${valuePlaceholders}
                ON CONFLICT (product_id) DO NOTHING`,
                flatValues
            );

            await client.query('COMMIT');
            inserted += result.rowCount;
            skipped += batch.length - result.rowCount; // rows skipped by ON CONFLICT
        } catch (err) {
            await client.query('ROLLBACK');
            errors.push(err.message);
            skipped += batch.length;
        } finally {
            client.release();
        }
    }

    return { inserted, skipped, errors };
};

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * processUpload — accepts EITHER a multer file object OR a plain file path string.
 *
 * Multer object (from upload route):
 *   { originalname: 'foo.xlsx', path: '/abs/path/foo.xlsx' }
 *
 * Plain path string (from migrate.js / CLI):
 *   '/abs/path/Assignment_-_2_Dataset.xlsx'
 */
export const processUpload = async (fileOrPath, shouldCleanup = true) => {
    // Normalise: accept multer object or plain string path
    let filePath, ext, cleanup;
    if (typeof fileOrPath === 'string') {
        filePath = fileOrPath;
        ext = path.extname(filePath).toLowerCase();
        cleanup = false; // don't delete bundled dataset
    } else {
        filePath = fileOrPath.path;
        ext = path.extname(fileOrPath.originalname || fileOrPath.path).toLowerCase();
        cleanup = shouldCleanup;
    }

    let parseResult;
    if (ext === '.csv') {
        parseResult = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        parseResult = await parseXLSX(filePath);
    } else {
        if (cleanup) fs.unlink(filePath, () => { });
        throw new Error('Unsupported file format. Use CSV or XLSX.');
    }

    const { records: parsed, errors: parseErrors } = parseResult;

    // Step 1: deduplicate within the file itself
    const { unique: records, dupes } = deduplicateByProductId(parsed);

    // Step 2: insert, skipping rows already in DB (ON CONFLICT DO NOTHING)
    let insertResult = { inserted: 0, skipped: 0, errors: [] };
    if (records.length > 0) {
        insertResult = await batchInsert(records);
    }

    // Cleanup temp upload file (not the bundled dataset)
    if (cleanup) fs.unlink(filePath, () => { });

    const totalParsed = parsed.length + parseErrors.length;
    const totalSkipped = dupes + insertResult.skipped;

    return {
        total: totalParsed,
        inserted: insertResult.inserted,
        skipped: totalSkipped,   // in-file dupes + already-in-DB rows
        failed: insertResult.errors.length > 0 ? totalParsed - insertResult.inserted : 0,
        errors: [
            ...parseErrors,
            ...insertResult.errors.map((e) => ({ error: e })),
        ],
    };
};
