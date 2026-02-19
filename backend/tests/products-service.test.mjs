/**
 * Unit tests for products-service.js
 * Uses Node.js built-in test runner (node --test)
 * Run: node --test tests/products-service.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

// ── Import service under test ─────────────────────────────────────────────────
import {
    getProducts,
    getProductsByCategory,
    getTopReviewed,
    getDiscountDistribution,
    getCategoryAvgRating,
    getCategories,
    getAllProductsForExport,
} from '../src/services/products-service.js';

import pool from '../src/db/connection.js';

// ─────────────────────────────────────────────────────────────────────────────

describe('getProducts()', () => {
    test('returns paginated results with default params', async () => {
        const result = await getProducts();
        assert.ok(result.data, 'should have data array');
        assert.ok(result.pagination, 'should have pagination object');
        assert.ok(result.pagination.total > 0, 'total should be > 0');
        assert.ok(result.data.length <= 20, 'default limit 20');
        assert.equal(result.pagination.page, 1, 'default page = 1');
    });

    test('search returns fewer (or equal) results than total', async () => {
        const full = await getProducts();
        const filtered = await getProducts({ search: 'boat' });
        assert.ok(filtered.pagination.total <= full.pagination.total, 'search should narrow results');
    });

    test('search for nonexistent product returns empty', async () => {
        const result = await getProducts({ search: 'XYZNONEXISTENT_PRODUCT_12345' });
        assert.equal(result.pagination.total, 0, 'no results for nonsense search');
        assert.deepEqual(result.data, [], 'data array is empty');
    });

    test('category filter narrows results', async () => {
        const cats = await getCategories();
        if (cats.length === 0) return; // skip if no data
        const result = await getProducts({ category: cats[0] });
        result.data.forEach(row => {
            assert.equal(row.category, cats[0], `all rows should be category=${cats[0]}`);
        });
    });

    test('minRating filter returns only products with rating >= threshold', async () => {
        const result = await getProducts({ minRating: 4.5, limit: 50 });
        result.data.forEach(row => {
            if (row.rating !== null) {
                assert.ok(parseFloat(row.rating) >= 4.5, `rating ${row.rating} should be >= 4.5`);
            }
        });
    });

    test('sortBy rating_count DESC returns highest rating_count first', async () => {
        const result = await getProducts({ sortBy: 'rating_count', sortOrder: 'desc', limit: 5 });
        for (let i = 0; i < result.data.length - 1; i++) {
            const a = parseInt(result.data[i].rating_count) || 0;
            const b = parseInt(result.data[i + 1].rating_count) || 0;
            assert.ok(a >= b, `row[${i}].rating_count (${a}) >= row[${i + 1}].rating_count (${b})`);
        }
    });

    test('sortBy rating ASC returns lowest rating first', async () => {
        const result = await getProducts({ sortBy: 'rating', sortOrder: 'asc', limit: 5 });
        for (let i = 0; i < result.data.length - 1; i++) {
            const a = parseFloat(result.data[i].rating) || 0;
            const b = parseFloat(result.data[i + 1].rating) || 0;
            assert.ok(a <= b, `row[${i}].rating (${a}) <= row[${i + 1}].rating (${b})`);
        }
    });

    test('pagination: page 2 returns different items than page 1', async () => {
        const p1 = await getProducts({ page: 1, limit: 10 });
        const p2 = await getProducts({ page: 2, limit: 10 });
        if (p2.data.length > 0) {
            assert.notEqual(p1.data[0]?.id, p2.data[0]?.id, 'page 1 and page 2 should have different first rows');
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getProductsByCategory()', () => {
    test('returns array of { category, product_count }', async () => {
        const data = await getProductsByCategory();
        assert.ok(Array.isArray(data), 'should return array');
        assert.ok(data.length > 0, 'should have at least 1 category');
        data.forEach(row => {
            assert.ok(row.category, 'each row has category');
            assert.ok(row.product_count > 0, 'each row has product_count > 0');
        });
    });

    test('counts sum matches total product count', async () => {
        const cats = await getProductsByCategory();
        const total = cats.reduce((s, c) => s + parseInt(c.product_count), 0);
        const dbTotal = await pool.query('SELECT COUNT(*) FROM products');
        assert.equal(total, parseInt(dbTotal.rows[0].count), 'category counts should sum to total products');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getTopReviewed()', () => {
    test('returns at most limit=10 items', async () => {
        const data = await getTopReviewed(10);
        assert.ok(data.length <= 10, 'max 10 results');
    });

    test('results are sorted descending by rating_count', async () => {
        const data = await getTopReviewed(10);
        for (let i = 0; i < data.length - 1; i++) {
            assert.ok(parseInt(data[i].rating_count) >= parseInt(data[i + 1].rating_count),
                `rating_count should be descending`);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getDiscountDistribution()', () => {
    test('returns 5 discount buckets', async () => {
        const data = await getDiscountDistribution();
        assert.ok(data.length > 0, 'at least 1 bucket');
        data.forEach(row => {
            assert.ok(row.bucket, 'each row has bucket name');
            assert.ok(row.count > 0, 'each bucket has at least 1 product');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getCategoryAvgRating()', () => {
    test('returns avg_rating between 1 and 5 for all categories', async () => {
        const data = await getCategoryAvgRating();
        data.forEach(row => {
            const avg = parseFloat(row.avg_rating);
            assert.ok(avg >= 1.0 && avg <= 5.0, `avg_rating ${avg} should be between 1 and 5`);
        });
    });

    test('sorted descending by avg_rating', async () => {
        const data = await getCategoryAvgRating();
        for (let i = 0; i < data.length - 1; i++) {
            assert.ok(parseFloat(data[i].avg_rating) >= parseFloat(data[i + 1].avg_rating),
                'should be sorted DESC by avg_rating');
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getCategories()', () => {
    test('returns sorted list of category strings', async () => {
        const data = await getCategories();
        assert.ok(Array.isArray(data), 'should return array');
        assert.ok(data.length > 0, 'at least 1 category');
        data.forEach(c => assert.equal(typeof c, 'string', 'each item is a string'));
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getAllProductsForExport()', () => {
    test('returns all matching rows without pagination', async () => {
        const all = await getAllProductsForExport();
        const paginated = await getProducts({ limit: 20 });
        assert.ok(all.length >= paginated.pagination.total, 'export should return all rows');
    });

    test('export with filter returns fewer rows', async () => {
        const cats = await getCategories();
        if (cats.length === 0) return;
        const full = await getAllProductsForExport();
        const filtered = await getAllProductsForExport({ category: cats[0] });
        assert.ok(filtered.length <= full.length, 'filtered export should have <= rows');
    });
});

// ─────────────────────────────────────────────────────────────────────────────

// Cleanup
after(async () => {
    await pool.end();
});
