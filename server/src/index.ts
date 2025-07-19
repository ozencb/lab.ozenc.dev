import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api.js';
import projectRouter from './routes/projects.js';

// Load environment variables
config();

const app: express.Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Development mode enhancements
const isDevelopment = NODE_ENV === 'development';
let manifestWatcher: fs.FSWatcher | null = null;

// Enhanced logging for development
if (isDevelopment) {
  console.log('🔧 Development mode enabled with enhanced features:');
  console.log('   • File watching for manifest.json');
  console.log('   • Automatic cache invalidation');
  console.log('   • Enhanced error reporting');
  console.log('   • CORS enabled for all origins');
}

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts in development
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", isDevelopment ? 'ws:' : ''], // Allow WebSocket connections in development
    }
  }
}));

app.use(cors({
  origin: isDevelopment ? true : process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

app.use(compression());

// Enhanced logging middleware for development
if (isDevelopment) {
  app.use(morgan('dev'));
  
  // Development middleware for request timing and detailed logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 100) { // Log slow requests
        console.log(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
    });
    next();
  });
  
  // Development middleware for error tracking
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        console.log(`❌ Error response: ${res.statusCode} for ${req.method} ${req.path}`);
      }
    });
    next();
  });
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development file watching setup
if (isDevelopment) {
  // Watch manifest.json for changes
  const manifestPath = path.join(process.cwd(), '..', 'manifest.json');
  
  try {
    manifestWatcher = fs.watch(manifestPath, (eventType) => {
      if (eventType === 'change') {
        console.log('📋 Manifest.json changed - cache will be invalidated automatically');
      }
    });
    console.log('👀 Watching manifest.json for changes');
  } catch (error) {
    console.log('⚠️  Could not watch manifest.json:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Static file serving for project assets
// Serve static files from individual project build directories
app.use('/assets', express.static(path.join(process.cwd(), '..', 'apps'), {
  maxAge: isDevelopment ? '0' : '1y',
  etag: true,
  lastModified: true,
  // Enhanced headers for development
  setHeaders: (res, path) => {
    if (isDevelopment) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Development hot reload endpoint (for browser refresh)
if (isDevelopment) {
  app.get('/api/dev/reload', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Development server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Development manifest info endpoint
  app.get('/api/dev/manifest-info', async (_req, res) => {
    try {
      const manifestPath = path.join(process.cwd(), '..', 'manifest.json');
      const stats = await fs.promises.stat(manifestPath);
      res.json({
        exists: true,
        path: manifestPath,
        lastModified: stats.mtime,
        size: stats.size,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(404).json({
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Route handlers
app.use('/api', apiRouter);
app.use('/', projectRouter);

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found',
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handler for development
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('💥 Server Error:', err);
  
  if (isDevelopment) {
    // Detailed error information in development
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      development: true
    });
  } else {
    // Minimal error information in production
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully');
  if (manifestWatcher) {
    manifestWatcher.close();
    console.log('📋 Stopped watching manifest.json');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🔄 Received SIGINT, shutting down gracefully');
  if (manifestWatcher) {
    manifestWatcher.close();
    console.log('📋 Stopped watching manifest.json');
  }
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  if (isDevelopment) {
    console.log(`🔧 Development endpoints:`);
    console.log(`   • Reload status: http://localhost:${PORT}/api/dev/reload`);
    console.log(`   • Manifest info: http://localhost:${PORT}/api/dev/manifest-info`);
    console.log(`   • Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`   • Hub app: http://localhost:${PORT}/`);
  }
});

// Enhanced error handling for server startup
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
});

export default app; 
