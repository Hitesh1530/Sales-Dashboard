import express from 'express';
import * as analyticsController from '../controllers/analytics-controller.js';

const router = express.Router();

/**
 * GET /api/overview
 * Get total revenue, units, and orders
 * Query params: start, end
 */
router.get('/overview', analyticsController.getOverview);

/**
 * GET /api/trends
 * Get revenue trends by time interval
 * Query params: start, end, interval (daily|weekly|monthly)
 */
router.get('/trends', analyticsController.getTrends);

/**
 * GET /api/by-product
 * Get product-wise sales aggregation
 * Query params: start, end, category, region, limit
 */
router.get('/by-product', analyticsController.getProductSales);

/**
 * GET /api/by-region
 * Get region-wise revenue aggregation
 * Query params: start, end, category
 */
router.get('/by-region', analyticsController.getRegionRevenue);

/**
 * GET /api/sales
 * Get filtered sales with pagination
 * Query params: start, end, product, category, region, page, limit
 */
router.get('/sales', analyticsController.getFilteredSales);

/**
 * GET /api/categories
 * Get distinct categories for filter dropdown
 */
router.get('/categories', analyticsController.getCategories);

/**
 * GET /api/regions
 * Get distinct regions for filter dropdown
 */
router.get('/regions', analyticsController.getRegions);

export default router;
