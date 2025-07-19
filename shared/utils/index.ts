/**
 * Shared utilities for the lab.ozenc.dev monorepo
 */

import fs from 'fs/promises';
import path from 'path';
import { Manifest, ProjectManifest } from '../types/index.js';

/**
 * Validation result interface for consistent error reporting
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  project?: string;
}

/**
 * Validates an individual ProjectManifest object
 */
export const validateProjectManifest = (project: ProjectManifest): ValidationResult => {
  const errors: string[] = [];

  // Check required fields
  if (!project.slug || typeof project.slug !== 'string') {
    errors.push('slug is required and must be a string');
  } else {
    // Validate slug format (kebab-case, URL-safe)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(project.slug)) {
      errors.push('slug must be in kebab-case format (lowercase letters, numbers, and hyphens only)');
    }
  }

  if (!project.name || typeof project.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!project.directory || typeof project.directory !== 'string') {
    errors.push('directory is required and must be a string');
  } else {
    // Validate directory path (alphanumeric with hyphens/underscores/slashes for nested paths)
    const dirRegex = /^[a-zA-Z0-9_/-]+$/;
    if (!dirRegex.test(project.directory)) {
      errors.push('directory must contain only alphanumeric characters, hyphens, underscores, and forward slashes');
    }
  }

  if (!project.entryPoint || typeof project.entryPoint !== 'string') {
    errors.push('entryPoint is required and must be a string');
  }

  // Validate optional fields if present
  if (project.description !== undefined && typeof project.description !== 'string') {
    errors.push('description must be a string if provided');
  }

  if (project.version !== undefined && typeof project.version !== 'string') {
    errors.push('version must be a string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
    project: project.slug
  };
};

/**
 * Checks for duplicate slugs across projects
 */
export const checkDuplicateSlugs = (projects: ProjectManifest[]): ValidationResult => {
  const slugCounts = new Map<string, number>();
  const errors: string[] = [];

  // Count occurrences of each slug
  for (const project of projects) {
    if (project.slug) {
      const count = slugCounts.get(project.slug) || 0;
      slugCounts.set(project.slug, count + 1);
    }
  }

  // Find duplicates
  for (const [slug, count] of slugCounts.entries()) {
    if (count > 1) {
      errors.push(`Duplicate slug found: "${slug}" appears ${count} times`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Checks for duplicate directories across projects
 */
export const checkDuplicateDirectories = (projects: ProjectManifest[]): ValidationResult => {
  const directoryCounts = new Map<string, number>();
  const errors: string[] = [];

  // Count occurrences of each directory
  for (const project of projects) {
    if (project.directory) {
      const count = directoryCounts.get(project.directory) || 0;
      directoryCounts.set(project.directory, count + 1);
    }
  }

  // Find duplicates
  for (const [directory, count] of directoryCounts.entries()) {
    if (count > 1) {
      errors.push(`Duplicate directory found: "${directory}" appears ${count} times`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Verifies that project directories and entry points exist on the filesystem
 */
export const verifyProjectDirectories = async (
  projects: ProjectManifest[],
  baseDir: string = process.cwd()
): Promise<ValidationResult> => {
  const errors: string[] = [];

  for (const project of projects) {
    const projectDir = path.join(baseDir, 'apps', project.directory);
    
    try {
      // Check if project directory exists
      const dirStats = await fs.stat(projectDir);
      if (!dirStats.isDirectory()) {
        errors.push(`Project directory "${project.directory}" exists but is not a directory`);
        continue;
      }

      // Check if entry point exists within the directory or its build output
      const entryPointPath = path.join(projectDir, project.entryPoint);
      const buildEntryPointPath = path.join(projectDir, 'dist', project.entryPoint);
      const altBuildEntryPointPath = path.join(projectDir, 'build', project.entryPoint);

      try {
        await fs.access(entryPointPath);
      } catch {
        try {
          await fs.access(buildEntryPointPath);
        } catch {
          try {
            await fs.access(altBuildEntryPointPath);
          } catch {
            errors.push(`Entry point "${project.entryPoint}" not found in "${project.directory}" or its build directories`);
          }
        }
      }

    } catch (error) {
      errors.push(`Project directory "${project.directory}" does not exist or is not accessible`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a complete Manifest object
 */
export const validateManifest = (manifest: Manifest): ValidationResult => {
  const errors: string[] = [];

  // Check manifest structure
  if (!manifest.projects || !Array.isArray(manifest.projects)) {
    errors.push('manifest must have a projects array');
    return { isValid: false, errors };
  }



  // Validate each project
  for (const project of manifest.projects) {
    const projectValidation = validateProjectManifest(project);
    if (!projectValidation.isValid) {
      errors.push(...projectValidation.errors.map(error => `Project "${project.slug || 'unknown'}": ${error}`));
    }
  }

  // Check for duplicates
  const slugValidation = checkDuplicateSlugs(manifest.projects);
  if (!slugValidation.isValid) {
    errors.push(...slugValidation.errors);
  }

  const directoryValidation = checkDuplicateDirectories(manifest.projects);
  if (!directoryValidation.isValid) {
    errors.push(...directoryValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates a manifest file from disk
 */
export const validateManifestFile = async (manifestPath: string): Promise<ValidationResult> => {
  try {
    // Read and parse manifest file
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);

    // Validate manifest structure
    const manifestValidation = validateManifest(manifest);
    if (!manifestValidation.isValid) {
      return manifestValidation;
    }

    // Verify project directories exist
    const baseDir = path.dirname(manifestPath);
    const directoryValidation = await verifyProjectDirectories(manifest.projects, baseDir);

    return {
      isValid: manifestValidation.isValid && directoryValidation.isValid,
      errors: [...manifestValidation.errors, ...directoryValidation.errors]
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to read or parse manifest file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

/**
 * Formats validation errors for human-readable display
 */
export const formatValidationErrors = (result: ValidationResult): string => {
  if (result.isValid) {
    return 'Validation passed successfully!';
  }

  const projectPrefix = result.project ? `[${result.project}] ` : '';
  const errorList = result.errors.map(error => `  - ${projectPrefix}${error}`).join('\n');
  
  return `Validation failed with ${result.errors.length} error(s):\n${errorList}`;
};

/**
 * Creates a default manifest structure
 */
export const createDefaultManifest = (): Manifest => {
  return {
    projects: []
  };
};

// Export build utilities
export * from './build.js'; 
