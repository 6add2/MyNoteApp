import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { connectDatabase } from './config/database';
import { WSController } from './websocket/WSController';

// Import routes
import authRoutes from './api/routes/auth';
import notesRoutes from './api/routes/notes';
import aiRoutes from './api/routes/ai';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security: Helmet adds various HTTP headers for protection
// - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
// - X-Frame-Options: SAMEORIGIN (prevents clickjacking)
// - X-XSS-Protection: 0 (legacy XSS protection, modern browsers use CSP)
// - And more...
app.use(helmet());

// Security: Rate limiting to prevent brute force attacks
// High limits for development-friendly debugging
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit: 1000 requests per 15 minutes per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Stricter rate limiting for auth endpoints (prevent password brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 login/register attempts per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration
// Support multiple allowed origins via CORS_ORIGIN env (comma-separated),
// e.g. "http://localhost:5173,capacitor-electron://-"
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header) by default
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (PDFs, images, etc.)
// Allow these resources to be embedded from other origins (e.g. frontend dev server on :5173)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Real-Time Multi-Modal Collaborative Notes API',
    docs: '/health, /api/auth, /api/notes, /api/ai',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/ai', aiRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Create HTTP server so we can attach WebSocket server for Yjs
    const server = http.createServer(app);

    // Attach Yjs WebSocket handling
    WSController.attachToServer(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API available at http://localhost:${PORT}/api`);
      console.log(`🔗 Yjs websocket available at ws://localhost:${PORT}/yjs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export { app, startServer };
