import asyncHandler from '../utils/async-handler.js';
import * as analyticsService from '../services/analytics-service.js';

/**
 * Get overview metrics
 * GET /api/overview
 */
export const getOverview = asyncHandler(async (req, res) => {
    const { start, end } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
    };

    const data = await analyticsService.getOverview(filters);

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * Get revenue trends
 * GET /api/trends
 */
export const getTrends = asyncHandler(async (req, res) => {
    const { start, end, interval } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
        interval: interval || 'daily',
    };

    const data = await analyticsService.getTrends(filters);

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * Get product-wise sales
 * GET /api/by-product
 */
export const getProductSales = asyncHandler(async (req, res) => {
    const { start, end, category, region, limit } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
        category,
        region,
        limit: limit ? parseInt(limit) : 10,
    };

    const data = await analyticsService.getProductSales(filters);

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * Get region-wise revenue
 * GET /api/by-region
 */
export const getRegionRevenue = asyncHandler(async (req, res) => {
    const { start, end, category } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
        category,
    };

    const data = await analyticsService.getRegionRevenue(filters);

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * Get filtered sales with pagination
 * GET /api/sales
 */
export const getFilteredSales = asyncHandler(async (req, res) => {
    const { start, end, product, category, region, page, limit } = req.query;

    const filters = {
        startDate: start,
        endDate: end,
        product,
        category,
        region,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
    };

    const result = await analyticsService.getFilteredSales(filters);

    res.status(200).json({
        success: true,
        ...result,
    });
});

/**
 * Get categories for filter dropdown
 * GET /api/categories
 */
export const getCategories = asyncHandler(async (req, res) => {
    const data = await analyticsService.getCategories();

    res.status(200).json({
        success: true,
        data,
    });
});

/**
 * Get regions for filter dropdown
 * GET /api/regions
 */
export const getRegions = asyncHandler(async (req, res) => {
    const data = await analyticsService.getRegions();

    res.status(200).json({
        success: true,
        data,
    });
});
