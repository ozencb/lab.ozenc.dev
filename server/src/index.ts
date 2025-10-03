import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api';
import projectsRouter from './routes/projects';

config();

const app: express.Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const isDevelopment = NODE_ENV === 'development';

let manifestWatcher: fs.FSWatcher | null = null;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'blob:'],
      },
    },
  })
);

app.use(
  cors({
    origin: isDevelopment ? true : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  })
);

app.use(compression());

if (isDevelopment) {
  app.use(morgan('dev'));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 100) {
        // Log slow requests
        console.log(
          `⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`
        );
      }
    });
    next();
  });

  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        console.log(
          `❌ Error response: ${res.statusCode} for ${req.method} ${req.path}`
        );
      }
    });
    next();
  });
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (isDevelopment) {
  const manifestPath = path.join(process.cwd(), '..', 'manifest.json');

  try {
    manifestWatcher = fs.watch(manifestPath, eventType => {
      if (eventType === 'change') {
        console.log(
          '📋 Manifest.json changed - cache will be invalidated automatically'
        );
      }
    });
    console.log('👀 Watching manifest.json for changes');
  } catch (error) {
    console.log(
      '⚠️  Could not watch manifest.json:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

app.use('/api', apiRouter(isDevelopment));
app.use('/', projectsRouter);

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found',
    timestamp: new Date().toISOString(),
  });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('💥 Server Error:', err);

    if (isDevelopment) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        development: true,
      });
    } else {
      // Minimal error information in production
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

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

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

  if (isDevelopment) {
    console.log(`🔧 Development endpoints:`);
    console.log(`   • Projects API: http://localhost:${PORT}/api/projects`);
    console.log(`   • Hub app: http://localhost:${PORT}/`);
  }
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `❌ Port ${PORT} is already in use. Please use a different port.`
    );
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
});

export default app;
