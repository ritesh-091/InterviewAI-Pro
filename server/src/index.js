const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { metricsMiddleware, getPrometheusMetrics } = require('./services/monitorService');
const compression = require('compression');
const morgan = require('morgan');

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();

    const app = express();
    const server = http.createServer(app);

    // 2. Initialize WebSocket service and AI services after db connection
    const { initWebSocket } = require('./services/websocketService');
    initWebSocket(server);

    const ai = require('./config/gemini');

    // Track all HTTP telemetry coordinates
    app.use(metricsMiddleware);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Middleware
    app.use(helmet({
      crossOriginResourcePolicy: false // Allows loading assets/PDFs on the client
    }));
    app.use(compression());
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve uploaded reports/resumes
    app.use('/uploads', express.static(uploadsDir));

    // Apply global rate limiting to all /api routes
    app.use('/api', apiLimiter);

    // API Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/resumes', require('./routes/resumes'));
    app.use('/api/interviews', require('./routes/interviews'));
    app.use('/api/coding', require('./routes/coding'));
    app.use('/api/coach', require('./routes/coach'));
    app.use('/api/companies', require('./routes/companies'));
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/recruiter', require('./routes/recruiter'));
    app.use('/api/schedule', require('./routes/schedule'));

    // Telemetry Prometheus Scrape Endpoint
    app.get('/metrics', getPrometheusMetrics);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date() });
    });

    // Temporary Gemini Verification Route
    app.get('/test', async (req, res) => {
      try {
        if (!ai) {
          return res.status(500).json({ error: 'Gemini service is not configured' });
        }
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Hello Gemini",
        });

        res.json({
          reply: response.text,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Serve static assets from the React client build directory
    const clientBuildPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientBuildPath));

    // Serve index.html for all non-API paths (to let React Router handle client-side routing)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/metrics') || req.path.startsWith('/health')) {
        return next();
      }
      const indexPath = path.join(clientBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend build not found. Please run npm run build in the client directory.');
      }
    });

    // Error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
