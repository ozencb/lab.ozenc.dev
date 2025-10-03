import path from 'path';
import fs from 'fs';
import { type Manifest, Utils } from '@lab.ozenc.dev/shared';

let manifestCache: any = null;
let manifestLastModified: number = 0;

const getManifest = async (): Promise<Manifest | null> => {
  try {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const stats = await fs.promises.stat(manifestPath);

    const isValid = await Utils.validateManifestFile(manifestPath);

    if (!isValid) {
      console.error('Manifest validation failed');
      return null;
    }

    if (!manifestCache || stats.mtimeMs > manifestLastModified) {
      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

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
