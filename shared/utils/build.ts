import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { ProjectManifest, ProjectBuildConfig } from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Validation result for project build configuration
 */
export interface BuildValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Build execution result
 */
export interface BuildResult {
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
  outputPath?: string;
}

/**
 * Development server process information
 */
export interface DevServerProcess {
  pid: number;
  port: number;
  projectSlug: string;
  url: string;
}

/**
 * Project configuration with build settings
 */
export interface ProjectConfig {
  manifest: ProjectManifest;
  buildConfig: ProjectBuildConfig;
  packageJsonPath: string;
  projectPath: string;
}

/**
 * Validates a project's build configuration
 */
export const validateProjectBuildConfig = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig
): Promise<BuildValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if project directory exists
    const projectStats = await fs.stat(projectPath);
    if (!projectStats.isDirectory()) {
      errors.push(`Project path ${projectPath} is not a directory`);
    }

    // Check if package.json exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
      
      // Validate package.json contents
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Check for required scripts
      if (!packageJson.scripts) {
        warnings.push('No scripts section found in package.json');
      } else {
        if (!packageJson.scripts.build && !buildConfig.buildCommand) {
          warnings.push('No build script found in package.json and no buildCommand specified');
        }
        
        if (!packageJson.scripts.dev && !buildConfig.devCommand) {
          warnings.push('No dev script found in package.json and no devCommand specified');
        }
      }
    } catch (error) {
      errors.push(`package.json not found or invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check build command
    if (!buildConfig.buildCommand || buildConfig.buildCommand.trim().length === 0) {
      errors.push('Build command is required');
    }

    // Check development command
    if (!buildConfig.devCommand || buildConfig.devCommand.trim().length === 0) {
      errors.push('Development command is required');
    }

    // Check output directory
    if (!buildConfig.outputDir || buildConfig.outputDir.trim().length === 0) {
      errors.push('Output directory is required');
    }

    // Validate port number if specified
    if (buildConfig.devPort !== undefined) {
      if (!Number.isInteger(buildConfig.devPort) || buildConfig.devPort < 1 || buildConfig.devPort > 65535) {
        errors.push('Development port must be a valid port number (1-65535)');
      }
    }

  } catch (error) {
    errors.push(`Error validating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Discovers project configuration from directory
 */
export const discoverProjectConfig = async (
  projectPath: string,
  manifest: ProjectManifest
): Promise<ProjectConfig | null> => {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    // Check if package.json exists
    try {
      await fs.access(packageJsonPath);
    } catch {
      return null; // Not a valid project if no package.json
    }

    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Create default build configuration
    const buildConfig: ProjectBuildConfig = {
      slug: manifest.slug,
      buildCommand: packageJson.scripts?.build || 'npm run build',
      devCommand: packageJson.scripts?.dev || packageJson.scripts?.start || 'npm run dev',
      outputDir: 'dist', // Default, can be overridden
      devPort: undefined // Will be assigned dynamically
    };

    // Try to detect common build output directories
    const commonOutputDirs = ['dist', 'build', 'out', 'public'];
    for (const dir of commonOutputDirs) {
      const outputPath = path.join(projectPath, dir);
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isDirectory()) {
          buildConfig.outputDir = dir;
          break;
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return {
      manifest,
      buildConfig,
      packageJsonPath,
      projectPath
    };

  } catch (error) {
    console.warn(`Failed to discover project config for ${manifest.slug}:`, error);
    return null;
  }
};

/**
 * Builds a project using its build configuration
 */
export const buildProject = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig
): Promise<BuildResult> => {
  const startTime = Date.now();
  
  try {
    // Change to project directory and run build command
    const { stdout, stderr } = await execAsync(buildConfig.buildCommand, {
      cwd: projectPath,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    const duration = Date.now() - startTime;
    const outputPath = path.join(projectPath, buildConfig.outputDir);

    // Verify output directory was created
    try {
      await fs.access(outputPath);
    } catch {
      return {
        success: false,
        error: `Build completed but output directory ${buildConfig.outputDir} not found`,
        duration,
        output: stdout + stderr
      };
    }

    return {
      success: true,
      output: stdout,
      duration,
      outputPath
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown build error',
      duration
    };
  }
};

/**
 * Builds multiple projects in parallel
 */
export const buildProjects = async (
  projectConfigs: ProjectConfig[],
  maxConcurrent: number = 3
): Promise<Map<string, BuildResult>> => {
  const results = new Map<string, BuildResult>();
  const batches: ProjectConfig[][] = [];
  
  // Split projects into batches
  for (let i = 0; i < projectConfigs.length; i += maxConcurrent) {
    batches.push(projectConfigs.slice(i, i + maxConcurrent));
  }

  // Process batches sequentially, projects within batch in parallel
  for (const batch of batches) {
    const batchPromises = batch.map(async (config) => {
      const result = await buildProject(config.projectPath, config.buildConfig);
      return { slug: config.manifest.slug, result };
    });

    const batchResults = await Promise.all(batchPromises);
    
    for (const { slug, result } of batchResults) {
      results.set(slug, result);
    }
  }

  return results;
};

/**
 * Starts a development server for a project
 */
export const startDevServer = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig,
  port?: number
): Promise<DevServerProcess | null> => {
  try {
    const devPort = port || buildConfig.devPort || await findAvailablePort();
    
    // Set environment variables for development
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      PORT: devPort.toString()
    };

    // Start the development server
    const child = spawn('sh', ['-c', buildConfig.devCommand], {
      cwd: projectPath,
      env,
      detached: true,
      stdio: 'pipe'
    });

    // Wait a bit to ensure the server starts
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if process is still running
    if (child.killed || child.exitCode !== null) {
      return null;
    }

    return {
      pid: child.pid!,
      port: devPort,
      projectSlug: buildConfig.slug,
      url: `http://localhost:${devPort}`
    };

  } catch (error) {
    console.error(`Failed to start dev server for ${buildConfig.slug}:`, error);
    return null;
  }
};

/**
 * Finds an available port for development server
 */
export const findAvailablePort = async (startPort: number = 3000): Promise<number> => {
  const net = await import('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is in use, try next one
      findAvailablePort(startPort + 1).then(resolve).catch(reject);
    });
  });
};

/**
 * Cleans build artifacts for a project
 */
export const cleanProject = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig
): Promise<boolean> => {
  try {
    const outputPath = path.join(projectPath, buildConfig.outputDir);
    
    try {
      await fs.access(outputPath);
      await fs.rm(outputPath, { recursive: true, force: true });
      console.log(`Cleaned ${outputPath}`);
      return true;
    } catch {
      // Directory doesn't exist, nothing to clean
      return true;
    }
  } catch (error) {
    console.error(`Failed to clean project ${buildConfig.slug}:`, error);
    return false;
  }
};

/**
 * Cleans build artifacts for multiple projects
 */
export const cleanProjects = async (projectConfigs: ProjectConfig[]): Promise<Map<string, boolean>> => {
  const results = new Map<string, boolean>();
  
  for (const config of projectConfigs) {
    const success = await cleanProject(config.projectPath, config.buildConfig);
    results.set(config.manifest.slug, success);
  }
  
  return results;
};

/**
 * Checks if a project has been built
 */
export const isProjectBuilt = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig
): Promise<boolean> => {
  try {
    const outputPath = path.join(projectPath, buildConfig.outputDir);
    const stats = await fs.stat(outputPath);
    
    if (!stats.isDirectory()) {
      return false;
    }

    // Check if output directory has files
    const files = await fs.readdir(outputPath);
    return files.length > 0;
    
  } catch {
    return false;
  }
};

/**
 * Gets build information for a project
 */
export const getProjectBuildInfo = async (
  projectPath: string,
  buildConfig: ProjectBuildConfig
) => {
  const isBuilt = await isProjectBuilt(projectPath, buildConfig);
  let lastBuild: Date | null = null;
  
  if (isBuilt) {
    try {
      const outputPath = path.join(projectPath, buildConfig.outputDir);
      const stats = await fs.stat(outputPath);
      lastBuild = stats.mtime;
    } catch {
      // Ignore stat errors
    }
  }
  
  return {
    isBuilt,
    lastBuild,
    outputPath: isBuilt ? path.join(projectPath, buildConfig.outputDir) : null
  };
}; 
