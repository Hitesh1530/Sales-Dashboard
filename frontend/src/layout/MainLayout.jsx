import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, Button, Container, Stack,
    IconButton, Tooltip, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useColorMode } from '../App.jsx';

const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Data Table', path: '/data', icon: <TableChartIcon fontSize="small" /> },
    { label: 'Upload', path: '/upload', icon: <CloudUploadIcon fontSize="small" /> },
];

export default function MainLayout() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { toggleColorMode, mode } = useColorMode();
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : 'primary.main',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ gap: 2 }}>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ flexGrow: 0, cursor: 'pointer', mr: 3, color: 'white' }}
                            onClick={() => navigate('/')}
                        >
                            🛍️ Product Analytics
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                            {navItems.map(({ label, path, icon }) => (
                                <Button
                                    key={path}
                                    startIcon={icon}
                                    onClick={() => navigate(path)}
                                    sx={{
                                        color: 'white',
                                        bgcolor: pathname === path ? 'rgba(255,255,255,0.2)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                                        fontWeight: pathname === path ? 700 : 400,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                    }}
                                >
                                    {label}
                                </Button>
                            ))}
                        </Stack>

                        {/* Dark Mode Toggle */}
                        <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <IconButton onClick={toggleColorMode} sx={{ color: 'white' }} aria-label="toggle dark mode">
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            <Box
                component="footer"
                sx={{
                    py: 2,
                    px: 3,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Product Ratings & Review Analytics Dashboard — {new Date().getFullYear()}
                </Typography>
            </Box>
        </Box>
    );
}
