import path from 'path';
import fs from 'fs';
import { Utils } from '@lab.ozenc.dev/shared';

let manifestCache: any = null;
let manifestLastModified: number = 0;

const getManifest = async () => {
  try {
    const manifestPath = path.join(process.cwd(), '..', 'manifest.json');
    const stats = await fs.promises.stat(manifestPath);

    const isValid = await Utils.validateManifestFile(manifestPath);

    if (!isValid) {
      console.error('Manifest validation failed');
      return null;
    }

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

export const Loaders = {
  getManifest,
};
