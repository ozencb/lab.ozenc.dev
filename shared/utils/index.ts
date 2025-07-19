/**
 * Shared utilities for the lab.ozenc.dev monorepo
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectManifest, Manifest } from '../types/index.js';

/**
 * Validation error interface
 */
export interface ValidationError {
  field?: string;
  message: string;
  project?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a single ProjectManifest object
 */
export const validateProjectManifest = (project: ProjectManifest): ValidationResult => {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!project.slug || typeof project.slug !== 'string') {
    errors.push({ field: 'slug', message: 'Slug is required and must be a string', project: project.name || 'unknown' });
  }

  if (!project.name || typeof project.name !== 'string') {
    errors.push({ field: 'name', message: 'Name is required and must be a string', project: project.slug || 'unknown' });
  }

  if (!project.directory || typeof project.directory !== 'string') {
    errors.push({ field: 'directory', message: 'Directory is required and must be a string', project: project.slug || 'unknown' });
  }

  if (!project.entryPoint || typeof project.entryPoint !== 'string') {
    errors.push({ field: 'entryPoint', message: 'Entry point is required and must be a string', project: project.slug || 'unknown' });
  }

  // Validate slug format (URL-safe)
  if (project.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
    errors.push({ 
      field: 'slug', 
      message: 'Slug must be lowercase, alphanumeric, and may contain hyphens (kebab-case)', 
      project: project.slug 
    });
  }

  // Validate directory format (no special characters except hyphens and underscores)
  if (project.directory && !/^[a-zA-Z0-9_-]+$/.test(project.directory)) {
    errors.push({ 
      field: 'directory', 
      message: 'Directory name must contain only alphanumeric characters, hyphens, and underscores', 
      project: project.slug || 'unknown' 
    });
  }

  // Validate optional fields if provided
  if (project.description && typeof project.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string', project: project.slug || 'unknown' });
  }

  if (project.version && typeof project.version !== 'string') {
    errors.push({ field: 'version', message: 'Version must be a string', project: project.slug || 'unknown' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Checks for duplicate slugs in a list of projects
 */
export const checkDuplicateSlugs = (projects: ProjectManifest[]): ValidationError[] => {
  const slugCounts = new Map<string, number>();
  const errors: ValidationError[] = [];

  projects.forEach(project => {
    if (project.slug) {
      slugCounts.set(project.slug, (slugCounts.get(project.slug) || 0) + 1);
    }
  });

  slugCounts.forEach((count, slug) => {
    if (count > 1) {
      errors.push({
        field: 'slug',
        message: `Duplicate slug found: "${slug}" appears ${count} times`,
        project: slug
      });
    }
  });

  return errors;
};

/**
 * Checks for duplicate directories in a list of projects
 */
export const checkDuplicateDirectories = (projects: ProjectManifest[]): ValidationError[] => {
  const directoryCounts = new Map<string, string[]>();
  const errors: ValidationError[] = [];

  projects.forEach(project => {
    if (project.directory) {
      const existing = directoryCounts.get(project.directory) || [];
      existing.push(project.slug || 'unknown');
      directoryCounts.set(project.directory, existing);
    }
  });

  directoryCounts.forEach((projectSlugs, directory) => {
    if (projectSlugs.length > 1) {
      errors.push({
        field: 'directory',
        message: `Duplicate directory found: "${directory}" used by projects: ${projectSlugs.join(', ')}`,
        project: projectSlugs.join(', ')
      });
    }
  });

  return errors;
};

/**
 * Verifies that project directories exist and contain entry points
 */
export const verifyProjectDirectories = (projects: ProjectManifest[], rootPath: string = process.cwd()): ValidationError[] => {
  const errors: ValidationError[] = [];

  projects.forEach(project => {
    if (!project.directory || !project.entryPoint) return;

    const projectPath = join(rootPath, 'apps', project.directory);
    const entryPointPath = join(projectPath, project.entryPoint);

    // Check if project directory exists
    if (!existsSync(projectPath)) {
      errors.push({
        field: 'directory',
        message: `Project directory does not exist: apps/${project.directory}`,
        project: project.slug || 'unknown'
      });
      return;
    }

    // Check if entry point exists
    if (!existsSync(entryPointPath)) {
      errors.push({
        field: 'entryPoint',
        message: `Entry point file does not exist: apps/${project.directory}/${project.entryPoint}`,
        project: project.slug || 'unknown'
      });
    }
  });

  return errors;
};

/**
 * Validates an entire manifest object
 */
export const validateManifest = (manifest: Manifest, rootPath?: string): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate manifest structure
  if (!manifest.projects || !Array.isArray(manifest.projects)) {
    errors.push({ message: 'Manifest must contain a projects array' });
    return { isValid: false, errors };
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push({ message: 'Manifest must contain a version string' });
  }

  if (!manifest.lastUpdated || typeof manifest.lastUpdated !== 'string') {
    errors.push({ message: 'Manifest must contain a lastUpdated string' });
  }

  // Validate each project
  manifest.projects.forEach(project => {
    const projectValidation = validateProjectManifest(project);
    errors.push(...projectValidation.errors);
  });

  // Check for duplicates
  errors.push(...checkDuplicateSlugs(manifest.projects));
  errors.push(...checkDuplicateDirectories(manifest.projects));

  // Verify directories if rootPath provided
  if (rootPath) {
    errors.push(...verifyProjectDirectories(manifest.projects, rootPath));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Reads and validates a manifest file from disk
 */
export const validateManifestFile = (manifestPath: string, rootPath?: string): ValidationResult => {
  try {
    // Read manifest file
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);

    // Validate the manifest
    return validateManifest(manifest, rootPath);
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        message: `Failed to read or parse manifest file: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
};

/**
 * Formats validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return 'No validation errors found.';

  return errors.map(error => {
    let message = `• ${error.message}`;
    if (error.field) message += ` (field: ${error.field})`;
    if (error.project) message += ` (project: ${error.project})`;
    return message;
  }).join('\n');
};

/**
 * Creates a default manifest structure
 */
export const createDefaultManifest = (): Manifest => {
  return {
    projects: [],
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
}; 
