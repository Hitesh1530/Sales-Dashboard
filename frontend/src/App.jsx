import React, { useState, createContext, useContext, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme/theme.js';
import MainLayout from './layout/MainLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DataTablePage from './pages/DataTablePage.jsx';
import UploadPage from './pages/UploadPage.jsx';

// Dark mode context
export const ColorModeContext = createContext({ toggleColorMode: () => { }, mode: 'light' });
export const useColorMode = () => useContext(ColorModeContext);

export default function App() {
    const [mode, setMode] = useState(() => {
        try { return localStorage.getItem('colorMode') || 'light'; } catch { return 'light'; }
    });

    const colorMode = useMemo(() => ({
        toggleColorMode: () => {
            setMode((prev) => {
                const next = prev === 'light' ? 'dark' : 'light';
                try { localStorage.setItem('colorMode', next); } catch { }
                return next;
            });
        },
        mode,
    }), [mode]);

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/data" element={<DataTablePage />} />
                            <Route path="/upload" element={<UploadPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}
