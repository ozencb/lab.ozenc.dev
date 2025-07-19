import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const apiRouter: Router = Router();

// Cache for manifest data to avoid repeated file reads
let manifestCache: any = null;
let manifestLastModified: number = 0;

// Function to get fresh manifest data
const getManifest = async () => {
  try {
    const manifestPath = path.join(process.cwd(), '..', 'manifest.json');
    const stats = await fs.promises.stat(manifestPath);
    
    // Check if manifest needs to be reloaded
    if (!manifestCache || stats.mtimeMs > manifestLastModified) {
      // Read and parse manifest file
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      
      // Basic validation - check if manifest has projects array
      if (!manifest || !Array.isArray(manifest.projects)) {
        console.error('Manifest validation failed: Invalid manifest structure');
        return null;
      }
      
      manifestCache = manifest;
      manifestLastModified = stats.mtimeMs;
    }
    
    return manifestCache;
  } catch (error) {
    console.error('Error reading manifest:', error);
    return null;
  }
};

// Function to check if project build exists
const checkProjectBuild = async (projectDir: string): Promise<{ exists: boolean; buildDir?: string }> => {
  const projectPath = path.join(process.cwd(), '..', 'apps', projectDir);
  const buildDirs = ['dist', 'build', 'out'];
  
  for (const buildDir of buildDirs) {
    const buildPath = path.join(projectPath, buildDir);
    try {
      const stats = await fs.promises.stat(buildPath);
      if (stats.isDirectory()) {
        return { exists: true, buildDir };
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }
  
  // Check if project directory exists (development mode)
  try {
    const stats = await fs.promises.stat(projectPath);
    if (stats.isDirectory()) {
      return { exists: true, buildDir: 'source' };
    }
  } catch {
    // Project directory doesn't exist
  }
  
  return { exists: false };
};

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

// GET /api/projects - List all projects from manifest
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const manifest = await getManifest();
    if (!manifest) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not load project manifest',
        timestamp: new Date().toISOString()
      });
    }

    // Enhance project data with build status
    const projectsWithStatus = await Promise.all(
      manifest.projects.map(async (project: any) => {
        const buildCheck = await checkProjectBuild(project.directory);
        return {
          ...project,
          buildStatus: buildCheck.exists ? 'built' : 'not_built',
          buildType: buildCheck.buildDir || null,
          url: `/${project.slug}`
        };
      })
    );

    return res.json({
      version: manifest.version || '1.0.0',
      lastUpdated: manifest.lastUpdated,
      totalProjects: projectsWithStatus.length,
      projects: projectsWithStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/projects:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve projects',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/projects/:slug - Get specific project info
apiRouter.get('/projects/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Project slug must contain only lowercase letters, numbers, and hyphens',
      slug,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const manifest = await getManifest();
    if (!manifest) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not load project manifest',
        timestamp: new Date().toISOString()
      });
    }

    // Find project in manifest
    const project = manifest.projects.find((p: any) => p.slug === slug);
    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Project '${slug}' not found`,
        slug,
        timestamp: new Date().toISOString()
      });
    }

    // Check build status and get additional info
    const buildCheck = await checkProjectBuild(project.directory);
    const projectInfo = {
      ...project,
      buildStatus: buildCheck.exists ? 'built' : 'not_built',
      buildType: buildCheck.buildDir || null,
      url: `/${project.slug}`,
      directoryPath: `apps/${project.directory}`,
      timestamp: new Date().toISOString()
    };

    return res.json(projectInfo);
  } catch (error) {
    console.error(`Error in /api/projects/${slug}:`, error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: `Failed to retrieve project '${slug}'`,
      slug,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/projects/validate - Validate manifest (dev only)
apiRouter.post('/projects/validate', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Validation endpoint is only available in development mode',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Try to load and parse manifest
    const manifestPath = path.join(process.cwd(), '..', 'manifest.json');
    let manifest;
    
    try {
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: 'Could not read or parse manifest.json',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!manifest || typeof manifest !== 'object') {
      errors.push('Manifest must be a valid JSON object');
    }

    if (!Array.isArray(manifest.projects)) {
      errors.push('Manifest must contain a "projects" array');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Failed',
        valid: false,
        errors,
        warnings,
        timestamp: new Date().toISOString()
      });
    }

    // Project validation
    const slugs = new Set();
    const directories = new Set();

    for (let i = 0; i < manifest.projects.length; i++) {
      const project = manifest.projects[i];
      const prefix = `Project ${i + 1}`;

      // Required field validation
      if (!project.slug || typeof project.slug !== 'string') {
        errors.push(`${prefix}: Missing or invalid "slug" field`);
      } else if (!/^[a-z0-9-]+$/.test(project.slug)) {
        errors.push(`${prefix}: Slug "${project.slug}" must contain only lowercase letters, numbers, and hyphens`);
      } else if (slugs.has(project.slug)) {
        errors.push(`${prefix}: Duplicate slug "${project.slug}"`);
      } else {
        slugs.add(project.slug);
      }

      if (!project.name || typeof project.name !== 'string') {
        errors.push(`${prefix}: Missing or invalid "name" field`);
      }

      if (!project.directory || typeof project.directory !== 'string') {
        errors.push(`${prefix}: Missing or invalid "directory" field`);
      } else if (!/^[a-zA-Z0-9_-]+$/.test(project.directory)) {
        errors.push(`${prefix}: Directory "${project.directory}" must contain only letters, numbers, underscores, and hyphens`);
      } else if (directories.has(project.directory)) {
        errors.push(`${prefix}: Duplicate directory "${project.directory}"`);
      } else {
        directories.add(project.directory);
      }

      if (!project.entryPoint || typeof project.entryPoint !== 'string') {
        errors.push(`${prefix}: Missing or invalid "entryPoint" field`);
      }

      // Optional field validation
      if (project.description && typeof project.description !== 'string') {
        warnings.push(`${prefix}: Description should be a string`);
      }

      if (project.version && typeof project.version !== 'string') {
        warnings.push(`${prefix}: Version should be a string`);
      }

      // Directory existence check
      if (project.directory) {
        const projectPath = path.join(process.cwd(), '..', 'apps', project.directory);
        try {
          const stats = await fs.promises.stat(projectPath);
          if (!stats.isDirectory()) {
            errors.push(`${prefix}: Directory "apps/${project.directory}" is not a directory`);
          } else {
            // Check entry point
            const entryPath = path.join(projectPath, project.entryPoint);
            try {
              const entryStats = await fs.promises.stat(entryPath);
              if (!entryStats.isFile()) {
                warnings.push(`${prefix}: Entry point "${project.entryPoint}" is not a file`);
              }
            } catch {
              warnings.push(`${prefix}: Entry point "${project.entryPoint}" does not exist`);
            }
          }
        } catch {
          errors.push(`${prefix}: Directory "apps/${project.directory}" does not exist`);
        }
      }
    }

    const valid = errors.length === 0;
    const status = valid ? 200 : 400;

    return res.status(status).json({
      valid,
      projectCount: manifest.projects.length,
      errors,
      warnings,
      timestamp: new Date().toISOString(),
      ...(valid && { message: 'Manifest validation passed successfully' })
    });

  } catch (error) {
    console.error('Error in /api/projects/validate:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate manifest',
      timestamp: new Date().toISOString()
    });
  }
});

export default apiRouter; 
