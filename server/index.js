/**
 * server/index.js – Express application entry point.
 *
 * Registers routes, connects to MongoDB, and starts the HTTP server.
 */
require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:4173',   // Vite preview
  /\.vercel\.app$/,          // Any Vercel deployment (preview + production)
  process.env.CLIENT_ORIGIN, // Explicit production URL (set in Render env vars)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Render health checks)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    allowed
      ? callback(null, true)
      : callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());


// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/countries', require('./routes/countries'));
app.use('/api/evaluate',  require('./routes/evaluate'));
app.use('/api/history',   require('./routes/history'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ── MongoDB Connection + Server Start ─────────────────────────────────────────
const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aetheris_risk';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Aetheris Risk server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.warn('Starting server WITHOUT database (history disabled)');
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
  });
