import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureSafeAuth0Config } from './utils/envValidation';
import { connectToDatabase } from './config/database';
import gptRoutes from './routes/gptRoute';
import authRoutes from './routes/authRoute';
import mongoAuthRoutes from './routes/mongoAuthRoute';
import transformRoutes from './routes/transformRoute';
import userRoutes from './routes/userRoute';
import monitorRoutes from './routes/monitorRoute';
import { verifyAuth0Token, syncAuth0User } from './middleware/auth0Middleware';
import { trackMigrationProgress } from './middleware/migrationTracker';
import trackUsage from './middleware/usageMiddleware';

dotenv.config();

// Validate Auth0 configuration
ensureSafeAuth0Config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
connectToDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(trackMigrationProgress);

// Health check endpoints
app.get('/', (_req, res) => {
    res.json({ 
        message: 'PagePersonAI API',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (_req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/monitor', monitorRoutes);
app.use('/api/transform', transformRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth/deprecated', authRoutes);
app.use('/api/auth/mongo', mongoAuthRoutes);
app.use('/api/gpt', verifyAuth0Token, syncAuth0User, trackUsage, gptRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            error: 'Invalid or missing token',
            details: err.message
        });
        return;
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Protected route example
app.get('/api/protected', verifyAuth0Token, syncAuth0User, (req, res) => {
    res.json({ 
        message: 'Authentication successful',
        user: (req as any).user
    });
});

// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/health - Health check');
    console.log('  GET  /api/transform/personas - Available personas');
    console.log('  POST /api/transform - Transform content');
    console.log('  GET  /api/user/profile - User profile (protected)');
    console.log('  PUT  /api/user/profile - Update profile (protected)');
}).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        console.error('Try: netstat -ano | findstr :' + PORT + ' to find the process');
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});
