import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    TextField,
    MenuItem,
    Button,
    Grid,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { setFilters, fetchCategories, fetchRegions } from '../../redux/slices/salesSlice';

const FilterBar = ({ onApplyFilters }) => {
    const dispatch = useDispatch();
    const { filters, categories, regionsList } = useSelector((state) => state.sales);

    const [localFilters, setLocalFilters] = useState({
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        category: filters.category || '',
        region: filters.region || '',
        interval: filters.interval || 'daily',
    });

    useEffect(() => {
        // Fetch categories and regions for dropdowns
        dispatch(fetchCategories());
        dispatch(fetchRegions());
    }, [dispatch]);

    const handleFilterChange = (field, value) => {
        setLocalFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        dispatch(setFilters(localFilters));
        if (onApplyFilters) {
            onApplyFilters(localFilters);
        }
    };

    const handleResetFilters = () => {
        const resetFilters = {
            startDate: '',
            endDate: '',
            category: '',
            region: '',
            interval: 'daily',
        };
        setLocalFilters(resetFilters);
        dispatch(setFilters(resetFilters));
        if (onApplyFilters) {
            onApplyFilters(resetFilters);
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        label="Start Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={localFilters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        label="End Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={localFilters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        select
                        label="Category"
                        fullWidth
                        size="small"
                        value={localFilters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                                {cat}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        select
                        label="Region"
                        fullWidth
                        size="small"
                        value={localFilters.region}
                        onChange={(e) => handleFilterChange('region', e.target.value)}
                    >
                        <MenuItem value="">All Regions</MenuItem>
                        {regionsList.map((reg) => (
                            <MenuItem key={reg} value={reg}>
                                {reg}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        select
                        label="Interval"
                        fullWidth
                        size="small"
                        value={localFilters.interval}
                        onChange={(e) => handleFilterChange('interval', e.target.value)}
                    >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleApplyFilters}
                            startIcon={<FilterListIcon />}
                        >
                            Apply
                        </Button>
                        <Button variant="outlined" onClick={handleResetFilters}>
                            Reset
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default FilterBar;
