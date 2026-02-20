import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Box, Button, Container, Stack,
    IconButton, Tooltip, useTheme, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
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
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleNav = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

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
                    <Toolbar disableGutters sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>

                        {/* Hamburger — xs/sm only */}
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            sx={{ color: 'white', display: { xs: 'flex', md: 'none' } }}
                            aria-label="open navigation"
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Logo */}
                        <Box
                            onClick={() => navigate('/')}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexGrow: { xs: 1, md: 0 },
                                cursor: 'pointer',
                                mr: { md: 3 },
                            }}
                        >
                            <img
                                src="/logo.svg"
                                alt="Product Analytics Logo"
                                style={{ width: 28, height: 28, display: 'block' }}
                            />
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                noWrap
                                sx={{
                                    color: 'white',
                                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                                }}
                            >
                                Product Analytics
                            </Typography>
                        </Box>

                        {/* Desktop nav — md+ only */}
                        <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
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
                                        px: 1.5,
                                    }}
                                >
                                    {label}
                                </Button>
                            ))}
                        </Stack>

                        {/* Dark mode toggle — always visible */}
                        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                            <IconButton onClick={toggleColorMode} sx={{ color: 'white' }} aria-label="toggle dark mode">
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 240 } }}
            >
                <Box sx={{ p: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img src="/logo.svg" alt="logo" style={{ width: 26, height: 26 }} />
                    <Typography variant="h6" fontWeight={700} color="white" noWrap>
                        Product Analytics
                    </Typography>
                </Box>
                <Divider />
                <List sx={{ pt: 1 }}>
                    {navItems.map(({ label, path, icon }) => (
                        <ListItemButton
                            key={path}
                            selected={pathname === path}
                            onClick={() => handleNav(path)}
                            sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
                            <ListItemText
                                primary={label}
                                primaryTypographyProps={{ fontWeight: pathname === path ? 700 : 400 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            <Box
                component="footer"
                sx={{
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Product Analytics Dashboard — {new Date().getFullYear()}
                </Typography>
            </Box>
        </Box>
    );
}


