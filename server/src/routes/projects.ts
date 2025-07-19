import { Router, Request, Response } from 'express';

const projectRouter: Router = Router();

// Hub app route (root route)
projectRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'lab.ozenc.dev - Experimental Web Applications Hub',
    version: '1.0.0',
    status: 'ok',
    description: 'Central hub for discovering and navigating experimental web projects',
    timestamp: new Date().toISOString()
  });
});

// Dynamic project slug route (placeholder for future implementation)
projectRouter.get('/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  
  // Validate slug format (basic validation)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Project slug must contain only lowercase letters, numbers, and hyphens',
      slug,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(501).json({
    error: 'Not Implemented',
    message: `Project serving for '${slug}' will be implemented in Phase 3.2`,
    slug,
    timestamp: new Date().toISOString()
  });
});

export default projectRouter; 
