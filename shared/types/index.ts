/**
 * Central type definitions for the lab.ozenc.dev monorepo
 */

/**
 * Project manifest interface defining the structure for project metadata
 */
export interface ProjectManifest {
  /** Unique identifier for the project (used in URLs) */
  slug: string;
  
  /** Display name of the project */
  name: string;
  
  /** Unique directory name where the project is located */
  directory: string;
  
  /** Optional description of the project */
  description?: string;
  
  /** Optional version string */
  version?: string;
  
  /** Entry point file for the project (defaults to "index.html") */
  entryPoint: string;
}

/**
 * Complete manifest structure containing all projects
 */
export interface Manifest {
  /** Array of project configurations */
  projects: ProjectManifest[];
  
  /** Manifest schema version for future compatibility */
  version: string;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Project build configuration
 */
export interface ProjectBuildConfig {
  /** Project slug for identification */
  slug: string;
  
  /** Build command to execute */
  buildCommand: string;
  
  /** Development command to execute */
  devCommand: string;
  
  /** Output directory after build */
  outputDir: string;
  
  /** Port for development server (optional) */
  devPort?: number;
}

/**
 * Server configuration types
 */
export interface ServerConfig {
  /** Port for the server to listen on */
  port: number;
  
  /** Environment (development, production) */
  environment: 'development' | 'production';
  
  /** Static files directory */
  staticDir: string;
  
  /** Manifest file path */
  manifestPath: string;
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error message if request failed */
  error?: string;
  
  /** Additional metadata */
  meta?: Record<string, any>;
}

/**
 * Project info API response
 */
export interface ProjectInfo {
  /** Project manifest data */
  manifest: ProjectManifest;
  
  /** Whether the project is currently built */
  isBuilt: boolean;
  
  /** Build status information */
  buildStatus?: {
    lastBuild: string;
    success: boolean;
    error?: string;
  };
} 
