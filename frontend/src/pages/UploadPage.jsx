import React, { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Card, CardContent, Button, LinearProgress,
    Alert, AlertTitle, Stack, Divider, List, ListItem, ListItemText,
    Chip, Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { uploadFile, clearUploadResult } from '../redux/slices/productsSlice.js';

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls'];

export default function UploadPage() {
    const dispatch = useDispatch();
    const { uploadLoading, uploadResult, uploadError } = useSelector(s => s.products);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = (file) => {
        if (!file) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_TYPES.includes(ext)) {
            alert('Invalid file type. Please upload CSV or XLSX files only.');
            return;
        }
        dispatch(clearUploadResult());
        setSelectedFile(file);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files?.[0]);
    }, []);

    const handleUpload = () => {
        if (!selectedFile) return;
        dispatch(uploadFile(selectedFile));
    };

    return (
        <Box sx={{ p: 3, maxWidth: 680, mx: 'auto' }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                📤 Upload Product Data
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Upload a CSV or XLSX file with product review data. Required columns: product_id, product_name, category, discounted_price, actual_price, discount_percentage, rating, rating_count.
            </Typography>

            {/* Drop zone */}
            <Paper
                variant="outlined"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: dragOver ? '2px dashed #6366f1' : '2px dashed #ccc',
                    borderRadius: 3,
                    p: 5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: dragOver ? 'primary.50' : 'grey.50',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                    mb: 3,
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <CloudUploadIcon sx={{ fontSize: 52, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                    {selectedFile ? selectedFile.name : 'Drag & drop or click to select file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Supports: CSV, XLSX, XLS (max 10MB)
                </Typography>
                {selectedFile && (
                    <Stack direction="row" justifyContent="center" spacing={1} mt={2}>
                        <Chip icon={<InsertDriveFileIcon />} label={selectedFile.name} color="primary" variant="outlined" />
                        <Chip label={`${(selectedFile.size / 1024).toFixed(1)} KB`} size="small" />
                    </Stack>
                )}
            </Paper>

            {/* Upload Button */}
            <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!selectedFile || uploadLoading}
                onClick={handleUpload}
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 3, py: 1.5, borderRadius: 2 }}
            >
                {uploadLoading ? 'Uploading...' : 'Upload & Process File'}
            </Button>

            {/* Progress */}
            {uploadLoading && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Processing file...
                    </Typography>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                </Box>
            )}

            {/* Success */}
            {uploadResult && (
                <Alert
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{ mb: 2, borderRadius: 2 }}
                >
                    <AlertTitle>Upload Successful!</AlertTitle>
                    <Stack spacing={0.5} mt={1}>
                        <Typography variant="body2">📦 Total processed: <strong>{uploadResult.total?.toLocaleString()}</strong></Typography>
                        <Typography variant="body2" color="success.main">✅ Inserted: <strong>{uploadResult.inserted?.toLocaleString()}</strong></Typography>
                        {uploadResult.skipped > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                ⏭ Skipped (duplicates / already in DB): <strong>{uploadResult.skipped?.toLocaleString()}</strong>
                            </Typography>
                        )}
                        {uploadResult.failed > 0 && (
                            <Typography variant="body2" color="error.main">
                                ❌ Failed: <strong>{uploadResult.failed}</strong>
                            </Typography>
                        )}
                    </Stack>

                    {uploadResult.errors?.length > 0 && (
                        <Box mt={2}>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body2" fontWeight={600}>Errors (first {uploadResult.errors.length}):</Typography>
                            <List dense>
                                {uploadResult.errors.slice(0, 5).map((e, i) => (
                                    <ListItem key={i} disableGutters>
                                        <ListItemText
                                            primary={e.error || e}
                                            primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Alert>
            )}


            {/* Error */}
            {uploadError && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Upload Failed</AlertTitle>
                    {uploadError}
                </Alert>
            )}

            {/* Instructions */}
            <Card sx={{ mt: 3, borderRadius: 2, bgcolor: 'grey.50' }} variant="outlined">
                <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        📋 Expected Column Format
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Your file must include these columns (XLSX row 2 or CSV headers):
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                        {['product_id', 'product_name', 'category', 'discounted_price', 'actual_price', 'discount_percentage', 'rating', 'rating_count'].map(col => (
                            <Chip key={col} label={col} size="small" variant="outlined" />
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
