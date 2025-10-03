import { Router, Request, Response } from 'express';
import { Loaders } from '../loaders';

const apiRouter = (isDevelopment: boolean): Router => {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  router.get('/projects', async (_req: Request, res: Response) => {
    try {
      const manifest = await Loaders.getManifest();
      if (!manifest) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Could not load project manifest',
          timestamp: new Date().toISOString(),
        });
      }

      const projects = manifest.projects
        .filter(project => project.published || isDevelopment)
        .map((project: any) => {
          return {
            name: project.name,
            description: project.description,
            url: `/${project.slug}`,
          };
        });
      return res.json({
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

  return router;
};

export default apiRouter;
