import { ProjectManifest } from '@lab.ozenc.dev/shared';
import * as fs from 'fs';
import * as path from 'path';

export const findAssetPath = (
  project: ProjectManifest,
  projectDir: string,
  asset: string
): string | null => {
  const searchInDir = (dir: string): string | null => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          const found = searchInDir(fullPath);
          if (found) {
            return found;
          }
        } else if (entry.name === asset) {
          return fullPath;
        }
      }
    } catch (err) {
      console.error('Error searching directory', dir, err);
    }
    return null;
  };

  const foundPath = searchInDir(projectDir);

  if (foundPath) {
    return foundPath;
  }

  console.error(`Asset '${asset}' not found in project '${project.name}'`);

  return null;
};
