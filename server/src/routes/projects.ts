import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { Loaders } from '../loaders';

const projectRouter: Router = Router();

projectRouter.get('/', (_: Request, res: Response) => {
  res.redirect('/hub');
});

projectRouter.get(
  '/:slugOrAsset',
  async (req: Request, res: Response, next: NextFunction) => {
    const { slugOrAsset } = req.params;

    const manifest = await Loaders.getManifest();
    if (!manifest) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not load project manifest',
        timestamp: new Date().toISOString(),
      });
    }

    const project = manifest.projects.find((p: any) => p.slug === slugOrAsset);

    if (project) {
      const projectPath = path.join(
        process.cwd(),
        '..',
        'apps',
        project.directory
      );
      const entryPoint = path.join(projectPath, project.entryPoint);

      try {
        // make sure to apply the same-origin referrer policy
        // this is needed for assets to be served correctly
        let html = await fs.readFile(entryPoint, 'utf8');
        const referrerRegex =
          /<meta\s+name="referrer"\s+content="([^"]+)"\s*\/?>/i;
        const match = html.match(referrerRegex);

        if (match) {
          if (match[1] !== 'same-origin') {
            html = html.replace(
              referrerRegex,
              '<meta name="referrer" content="same-origin" />'
            );
          }
        } else {
          html = html.replace(
            '<head>',
            '<head><meta name="referrer" content="same-origin" />'
          );
        }

        res.send(html);
      } catch (error) {
        res.status(404).json({
          error: 'Not Found',
          message: `Project '${slugOrAsset}' entry point not found.`,
          slug: slugOrAsset,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // it's an asset request
      const referrer = req.get('Referrer');
      if (!referrer) {
        return next();
      }

      const referrerUrl = new URL(referrer);
      const projectSlug = referrerUrl.pathname.split('/')[1];

      if (!projectSlug) {
        return next();
      }

      const refProject = manifest.projects.find(
        (p: any) => p.slug === projectSlug
      );
      if (!refProject) {
        return next();
      }

      const projectPath = path.join(
        process.cwd(),
        '..',
        'apps',
        refProject.directory
      );
      const assetPath = path.join(projectPath, slugOrAsset);

      res.sendFile(assetPath, err => {
        if (err) {
          next();
        }
      });
    }
  }
);

export default projectRouter;
