import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Stack,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TablePagination,
    TableSortLabel, TextField, Select, MenuItem,
    FormControl, InputLabel, InputAdornment,
    Chip, Skeleton, Alert, Rating, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchProducts, fetchCategories, setFilters, setPage } from '../redux/slices/productsSlice.js';
import api from '../api/axios.js';

// Column definitions with sort support
const COLUMNS = [
    { id: 'product_name', label: 'Product Name', sortable: true, minWidth: 200 },
    { id: 'category', label: 'Category', sortable: true, minWidth: 140 },
    { id: 'discounted_price', label: 'Price (₹)', sortable: true, minWidth: 100, align: 'right' },
    { id: 'actual_price', label: 'Actual Price (₹)', sortable: true, minWidth: 120, align: 'right' },
    { id: 'discount_percentage', label: 'Discount', sortable: true, minWidth: 90 },
    { id: 'rating', label: 'Rating', sortable: true, minWidth: 140 },
    { id: 'rating_count', label: 'Reviews', sortable: true, minWidth: 90, align: 'right' },
];

const LoadingSkeleton = () => (
    <TableBody>
        {[...Array(8)].map((_, i) => (
            <TableRow key={i}>
                {COLUMNS.map((c) => (
                    <TableCell key={c.id}><Skeleton variant="text" /></TableCell>
                ))}
            </TableRow>
        ))}
    </TableBody>
);

export default function DataTablePage() {
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const { products, pagination, productsLoading, productsError, filters, categories } = useSelector(s => s.products);

    // Initialize from URL params (chart click navigates here with ?category=Electronics)
    const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
    const [localCategory, setLocalCategory] = useState(searchParams.get('category') || '');
    const [localMinRating, setLocalMinRating] = useState(searchParams.get('minRating') || '');
    const [sortBy, setSortBy] = useState('rating_count');
    const [sortOrder, setSortOrder] = useState('desc');
    const [exportLoading, setExportLoading] = useState(false);

    // Load categories for dropdown
    useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

    // Apply URL params immediately on mount
    useEffect(() => {
        const urlCat = searchParams.get('category');
        if (urlCat) setLocalCategory(urlCat);
    }, []);

    // Debounced filter dispatch (400ms)
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(setFilters({ search: localSearch, category: localCategory, minRating: localMinRating }));
        }, 400);
        return () => clearTimeout(t);
    }, [localSearch, localCategory, localMinRating, dispatch]);

    // Fetch whenever filters or sort change
    useEffect(() => {
        dispatch(fetchProducts({ ...filters, sortBy, sortOrder }));
    }, [dispatch, filters, sortBy, sortOrder]);

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortOrder('desc');
        }
    };

    const handlePageChange = (_, newPage) => {
        dispatch(setPage(newPage + 1));
        dispatch(fetchProducts({ ...filters, page: newPage + 1, sortBy, sortOrder }));
    };

    const handleRowsPerPage = (e) => {
        dispatch(setFilters({ limit: parseInt(e.target.value) }));
    };

    // CSV Export — calls /api/products/export with current filters
    const handleExportCSV = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams();
            if (localSearch) params.set('search', localSearch);
            if (localCategory) params.set('category', localCategory);
            if (localMinRating) params.set('minRating', localMinRating);
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);

            const response = await api.get(`/products/export?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `products-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1,
                mb: 1
            }}>
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={700}
                        gutterBottom
                        sx={{ fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' } }}
                    >
                        📋 Products Data Table
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 1, sm: 2 } }}>
                        {pagination.total.toLocaleString()} products &mdash; paginated, sortable &amp; searchable
                    </Typography>
                </Box>

                {/* Export CSV Button */}
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportCSV}
                    disabled={exportLoading || pagination.total === 0}
                    sx={{ height: 40, whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' } }}
                >
                    {exportLoading ? 'Exporting...' : `Export CSV (${pagination.total.toLocaleString()})`}
                </Button>
            </Box>

            {/* Filters Row */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
                        {/* Search */}
                        <TextField
                            size="small"
                            placeholder="Search product name..."
                            value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: { xs: '100%', sm: 260 } }}
                        />

                        {/* Category Filter */}
                        <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
                            <InputLabel>Category</InputLabel>
                            <Select value={localCategory} label="Category" onChange={e => setLocalCategory(e.target.value)}>
                                <MenuItem value="">All Categories</MenuItem>
                                {categories.map(cat => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Min Rating Filter */}
                        <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
                            <InputLabel>Min Rating</InputLabel>
                            <Select value={localMinRating} label="Min Rating" onChange={e => setLocalMinRating(e.target.value)}>
                                <MenuItem value="">All Ratings</MenuItem>
                                <MenuItem value="4.5">⭐ 4.5+</MenuItem>
                                <MenuItem value="4.0">⭐ 4.0+</MenuItem>
                                <MenuItem value="3.5">⭐ 3.5+</MenuItem>
                                <MenuItem value="3.0">⭐ 3.0+</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Active filter chips */}
                        {(localSearch || localCategory || localMinRating) && (
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {localSearch && <Chip size="small" label={`"${localSearch}"`} onDelete={() => setLocalSearch('')} />}
                                {localCategory && <Chip size="small" label={localCategory} onDelete={() => setLocalCategory('')} color="primary" />}
                                {localMinRating && <Chip size="small" label={`≥ ${localMinRating}★`} onDelete={() => setLocalMinRating('')} color="warning" />}
                            </Stack>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {productsError && <Alert severity="error" sx={{ mb: 2 }}>{productsError}</Alert>}

            {/* Table */}
            <Card sx={{ borderRadius: 2 }}>
                <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {COLUMNS.map(col => (
                                    <TableCell
                                        key={col.id}
                                        align={col.align || 'left'}
                                        sx={{ fontWeight: 700, bgcolor: 'background.paper', minWidth: col.minWidth }}
                                    >
                                        {col.sortable ? (
                                            <TableSortLabel
                                                active={sortBy === col.id}
                                                direction={sortBy === col.id ? sortOrder : 'asc'}
                                                onClick={() => handleSort(col.id)}
                                            >
                                                {col.label}
                                            </TableSortLabel>
                                        ) : col.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>

                        {productsLoading ? <LoadingSkeleton /> : (
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary">
                                                {localSearch || localCategory || localMinRating
                                                    ? '🔍 No products match your filters — try clearing some filters'
                                                    : '📭 No products yet — upload a CSV or XLSX file on the Upload page'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : products.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                                                {row.product_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.category} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.discounted_price != null ? `₹${Number(row.discounted_price).toLocaleString()}` : '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.actual_price != null ? `₹${Number(row.actual_price).toLocaleString()}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.discount_percentage != null
                                                ? <Chip label={`${Number(row.discount_percentage).toFixed(0)}%`} size="small" color="warning" />
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="body2" sx={{ minWidth: 20 }}>{row.rating ?? '—'}</Typography>
                                                {row.rating && <Rating value={parseFloat(row.rating)} precision={0.1} size="small" readOnly />}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.rating_count != null ? Number(row.rating_count).toLocaleString() : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        )}
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={pagination.total}
                    page={pagination.page - 1}
                    rowsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPage}
                    rowsPerPageOptions={[10, 20, 50]}
                />
            </Card>
        </Box>
    );
}
