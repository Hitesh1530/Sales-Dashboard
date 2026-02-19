import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { getClient } from '../db/connection.js';

/**
 * Parse a raw cell value from ExcelJS (handles richText, hyperlinks, numbers, etc.)
 */
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

/**
 * Clean numeric string — removes ₹, %, commas, spaces
 */
const toNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const cleaned = String(val).replace(/[₹,%\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
};

/**
 * Parse integer (handles comma-formatted numbers like "7,928")
 */
const toInt = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const cleaned = String(val).replace(/[,\s]/g, '');
    const n = parseInt(cleaned);
    return isNaN(n) ? null : n;
};

/**
 * Extract top-level category from category path like "Computers|Accessories|Cables"
 * → "Computers"
 */
const topCategory = (raw) => {
    if (!raw) return 'Uncategorized';
    return String(raw).split('|')[0].trim().substring(0, 80);
};

/**
 * Parse Amazon XLSX — row 1 = data (amazon URLs), row 2 = actual headers, rows 3+ = data
 */
const parseXLSX = async (filePath) => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];

    // Detect header row: row 2 in the Amazon dataset
    // Row 1 has all "amazon" hyperlinks, row 2 has real column names
    const headerRow = ws.getRow(2);
    const headerMap = {};
    const maxCol = Math.min(ws.columnCount, 20); // cap at 20 to prevent out-of-bounds
    for (let c = 1; c <= maxCol; c++) {
        const v = rawCell(headerRow.getCell(c));
        if (v && v !== 'amazon') headerMap[v.trim().toLowerCase()] = c;
    }

    const records = [];
    const errors = [];

    for (let r = 3; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const get = (colName) => {
            const col = headerMap[colName];
            return col ? rawCell(row.getCell(col)) : null;
        };

        const product_id = get('product_id');
        const product_name = get('product_name');
        if (!product_id || !product_name) continue; // skip empty/header rows

        const category = topCategory(get('category'));
        const discounted_price = toNum(get('discounted_price'));
        const actual_price = toNum(get('actual_price'));
        let discount_pct = toNum(get('discount_percentage'));
        if (discount_pct !== null && discount_pct <= 1) discount_pct = discount_pct * 100; // convert 0.58 → 58
        const rating = toNum(get('rating'));
        const rating_count = toInt(get('rating_count'));
        const review_title = get('review_title') ? String(get('review_title')).substring(0, 500) : null;
        const review_content = get('review_content') ? String(get('review_content')).substring(0, 2000) : null;
        const img_link = get('img_link') ? String(get('img_link')).substring(0, 500) : null;
        const product_link = get('product_link') ? String(get('product_link')).substring(0, 500) : null;

        // Validate required fields
        if (!category) {
            errors.push({ row: r, error: 'Missing category' });
            continue;
        }

        records.push([
            product_id.substring(0, 40),
            product_name.substring(0, 500),
            category,
            discounted_price,
            actual_price,
            discount_pct,
            rating,
            rating_count,
            review_title,
            review_content,
            img_link,
            product_link,
        ]);
    }

    return { records, errors };
};

/**
 * Parse CSV file (expects: product_id, product_name, category, discounted_price,
 *   actual_price, discount_percentage, rating, rating_count)
 */
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const records = [];
        const errors = [];
        let rowNum = 1;

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                rowNum++;
                const product_id = (row.product_id || '').trim();
                const product_name = (row.product_name || '').trim();
                if (!product_id || !product_name) return;

                records.push([
                    product_id.substring(0, 40),
                    product_name.substring(0, 500),
                    topCategory(row.category),
                    toNum(row.discounted_price),
                    toNum(row.actual_price),
                    toNum(row.discount_percentage),
                    toNum(row.rating),
                    toInt(row.rating_count),
                    (row.review_title || '').substring(0, 500) || null,
                    (row.review_content || '').substring(0, 2000) || null,
                    null, // img_link not in CSV
                    null, // product_link
                ]);
            })
            .on('error', reject)
            .on('end', () => resolve({ records, errors }));
    });
};

/**
 * Batch insert records into products table within a transaction
 */
const batchInsert = async (records) => {
    const client = await getClient();
    let inserted = 0;
    const errors = [];

    try {
        await client.query('BEGIN');

        const BATCH_SIZE = 100;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const valuePlaceholders = batch
                .map((_, idx) => {
                    const base = idx * 12;
                    return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12})`;
                })
                .join(',');

            const flatValues = batch.flat();
            const sql = `
                INSERT INTO products (
                    product_id, product_name, category,
                    discounted_price, actual_price, discount_percentage,
                    rating, rating_count, review_title, review_content,
                    img_link, product_link
                ) VALUES ${valuePlaceholders}
            `;
            const result = await client.query(sql, flatValues);
            inserted += result.rowCount;
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        errors.push({ error: err.message });
    } finally {
        client.release();
    }

    return { inserted, errors };
};

/**
 * Main entry point: process an uploaded file
 */
export const processUpload = async (file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let parseResult;

    if (ext === '.csv') {
        parseResult = await parseCSV(file.path);
    } else if (ext === '.xlsx' || ext === '.xls') {
        parseResult = await parseXLSX(file.path);
    } else {
        fs.unlink(file.path, () => { });
        throw new Error('Unsupported file format. Use CSV or XLSX.');
    }

    const { records, errors: parseErrors } = parseResult;

    let insertResult = { inserted: 0, errors: [] };
    if (records.length > 0) {
        insertResult = await batchInsert(records);
    }

    // Clean up uploaded file
    fs.unlink(file.path, () => { });

    const total = records.length + parseErrors.length;
    return {
        total,
        inserted: insertResult.inserted,
        failed: total - insertResult.inserted,
        errors: [...parseErrors, ...insertResult.errors],
    };
};
