import { Router, Request, Response } from 'express';

const apiRouter: Router = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Projects endpoints (placeholder for future implementation)
apiRouter.get('/projects', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Projects listing endpoint will be implemented in Phase 3.3',
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/projects/:slug', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: `Project info endpoint for '${req.params.slug}' will be implemented in Phase 3.3`,
    timestamp: new Date().toISOString()
  });
});

// Validation endpoint (development only)
apiRouter.post('/projects/validate', (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Validation endpoint is only available in development mode',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(501).json({
    error: 'Not Implemented',
    message: 'Manifest validation endpoint will be implemented in Phase 3.3',
    timestamp: new Date().toISOString()
  });
});

export default apiRouter; 
