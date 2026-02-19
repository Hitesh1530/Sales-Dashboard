import asyncHandler from '../utils/async-handler.js';
import * as productsService from '../services/products-service.js';

/**
 * GET /api/products
 * Paginated table with search, filters, sorting
 */
export const getProducts = asyncHandler(async (req, res) => {
    const { search, category, minRating, page = 1, limit = 20, sortBy, sortOrder } = req.query;
    const result = await productsService.getProducts({
        search,
        category,
        minRating,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
    });
    res.json({ success: true, ...result });
});

/**
 * GET /api/products/export
 * Download all matching products as CSV
 */
export const exportProducts = asyncHandler(async (req, res) => {
    const { search, category, minRating, sortBy, sortOrder } = req.query;
    const rows = await productsService.getAllProductsForExport({ search, category, minRating, sortBy, sortOrder });

    const headers = ['ID', 'Product ID', 'Product Name', 'Category', 'Discounted Price', 'Actual Price', 'Discount %', 'Rating', 'Reviews', 'Review Title'];
    const escape = (v) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    const csvRows = [
        headers.join(','),
        ...rows.map(r => [
            r.id, r.product_id, r.product_name, r.category,
            r.discounted_price, r.actual_price, r.discount_percentage,
            r.rating, r.rating_count, r.review_title,
        ].map(escape).join(','))
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-${Date.now()}.csv"`);
    res.send(csvRows.join('\n'));
});

/**
 * GET /api/products/by-category
 */
export const getByCategory = asyncHandler(async (req, res) => {
    const data = await productsService.getProductsByCategory();
    res.json({ success: true, data });
});

/**
 * GET /api/products/top-reviewed
 */
export const getTopReviewed = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const data = await productsService.getTopReviewed(limit);
    res.json({ success: true, data });
});

/**
 * GET /api/products/discount-distribution
 */
export const getDiscountDistribution = asyncHandler(async (req, res) => {
    const data = await productsService.getDiscountDistribution();
    res.json({ success: true, data });
});

/**
 * GET /api/products/avg-rating-by-category
 */
export const getCategoryAvgRating = asyncHandler(async (req, res) => {
    const data = await productsService.getCategoryAvgRating();
    res.json({ success: true, data });
});

/**
 * GET /api/products/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
    const data = await productsService.getCategories();
    res.json({ success: true, data });
});
