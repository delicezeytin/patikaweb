import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Routes
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import teachersRoutes from './routes/teachers';
import classesRoutes from './routes/classes';
import formsRoutes from './routes/forms';
import menuRoutes from './routes/menu';
import scheduleRoutes from './routes/schedule';
import documentsRoutes from './routes/documents';
import settingsRoutes from './routes/settings';
import meetingRoutes from './routes/meetings';
import uploadRoutes from './routes/upload';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://patika.noxdo.com', 'https://www.patika.noxdo.com', 'http://localhost:3000']
        : ['http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: (error as Error).message });
    }
});

// Serve Uploads Static Directory
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/upload', uploadRoutes);

// Serve Frontend Static Files (Fallback for "Node.js" Stack)
const frontendPath = path.join(__dirname, '../../dist');

// 1. Serve static files
app.use(express.static(frontendPath));

// 2. Handle React Routing (SPA) - Return index.html for all non-API requests
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export { prisma };
