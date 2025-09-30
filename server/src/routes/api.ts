import { Router, Request, Response } from 'express';
import { Loaders } from '../loaders';

const apiRouter: Router = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// GET /api/projects - List all projects from manifest
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const manifest = await Loaders.getManifest();
    if (!manifest) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not load project manifest',
        timestamp: new Date().toISOString(),
      });
    }

    const projects = await Promise.all(
      manifest.projects.map(async (project: any) => {
        return {
          ...project,
          url: `/${project.slug}`,
        };
      })
    );

    return res.json({
      version: manifest.version || '1.0.0',
      lastUpdated: manifest.lastUpdated,
      totalProjects: projects.length,
      projects,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/projects:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve projects',
      timestamp: new Date().toISOString(),
    });
  }
});

export default apiRouter;
