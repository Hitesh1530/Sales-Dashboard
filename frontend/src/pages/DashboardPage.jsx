import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Grid, Card, CardContent, Typography, Skeleton, Alert, Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material';
import {
    fetchByCategory,
    fetchTopReviewed,
    fetchDiscountDistribution,
    fetchAvgRatingByCategory,
} from '../redux/slices/productsSlice.js';

/**
 * Reusable chart card with skeleton loading and retry button
 */
const ChartCard = ({ title, subtitle, children, loading, onRetry, height = 300 }) => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>{title}</Typography>
                    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
                </Box>
                {onRetry && !loading && (
                    <Button
                        size="small"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={onRetry}
                        sx={{ minWidth: 'auto', color: 'text.secondary' }}
                    >
                        Retry
                    </Button>
                )}
            </Box>
            {loading
                ? <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1, mt: 1 }} />
                : children}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';

    const {
        byCategory, byCategoryLoading,
        topReviewed, topReviewedLoading,
        discountDistribution, discountLoading,
        avgRatingByCategory, avgRatingLoading,
    } = useSelector((s) => s.products);

    useEffect(() => { loadAll(); }, []);

    const loadAll = () => {
        dispatch(fetchByCategory());
        dispatch(fetchTopReviewed(10));
        dispatch(fetchDiscountDistribution());
        dispatch(fetchAvgRatingByCategory());
    };

    // Navigate to /data with a category filter when a bar is clicked
    const handleCategoryBarClick = (event, chartContext, config) => {
        const clickedCategory = byCategory[config.dataPointIndex]?.category;
        if (clickedCategory) {
            navigate(`/data?category=${encodeURIComponent(clickedCategory)}`);
        }
    };

    const handleAvgRatingBarClick = (event, chartContext, config) => {
        const clickedCategory = avgRatingByCategory[config.dataPointIndex]?.category;
        if (clickedCategory) {
            navigate(`/data?category=${encodeURIComponent(clickedCategory)}`);
        }
    };

    // Common chart options
    const baseOptions = {
        chart: { fontFamily: 'Inter, sans-serif', background: 'transparent' },
        theme: { mode: isDark ? 'dark' : 'light' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    };

    // ── Chart 1: Products per Category ────────────────────────────────────────
    const byCatOptions = {
        ...baseOptions,
        chart: {
            ...baseOptions.chart,
            type: 'bar',
            toolbar: { show: false },
            events: { dataPointSelection: handleCategoryBarClick },
        },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', cursor: 'pointer' } },
        xaxis: { categories: byCategory.map(r => r.category), labels: { style: { fontSize: '11px' } } },
        yaxis: { title: { text: 'Count' } },
        colors: ['#6366f1'],
        dataLabels: { enabled: true },
        tooltip: { ...baseOptions.tooltip, y: { formatter: (v) => `${v} products` } },
        title: { text: '💡 Click a bar to filter the Data Table', align: 'right', style: { fontSize: '10px', color: '#94a3b8', fontWeight: 400 } },
    };
    const byCatSeries = [{ name: 'Products', data: byCategory.map(r => parseInt(r.product_count)) }];

    // ── Chart 2: Top Reviewed Products ────────────────────────────────────────
    const topRevOptions = {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 6, horizontal: true } },
        xaxis: { title: { text: 'Review Count' }, labels: { formatter: (v) => Number(v).toLocaleString() } },
        yaxis: { labels: { style: { fontSize: '10px' }, formatter: (v) => v?.length > 25 ? v.substring(0, 25) + '…' : v } },
        colors: ['#10b981'],
        dataLabels: { enabled: false },
        tooltip: { ...baseOptions.tooltip, y: { formatter: (v) => Number(v).toLocaleString() + ' reviews' } },
    };
    const topRevSeries = [{
        name: 'Reviews',
        data: topReviewed.map(r => ({
            x: r.product_name?.substring(0, 30) || r.product_name,
            y: parseInt(r.rating_count) || 0,
        })),
    }];

    // ── Chart 3: Discount Distribution (Histogram) ───────────────────────────
    const discountOptions = {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '70%' } },
        xaxis: {
            categories: discountDistribution.map(r => r.bucket),
            title: { text: 'Discount Range' },
        },
        yaxis: { title: { text: 'Number of Products' } },
        colors: ['#f59e0b'],
        dataLabels: { enabled: true },
        tooltip: { ...baseOptions.tooltip, y: { formatter: (v) => `${v} products` } },
    };
    const discountSeries = [{ name: 'Products', data: discountDistribution.map(r => parseInt(r.count)) }];

    // ── Chart 4: Category-wise Average Rating ─────────────────────────────────
    const avgRatingOptions = {
        ...baseOptions,
        chart: {
            ...baseOptions.chart,
            type: 'bar',
            toolbar: { show: false },
            events: { dataPointSelection: handleAvgRatingBarClick },
        },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', cursor: 'pointer' } },
        xaxis: { categories: avgRatingByCategory.map(r => r.category), labels: { style: { fontSize: '11px' } } },
        yaxis: { min: 0, max: 5, title: { text: 'Avg Rating' }, tickAmount: 5 },
        colors: ['#ec4899'],
        dataLabels: { enabled: true, formatter: (v) => v?.toFixed(2) },
        tooltip: { ...baseOptions.tooltip, y: { formatter: (v) => `${v} / 5` } },
        title: { text: '💡 Click a bar to filter the Data Table', align: 'right', style: { fontSize: '10px', color: '#94a3b8', fontWeight: 400 } },
    };
    const avgRatingSeries = [{
        name: 'Avg Rating',
        data: avgRatingByCategory.map(r => parseFloat(r.avg_rating)),
    }];

    const totalProducts = byCategory.reduce((a, r) => a + parseInt(r.product_count || 0), 0);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                📊 Product Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Real-time analytics from {totalProducts.toLocaleString()} products across {byCategory.length} categories
            </Typography>

            <Grid container spacing={3}>
                {/* Chart 1: Products per Category */}
                <Grid item xs={12} md={6}>
                    <ChartCard
                        title="Products per Category"
                        subtitle="COUNT(*) GROUP BY category"
                        loading={byCategoryLoading}
                        onRetry={() => dispatch(fetchByCategory())}
                    >
                        {byCategory.length > 0
                            ? <ReactApexChart type="bar" options={byCatOptions} series={byCatSeries} height={300} />
                            : <Alert severity="info">No data yet — upload a file first</Alert>}
                    </ChartCard>
                </Grid>

                {/* Chart 2: Top Reviewed Products */}
                <Grid item xs={12} md={6}>
                    <ChartCard
                        title="Top 10 Reviewed Products"
                        subtitle="ORDER BY rating_count DESC LIMIT 10"
                        loading={topReviewedLoading}
                        onRetry={() => dispatch(fetchTopReviewed(10))}
                    >
                        {topReviewed.length > 0
                            ? <ReactApexChart type="bar" options={topRevOptions} series={topRevSeries} height={300} />
                            : <Alert severity="info">No data yet — upload a file first</Alert>}
                    </ChartCard>
                </Grid>

                {/* Chart 3: Discount Distribution */}
                <Grid item xs={12} md={6}>
                    <ChartCard
                        title="Discount Distribution"
                        subtitle="Histogram of discount_percentage in 20% buckets"
                        loading={discountLoading}
                        onRetry={() => dispatch(fetchDiscountDistribution())}
                    >
                        {discountDistribution.length > 0
                            ? <ReactApexChart type="bar" options={discountOptions} series={discountSeries} height={300} />
                            : <Alert severity="info">No data yet — upload a file first</Alert>}
                    </ChartCard>
                </Grid>

                {/* Chart 4: Category-wise Average Rating */}
                <Grid item xs={12} md={6}>
                    <ChartCard
                        title="Avg Rating by Category"
                        subtitle="AVG(rating) GROUP BY category"
                        loading={avgRatingLoading}
                        onRetry={() => dispatch(fetchAvgRatingByCategory())}
                    >
                        {avgRatingByCategory.length > 0
                            ? <ReactApexChart type="bar" options={avgRatingOptions} series={avgRatingSeries} height={300} />
                            : <Alert severity="info">No data yet — upload a file first</Alert>}
                    </ChartCard>
                </Grid>
            </Grid>
        </Box>
    );
}
