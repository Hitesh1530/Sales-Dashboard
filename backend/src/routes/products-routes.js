import express from 'express';
import {
    getProducts,
    exportProducts,
    getByCategory,
    getTopReviewed,
    getDiscountDistribution,
    getCategoryAvgRating,
    getCategories,
} from '../controllers/products-controller.js';

const router = express.Router();

/** GET /api/products — paginated + filterable + sortable */
router.get('/', getProducts);

/** GET /api/products/export — download all matching as CSV */
router.get('/export', exportProducts);

/** GET /api/products/categories */
router.get('/categories', getCategories);

/** GET /api/products/by-category */
router.get('/by-category', getByCategory);

/** GET /api/products/top-reviewed */
router.get('/top-reviewed', getTopReviewed);

/** GET /api/products/discount-distribution */
router.get('/discount-distribution', getDiscountDistribution);

/** GET /api/products/avg-rating-by-category */
router.get('/avg-rating-by-category', getCategoryAvgRating);

export default router;
