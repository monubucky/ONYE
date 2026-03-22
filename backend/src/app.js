require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { apiKeyAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const reconcileRoutes = require('./routes/reconcile');
const cacheService = require('./services/cacheService');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'EHR Reconciliation Engine',
    version: '1.0.0',
    cache: cacheService.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// API routes (auth required)
app.use('/api', apiKeyAuth);
app.use('/api/reconcile', reconcileRoutes);
// Also mount validate route on the same router
app.use('/api', reconcileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use(errorHandler);

module.exports = app;
