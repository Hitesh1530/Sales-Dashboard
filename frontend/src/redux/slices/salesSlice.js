import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';

// Async thunks for API calls

export const uploadFile = createAsyncThunk(
    'sales/uploadFile',
    async (file, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axiosInstance.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchOverview = createAsyncThunk(
    'sales/fetchOverview',
    async (filters, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('start', filters.startDate);
            if (filters?.endDate) params.append('end', filters.endDate);

            const response = await axiosInstance.get(`/overview?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchTrends = createAsyncThunk(
    'sales/fetchTrends',
    async (filters, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('start', filters.startDate);
            if (filters?.endDate) params.append('end', filters.endDate);
            if (filters?.interval) params.append('interval', filters.interval);

            const response = await axiosInstance.get(`/trends?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchProductSales = createAsyncThunk(
    'sales/fetchProductSales',
    async (filters, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('start', filters.startDate);
            if (filters?.endDate) params.append('end', filters.endDate);
            if (filters?.category) params.append('category', filters.category);
            if (filters?.region) params.append('region', filters.region);
            if (filters?.limit) params.append('limit', filters.limit);

            const response = await axiosInstance.get(`/by-product?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchRegionRevenue = createAsyncThunk(
    'sales/fetchRegionRevenue',
    async (filters, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.startDate) params.append('start', filters.startDate);
            if (filters?.endDate) params.append('end', filters.endDate);
            if (filters?.category) params.append('category', filters.category);

            const response = await axiosInstance.get(`/by-region?${params.toString()}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchCategories = createAsyncThunk(
    'sales/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/categories');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

export const fetchRegions = createAsyncThunk(
    'sales/fetchRegions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get('/regions');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { error: error.message });
        }
    }
);

// Slice
const salesSlice = createSlice({
    name: 'sales',
    initialState: {
        filters: {
            startDate: null,
            endDate: null,
            category: '',
            region: '',
            interval: 'daily',
        },
        overview: null,
        trends: [],
        products: [],
        regions: [],
        categories: [],
        regionsList: [],
        loading: false,
        uploadLoading: false,
        error: null,
        uploadResult: null,
    },
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearUploadResult: (state) => {
            state.uploadResult = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Upload
        builder
            .addCase(uploadFile.pending, (state) => {
                state.uploadLoading = true;
                state.error = null;
            })
            .addCase(uploadFile.fulfilled, (state, action) => {
                state.uploadLoading = false;
                state.uploadResult = action.payload.data;
            })
            .addCase(uploadFile.rejected, (state, action) => {
                state.uploadLoading = false;
                state.error = action.payload?.error || 'Upload failed';
            });

        // Overview
        builder
            .addCase(fetchOverview.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOverview.fulfilled, (state, action) => {
                state.loading = false;
                state.overview = action.payload;
            })
            .addCase(fetchOverview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to fetch overview';
            });

        // Trends
        builder
            .addCase(fetchTrends.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTrends.fulfilled, (state, action) => {
                state.loading = false;
                state.trends = action.payload;
            })
            .addCase(fetchTrends.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to fetch trends';
            });

        // Product sales
        builder
            .addCase(fetchProductSales.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProductSales.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchProductSales.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to fetch product sales';
            });

        // Region revenue
        builder
            .addCase(fetchRegionRevenue.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRegionRevenue.fulfilled, (state, action) => {
                state.loading = false;
                state.regions = action.payload;
            })
            .addCase(fetchRegionRevenue.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.error || 'Failed to fetch region revenue';
            });

        // Categories
        builder
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categories = action.payload;
            });

        // Regions list
        builder
            .addCase(fetchRegions.fulfilled, (state, action) => {
                state.regionsList = action.payload;
            });
    },
});

export const { setFilters, clearUploadResult, clearError } = salesSlice.actions;
export default salesSlice.reducer;
