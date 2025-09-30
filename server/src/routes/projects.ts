import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Loaders } from '../loaders';

const projectRouter: Router = Router();

// Function to find build directory for a project
const findBuildDirectory = async (
  projectDir: string
): Promise<string | null> => {
  const projectPath = path.join(process.cwd(), '..', 'apps', projectDir);
  const buildDirs = ['dist', 'build', 'out'];

  for (const buildDir of buildDirs) {
    const buildPath = path.join(projectPath, buildDir);
    try {
      const stats = await fs.promises.stat(buildPath);
      if (stats.isDirectory()) {
        return buildPath;
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  // Fallback to project directory itself (for development)
  try {
    const stats = await fs.promises.stat(projectPath);
    if (stats.isDirectory()) {
      return projectPath;
    }
  } catch {
    // Project directory doesn't exist
  }

  return null;
};

// Function to serve static files from a directory
const serveStaticFile = async (
  res: Response,
  filePath: string,
  entryPoint: string
) => {
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isFile()) {
      return res.sendFile(filePath);
    }
  } catch {
    // File doesn't exist, try serving entry point for SPA routing
    try {
      const entryFilePath = path.join(path.dirname(filePath), entryPoint);
      const entryStats = await fs.promises.stat(entryFilePath);
      if (entryStats.isFile()) {
        return res.sendFile(entryFilePath);
      }
    } catch {
      // Entry point doesn't exist either
    }
  }

  return res.status(404).json({
    error: 'Not Found',
    message: 'The requested file could not be found',
    timestamp: new Date().toISOString(),
  });
};

// Hub app route (root route)
projectRouter.get('/', async (_req: Request, res: Response) => {
  const manifest = await Loaders.getManifest();
  if (!manifest) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not load project manifest',
      timestamp: new Date().toISOString(),
    });
  }

  // Find hub project in manifest
  const hubProject = manifest.projects.find((p: any) => p.slug === 'hub');
  if (!hubProject) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Hub project not found in manifest',
      timestamp: new Date().toISOString(),
    });
  }

  // Try to serve hub app from build directory
  const buildDir = await findBuildDirectory(hubProject.directory);
  if (buildDir) {
    const entryFile = path.join(buildDir, hubProject.entryPoint);
    return serveStaticFile(res, entryFile, hubProject.entryPoint);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: 'Hub project build not found. Please run build command.',
    timestamp: new Date().toISOString(),
  });
});

// Dynamic project slug route with static file serving
projectRouter.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      error: 'Bad Request',
      message:
        'Project slug must contain only lowercase letters, numbers, and hyphens',
      slug,
      timestamp: new Date().toISOString(),
    });
  }

  const manifest = await Loaders.getManifest();
  if (!manifest) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not load project manifest',
      timestamp: new Date().toISOString(),
    });
  }

  // Find project in manifest
  const project = manifest.projects.find((p: any) => p.slug === slug);
  if (!project) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Project '${slug}' not found in manifest`,
      slug,
      timestamp: new Date().toISOString(),
    });
  }

  // Try to serve project from build directory
  const buildDir = await findBuildDirectory(project.directory);
  if (buildDir) {
    const entryFile = path.join(buildDir, project.entryPoint);
    return serveStaticFile(res, entryFile, project.entryPoint);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Project '${slug}' build not found. Please run build command for this project.`,
    slug,
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route for serving static assets within projects
projectRouter.get('/:slug/*', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const assetPath = req.params[0]; // Everything after /:slug/

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      error: 'Bad Request',
      message:
        'Project slug must contain only lowercase letters, numbers, and hyphens',
      slug,
      timestamp: new Date().toISOString(),
    });
  }

  const manifest = await Loaders.getManifest();
  if (!manifest) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not load project manifest',
      timestamp: new Date().toISOString(),
    });
  }

  // Find project in manifest
  const project = manifest.projects.find((p: any) => p.slug === slug);
  if (!project) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Project '${slug}' not found in manifest`,
      slug,
      timestamp: new Date().toISOString(),
    });
  }

  // Try to serve asset from build directory
  const buildDir = await findBuildDirectory(project.directory);
  if (buildDir) {
    const assetFile = path.join(buildDir, assetPath);
    return serveStaticFile(res, assetFile, project.entryPoint);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Project '${slug}' build not found. Please run build command for this project.`,
    slug,
    timestamp: new Date().toISOString(),
  });
});

export default projectRouter;
