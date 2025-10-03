import fs from 'fs/promises';
import path from 'path';
import { Manifest, ProjectManifest } from '../types/index.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  project?: string;
}

export const validateProjectManifest = (
  project: ProjectManifest
): ValidationResult => {
  const errors: string[] = [];

  if (!project.slug || typeof project.slug !== 'string') {
    errors.push('slug is required and must be a string');
  } else {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(project.slug)) {
      errors.push(
        'slug must be in kebab-case format (lowercase letters, numbers, and hyphens only)'
      );
    }
  }

  if (!project.name || typeof project.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!project.directory || typeof project.directory !== 'string') {
    errors.push('directory is required and must be a string');
  } else {
    const dirRegex = /^[a-zA-Z0-9_/-]+$/;
    if (!dirRegex.test(project.directory)) {
      errors.push(
        'directory must contain only alphanumeric characters, hyphens, underscores, and forward slashes'
      );
    }
  }

  if (!project.entryPoint || typeof project.entryPoint !== 'string') {
    errors.push('entryPoint is required and must be a string');
  }

  if (
    project.description !== undefined &&
    typeof project.description !== 'string'
  ) {
    errors.push('description must be a string if provided');
  }

  if (
    project.published !== undefined &&
    typeof project.published !== 'boolean'
  ) {
    errors.push('published must be a boolean if provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
    project: project.slug,
  };
};

export const checkDuplicateSlugs = (
  projects: ProjectManifest[]
): ValidationResult => {
  const slugCounts = new Map<string, number>();
  const errors: string[] = [];

  for (const project of projects) {
    if (project.slug) {
      const count = slugCounts.get(project.slug) || 0;
      slugCounts.set(project.slug, count + 1);
    }
  }

  for (const [slug, count] of slugCounts.entries()) {
    if (count > 1) {
      errors.push(`Duplicate slug found: "${slug}" appears ${count} times`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const checkDuplicateDirectories = (
  projects: ProjectManifest[]
): ValidationResult => {
  const directoryCounts = new Map<string, number>();
  const errors: string[] = [];

  for (const project of projects) {
    if (project.directory) {
      const count = directoryCounts.get(project.directory) || 0;
      directoryCounts.set(project.directory, count + 1);
    }
  }

  for (const [directory, count] of directoryCounts.entries()) {
    if (count > 1) {
      errors.push(
        `Duplicate directory found: "${directory}" appears ${count} times`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const verifyProjectDirectories = async (
  projects: ProjectManifest[],
  baseDir: string = process.cwd()
): Promise<ValidationResult> => {
  const errors: string[] = [];

  for (const project of projects) {
    const projectDir = path.join(baseDir, 'apps', project.directory);

    try {
      const dirStats = await fs.stat(projectDir);
      if (!dirStats.isDirectory()) {
        errors.push(
          `Project directory "${project.directory}" exists but is not a directory`
        );
        continue;
      }

      const entryPointPath = path.join(projectDir, project.entryPoint);
      const buildEntryPointPath = path.join(
        projectDir,
        'dist',
        project.entryPoint
      );
      const altBuildEntryPointPath = path.join(
        projectDir,
        'build',
        project.entryPoint
      );

      try {
        await fs.access(entryPointPath);
      } catch {
        try {
          await fs.access(buildEntryPointPath);
        } catch {
          try {
            await fs.access(altBuildEntryPointPath);
          } catch {
            errors.push(
              `Entry point "${project.entryPoint}" not found in "${project.directory}" or its build directories`
            );
          }
        }
      }
    } catch (error) {
      errors.push(
        `Project directory "${project.directory}" does not exist or is not accessible`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateManifest = (manifest: Manifest): ValidationResult => {
  const errors: string[] = [];

  if (!manifest.projects || !Array.isArray(manifest.projects)) {
    errors.push('manifest must have a projects array');
    return { isValid: false, errors };
  }

  for (const project of manifest.projects) {
    const projectValidation = validateProjectManifest(project);
    if (!projectValidation.isValid) {
      errors.push(
        ...projectValidation.errors.map(
          error => `Project "${project.slug || 'unknown'}": ${error}`
        )
      );
    }
  }

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
    errors,
  };
};

export const validateManifestFile = async (
  manifestPath: string
): Promise<ValidationResult> => {
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);

    const manifestValidation = validateManifest(manifest);
    if (!manifestValidation.isValid) {
      return manifestValidation;
    }

    const baseDir = path.dirname(manifestPath);
    const directoryValidation = await verifyProjectDirectories(
      manifest.projects,
      baseDir
    );

    return {
      isValid: manifestValidation.isValid && directoryValidation.isValid,
      errors: [...manifestValidation.errors, ...directoryValidation.errors],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Failed to read or parse manifest file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
};

export const formatValidationErrors = (result: ValidationResult): string => {
  if (result.isValid) {
    return 'Validation passed successfully!';
  }

  const projectPrefix = result.project ? `[${result.project}] ` : '';
  const errorList = result.errors
    .map(error => `  - ${projectPrefix}${error}`)
    .join('\n');

  return `Validation failed with ${result.errors.length} error(s):\n${errorList}`;
};
