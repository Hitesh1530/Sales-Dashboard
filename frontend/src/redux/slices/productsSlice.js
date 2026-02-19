import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.js';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.set('search', filters.search);
            if (filters.category) params.set('category', filters.category);
            if (filters.minRating) params.set('minRating', filters.minRating);
            if (filters.page) params.set('page', filters.page);
            if (filters.limit) params.set('limit', filters.limit);
            const response = await api.get(`/products?${params.toString()}`);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchCategories = createAsyncThunk(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/categories');
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchByCategory = createAsyncThunk(
    'products/fetchByCategory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/by-category');
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchTopReviewed = createAsyncThunk(
    'products/fetchTopReviewed',
    async (limit = 10, { rejectWithValue }) => {
        try {
            const response = await api.get(`/products/top-reviewed?limit=${limit}`);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchDiscountDistribution = createAsyncThunk(
    'products/fetchDiscountDistribution',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/discount-distribution');
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const fetchAvgRatingByCategory = createAsyncThunk(
    'products/fetchAvgRatingByCategory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/avg-rating-by-category');
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

export const uploadFile = createAsyncThunk(
    'products/uploadFile',
    async (file, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || { error: err.message });
        }
    }
);

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
    // Products table
    products: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    productsLoading: false,
    productsError: null,

    // Filters
    filters: { search: '', category: '', minRating: '', page: 1, limit: 20 },

    // Categories list
    categories: [],
    categoriesLoading: false,

    // Charts data
    byCategory: [],
    byCategoryLoading: false,

    topReviewed: [],
    topReviewedLoading: false,

    discountDistribution: [],
    discountLoading: false,

    avgRatingByCategory: [],
    avgRatingLoading: false,

    // Upload
    uploadLoading: false,
    uploadResult: null,
    uploadError: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setFilters(state, action) {
            state.filters = { ...state.filters, ...action.payload, page: 1 };
        },
        setPage(state, action) {
            state.filters.page = action.payload;
        },
        clearUploadResult(state) {
            state.uploadResult = null;
            state.uploadError = null;
        },
    },
    extraReducers: (builder) => {
        // Products table
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.productsLoading = true;
                state.productsError = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.productsLoading = false;
                state.products = action.payload.data || [];
                state.pagination = action.payload.pagination || state.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.productsLoading = false;
                state.productsError = action.payload?.error || 'Failed to fetch products';
            });

        // Categories
        builder
            .addCase(fetchCategories.pending, (state) => { state.categoriesLoading = true; })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categoriesLoading = false;
                state.categories = action.payload.data || [];
            })
            .addCase(fetchCategories.rejected, (state) => { state.categoriesLoading = false; });

        // By category
        builder
            .addCase(fetchByCategory.pending, (state) => { state.byCategoryLoading = true; })
            .addCase(fetchByCategory.fulfilled, (state, action) => {
                state.byCategoryLoading = false;
                state.byCategory = action.payload.data || [];
            })
            .addCase(fetchByCategory.rejected, (state) => { state.byCategoryLoading = false; });

        // Top reviewed
        builder
            .addCase(fetchTopReviewed.pending, (state) => { state.topReviewedLoading = true; })
            .addCase(fetchTopReviewed.fulfilled, (state, action) => {
                state.topReviewedLoading = false;
                state.topReviewed = action.payload.data || [];
            })
            .addCase(fetchTopReviewed.rejected, (state) => { state.topReviewedLoading = false; });

        // Discount distribution
        builder
            .addCase(fetchDiscountDistribution.pending, (state) => { state.discountLoading = true; })
            .addCase(fetchDiscountDistribution.fulfilled, (state, action) => {
                state.discountLoading = false;
                state.discountDistribution = action.payload.data || [];
            })
            .addCase(fetchDiscountDistribution.rejected, (state) => { state.discountLoading = false; });

        // Avg rating by category
        builder
            .addCase(fetchAvgRatingByCategory.pending, (state) => { state.avgRatingLoading = true; })
            .addCase(fetchAvgRatingByCategory.fulfilled, (state, action) => {
                state.avgRatingLoading = false;
                state.avgRatingByCategory = action.payload.data || [];
            })
            .addCase(fetchAvgRatingByCategory.rejected, (state) => { state.avgRatingLoading = false; });

        // Upload
        builder
            .addCase(uploadFile.pending, (state) => {
                state.uploadLoading = true;
                state.uploadResult = null;
                state.uploadError = null;
            })
            .addCase(uploadFile.fulfilled, (state, action) => {
                state.uploadLoading = false;
                state.uploadResult = action.payload.data || action.payload;
            })
            .addCase(uploadFile.rejected, (state, action) => {
                state.uploadLoading = false;
                state.uploadError = action.payload?.error || 'Upload failed';
            });
    },
});

export const { setFilters, setPage, clearUploadResult } = productsSlice.actions;
export default productsSlice.reducer;
