import { query } from '../db/connection.js';

/**
 * Get overview metrics
 * Returns total revenue, total units, and total orders
 */
export const getOverview = async (filters = {}) => {
    const { startDate, endDate } = filters;

    let sql = `
    SELECT 
      COALESCE(SUM(revenue), 0) as total_revenue,
      COALESCE(SUM(units), 0) as total_units,
      COUNT(DISTINCT order_id) as total_orders
    FROM sales
    WHERE 1=1
  `;

    const params = [];

    if (startDate) {
        params.push(startDate);
        sql += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
        params.push(endDate);
        sql += ` AND sale_date <= $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows[0];
};

/**
 * Get revenue trends by time interval
 * Supports daily, weekly, and monthly intervals
 */
export const getTrends = async (filters = {}) => {
    const { startDate, endDate, interval = 'daily' } = filters;

    let dateFormat;
    switch (interval) {
        case 'weekly':
            dateFormat = 'YYYY-IW'; // ISO week
            break;
        case 'monthly':
            dateFormat = 'YYYY-MM';
            break;
        default:
            dateFormat = 'YYYY-MM-DD';
    }

    let sql = `
    SELECT 
      TO_CHAR(sale_date, '${dateFormat}') as period,
      SUM(revenue) as revenue,
      SUM(units) as units
    FROM sales
    WHERE 1=1
  `;

    const params = [];

    if (startDate) {
        params.push(startDate);
        sql += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
        params.push(endDate);
        sql += ` AND sale_date <= $${params.length}`;
    }

    sql += ` GROUP BY period ORDER BY period ASC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get product-wise sales aggregation
 */
export const getProductSales = async (filters = {}) => {
    const { startDate, endDate, category, region, limit = 10 } = filters;

    let sql = `
    SELECT 
      product_name,
      category,
      SUM(revenue) as total_revenue,
      SUM(units) as total_units,
      COUNT(*) as transaction_count
    FROM sales
    WHERE 1=1
  `;

    const params = [];

    if (startDate) {
        params.push(startDate);
        sql += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
        params.push(endDate);
        sql += ` AND sale_date <= $${params.length}`;
    }

    if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
    }

    if (region) {
        params.push(region);
        sql += ` AND region = $${params.length}`;
    }

    sql += ` GROUP BY product_name, category ORDER BY total_revenue DESC`;

    if (limit) {
        params.push(limit);
        sql += ` LIMIT $${params.length}`;
    }

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get region-wise revenue aggregation
 */
export const getRegionRevenue = async (filters = {}) => {
    const { startDate, endDate, category } = filters;

    let sql = `
    SELECT 
      region,
      SUM(revenue) as total_revenue,
      SUM(units) as total_units,
      COUNT(*) as transaction_count
    FROM sales
    WHERE 1=1
  `;

    const params = [];

    if (startDate) {
        params.push(startDate);
        sql += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
        params.push(endDate);
        sql += ` AND sale_date <= $${params.length}`;
    }

    if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
    }

    sql += ` GROUP BY region ORDER BY total_revenue DESC`;

    const result = await query(sql, params);
    return result.rows;
};

/**
 * Get filtered sales with pagination
 */
export const getFilteredSales = async (filters = {}) => {
    const {
        startDate,
        endDate,
        product,
        category,
        region,
        page = 1,
        limit = 50,
    } = filters;

    const offset = (page - 1) * limit;

    let sql = `
    SELECT 
      id,
      sale_date,
      order_id,
      product_id,
      product_name,
      category,
      region,
      units,
      unit_price,
      revenue
    FROM sales
    WHERE 1=1
  `;

    const params = [];

    if (startDate) {
        params.push(startDate);
        sql += ` AND sale_date >= $${params.length}`;
    }

    if (endDate) {
        params.push(endDate);
        sql += ` AND sale_date <= $${params.length}`;
    }

    if (product) {
        params.push(`%${product}%`);
        sql += ` AND product_name ILIKE $${params.length}`;
    }

    if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
    }

    if (region) {
        params.push(region);
        sql += ` AND region = $${params.length}`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    sql += ` ORDER BY sale_date DESC, id DESC`;
    params.push(limit, offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    return {
        data: result.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get distinct categories for filter dropdown
 */
export const getCategories = async () => {
    const sql = `SELECT DISTINCT category FROM sales ORDER BY category ASC`;
    const result = await query(sql);
    return result.rows.map((row) => row.category);
};

/**
 * Get distinct regions for filter dropdown
 */
export const getRegions = async () => {
    const sql = `SELECT DISTINCT region FROM sales ORDER BY region ASC`;
    const result = await query(sql);
    return result.rows.map((row) => row.region);
};
