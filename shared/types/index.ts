import { HOMEPAGE_LOGO_ALLOWED_POSITIONS } from '../constants';

export type HomepageIcon =
  | (typeof HOMEPAGE_LOGO_ALLOWED_POSITIONS)[number]
  | 'disabled';

export interface ProjectManifest {
  slug: string;
  name: string;
  directory: string;
  description?: string;
  entryPoint: string;
  buildDirectory?: string;
  published?: boolean;
  homepageIcon?: HomepageIcon;
}

export interface Manifest {
  projects: ProjectManifest[];
}

export interface ServerConfig {
  port: number;
  environment: 'development' | 'production';
  staticDir: string;
  manifestPath: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

export interface ProjectInfo {
  manifest: ProjectManifest;
}
