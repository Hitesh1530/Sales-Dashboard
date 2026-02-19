import { query } from '../db/connection.js';

// Allowed sort columns (whitelist to prevent SQL injection)
const SORTABLE_COLS = {
    product_name: 'product_name',
    category: 'category',
    discounted_price: 'discounted_price',
    actual_price: 'actual_price',
    discount_percentage: 'discount_percentage',
    rating: 'rating',
    rating_count: 'rating_count',
};

/**
 * Get paginated product table data with full-text search, filters, and sorting
 */
export const getProducts = async (filters = {}) => {
    const {
        search,
        category,
        minRating,
        page = 1,
        limit = 20,
        sortBy = 'rating_count',
        sortOrder = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const params = [];

    let conditions = ['1=1'];

    if (search) {
        params.push(search);
        // Use full-text search via tsvector index if >= 3 chars, else ILIKE
        if (search.length >= 3) {
            conditions.push(`name_tsv @@ plainto_tsquery('english', $${params.length})`);
        } else {
            params[params.length - 1] = `%${search}%`;
            conditions.push(`product_name ILIKE $${params.length}`);
        }
    }
    if (category) {
        params.push(category);
        conditions.push(`category = $${params.length}`);
    }
    if (minRating) {
        params.push(parseFloat(minRating));
        conditions.push(`rating >= $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Count total matching rows
    const countResult = await query(
        `SELECT COUNT(*) AS total FROM products WHERE ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].total);

    // Validate & apply sort
    const col = SORTABLE_COLS[sortBy] || 'rating_count';
    const dir = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    params.push(limit, offset);
    const sql = `
        SELECT 
            id, product_id, product_name, category,
            discounted_price, actual_price, discount_percentage,
            rating, rating_count, review_title
        FROM products
        WHERE ${whereClause}
        ORDER BY ${col} ${dir} NULLS LAST
        LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await query(sql, params);
    return {
        data: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get all products for CSV export (no pagination)
 */
export const getAllProductsForExport = async (filters = {}) => {
    const { search, category, minRating, sortBy = 'rating_count', sortOrder = 'desc' } = filters;
    const params = [];
    let conditions = ['1=1'];

    if (search) {
        params.push(search.length >= 3 ? search : `%${search}%`);
        conditions.push(
            search.length >= 3
                ? `name_tsv @@ plainto_tsquery('english', $${params.length})`
                : `product_name ILIKE $${params.length}`
        );
    }
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (minRating) { params.push(parseFloat(minRating)); conditions.push(`rating >= $${params.length}`); }

    const col = SORTABLE_COLS[sortBy] || 'rating_count';
    const dir = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const result = await query(
        `SELECT id, product_id, product_name, category, discounted_price, actual_price,
                discount_percentage, rating, rating_count, review_title
         FROM products
         WHERE ${conditions.join(' AND ')}
         ORDER BY ${col} ${dir} NULLS LAST`,
        params
    );
    return result.rows;
};

/**
 * Count products per category
 */
export const getProductsByCategory = async () => {
    const result = await query(`
        SELECT category, COUNT(*) AS product_count
        FROM products
        GROUP BY category
        ORDER BY product_count DESC
    `);
    return result.rows;
};

/**
 * Top N most-reviewed products
 */
export const getTopReviewed = async (limit = 10) => {
    const result = await query(`
        SELECT product_name, category, rating, rating_count
        FROM products
        WHERE rating_count IS NOT NULL
        ORDER BY rating_count DESC
        LIMIT $1
    `, [limit]);
    return result.rows;
};

/**
 * Discount distribution bucketed into ranges
 */
export const getDiscountDistribution = async () => {
    const result = await query(`
        SELECT 
            CASE 
                WHEN discount_percentage < 20  THEN '0-20%'
                WHEN discount_percentage < 40  THEN '20-40%'
                WHEN discount_percentage < 60  THEN '40-60%'
                WHEN discount_percentage < 80  THEN '60-80%'
                ELSE '80-100%'
            END AS bucket,
            COUNT(*) AS count
        FROM products
        WHERE discount_percentage IS NOT NULL
        GROUP BY bucket
        ORDER BY bucket
    `);
    return result.rows;
};

/**
 * Average rating per category
 */
export const getCategoryAvgRating = async () => {
    const result = await query(`
        SELECT category, ROUND(AVG(rating)::NUMERIC, 2) AS avg_rating, COUNT(*) AS product_count
        FROM products
        WHERE rating IS NOT NULL
        GROUP BY category
        ORDER BY avg_rating DESC
    `);
    return result.rows;
};

/**
 * Distinct categories for filter dropdown
 */
export const getCategories = async () => {
    const result = await query(`SELECT DISTINCT category FROM products ORDER BY category ASC`);
    return result.rows.map((r) => r.category);
};
