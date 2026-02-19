import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload-routes.js';
import productsRoutes from './routes/products-routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { migrate } from './migrate.js';

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running. products table is ready.',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/products', productsRoutes);

app.use(notFound);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        // Full boot sequence: schema init → v2 upgrades → auto-seed if empty
        await migrate();

        app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health: http://localhost:${PORT}/health`);
            console.log(`🔗 API:    http://localhost:${PORT}/api/products`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
