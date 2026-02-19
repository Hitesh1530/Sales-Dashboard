import { createTheme } from '@mui/material/styles';

/**
 * Create MUI theme for light or dark mode
 */
export const createAppTheme = (mode = 'light') =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: '#6366f1',
                light: '#818cf8',
                dark: '#4f46e5',
            },
            secondary: {
                main: '#ec4899',
                light: '#f472b6',
                dark: '#db2777',
            },
            success: { main: '#10b981' },
            warning: { main: '#f59e0b' },
            error: { main: '#ef4444' },
            background: {
                default: mode === 'dark' ? '#0f172a' : '#f8fafc',
                paper: mode === 'dark' ? '#1e293b' : '#ffffff',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 700 },
            h6: { fontWeight: 600 },
        },
        components: {
            MuiButton: {
                styleOverrides: { root: { textTransform: 'none', borderRadius: 8, fontWeight: 500 } },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: mode === 'dark'
                            ? '0 2px 12px rgba(0,0,0,0.4)'
                            : '0 2px 8px rgba(0,0,0,0.08)',
                    },
                },
            },
        },
    });

// Default export for backwards compat
export const theme = createAppTheme('light');
export default theme;
