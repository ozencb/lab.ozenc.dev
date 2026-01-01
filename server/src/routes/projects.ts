import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import type {
  ProjectManifest,
  HomepageIcon,
} from '@lab.ozenc.dev/shared/types';
import { Loaders } from '../loaders';
import { findAssetPath } from '../utils';
import {
  HOMEPAGE_LOGO_DEFAULT_POSITION,
  HOMEPAGE_LOGO_DISABLED,
  HOMEPAGE_LOGO_MARKUP,
  HOMEPAGE_LOGO_POSITION_PLACEHOLDER,
  HOMEPAGE_LOGO_STYLE,
  HOMEPAGE_SLUG,
} from '../constants';
import { HOMEPAGE_LOGO_ALLOWED_POSITIONS } from '@lab.ozenc.dev/shared';

const projectRouter: Router = Router();

const selectedHomepageIconPosition = (
  project: ProjectManifest
): HomepageIcon => {
  if (!project.homepageIcon) {
    return HOMEPAGE_LOGO_DEFAULT_POSITION;
  }

  if (project.homepageIcon === HOMEPAGE_LOGO_DISABLED) {
    return project.homepageIcon;
  }

  if (HOMEPAGE_LOGO_ALLOWED_POSITIONS.includes(project.homepageIcon)) {
    return project.homepageIcon;
  }

  return HOMEPAGE_LOGO_DEFAULT_POSITION;
};

const injectHomepageLogo = (html: string, project: ProjectManifest): string => {
  const position = selectedHomepageIconPosition(project);

  if (position === HOMEPAGE_LOGO_DISABLED) {
    return html;
  }

  if (html.includes('lab-homepage-logo-wrapper')) {
    return html;
  }

  if (/<head[^>]*>/i.test(html) && !html.includes('lab-homepage-logo-style')) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${HOMEPAGE_LOGO_STYLE}`);
  }

  if (/<body[^>]*>/i.test(html)) {
    const logoMarkup = HOMEPAGE_LOGO_MARKUP.replace(
      HOMEPAGE_LOGO_POSITION_PLACEHOLDER,
      position
    );
    return html.replace(/<body([^>]*)>/i, `<body$1>${logoMarkup}`);
  }

  const fallbackMarkup = HOMEPAGE_LOGO_MARKUP.replace(
    HOMEPAGE_LOGO_POSITION_PLACEHOLDER,
    position
  );

  return `${fallbackMarkup}${html}`;
};

const assetHandler = async (
  asset: string,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const manifest = await Loaders.getManifest();
  if (!manifest) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not load project manifest',
      timestamp: new Date().toISOString(),
    });
  }

  const referrer = req.get('Referrer');

  if (!referrer) {
    return next();
  }

  const referrerUrl = new URL(referrer);
  const projectSlug = referrerUrl.pathname.split('/')[1];

  if (!projectSlug) {
    return next();
  }

  const refProject = manifest.projects.find((p: any) => p.slug === projectSlug);

  if (!refProject) {
    return next();
  }

  const projectPath = path.join(
    process.cwd(),
    '..',
    'apps',
    refProject.directory
  );

  const buildDirectory = path.join(
    projectPath,
    refProject.buildDirectory || ''
  );
  const assetPath = findAssetPath(refProject, buildDirectory, asset);

  if (!assetPath) {
    return next();
  }

  res.sendFile(assetPath, err => {
    if (err) {
      next();
    }
  });
};

projectRouter.get('/', (_: Request, res: Response) => {
  res.redirect('/hub');
});

projectRouter.get(
  '/assets/:asset',
  async (req: Request, res: Response, next: NextFunction) => {
    const { asset } = req.params;
    await assetHandler(asset, req, res, next);
  }
);

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

    const project = manifest.projects.find(
      (p: ProjectManifest) => p.slug === slugOrAsset
    );

    if (project) {
      const projectPath = path.join(
        process.cwd(),
        '..',
        'apps',
        project.directory
      );

      const buildDirectory = path.join(
        projectPath,
        project.buildDirectory || ''
      );
      const entryPoint = path.join(buildDirectory, project.entryPoint);

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

        if (project.slug !== HOMEPAGE_SLUG) {
          html = injectHomepageLogo(html, project);
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
      return await assetHandler(slugOrAsset, req, res, next);
    }
  }
);

export default projectRouter;
