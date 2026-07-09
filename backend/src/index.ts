import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the backend directory explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import importRouter from './routes/import';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      if (process.env.FRONTEND_URL) {
        const isAllowed = allowedOrigins.some(o => origin === o || origin.replace(/\/$/, '') === o.replace(/\/$/, ''));
        if (isAllowed) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
      // If FRONTEND_URL is not defined, allow all to avoid setup friction
      return callback(null, true);
    }
    
    // In development, allow local and other origins
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'GrowEasy CSV Importer API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/import', importRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   GrowEasy CSV Importer API               ║
║   Running on http://localhost:${PORT}         ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Groq API Key Configured: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}             ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
