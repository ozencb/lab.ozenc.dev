import { HOMEPAGE_LOGO_ALLOWED_POSITIONS } from '@lab.ozenc.dev/shared';

const FLASK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
  <desc>
    School Science Test Flask Streamline Icon: https://streamlinehq.com
  </desc>
  <title>school-science-test-flask</title>
  <g>
    <path d="M27.425 18.28h1.53v7.62h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M25.905 25.9h1.52v3.05h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M25.905 15.23h1.52v3.05h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M24.385 28.95h1.52v1.52h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M24.385 13.71h1.52v1.52h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M22.855 18.28h1.53v1.53h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M22.855 12.19h1.53v1.52h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M7.615 30.47h16.77V32H7.615Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M19.805 10.66h3.05v1.53h-3.05Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M18.285 15.23h1.52v1.53h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M15.235 19.81h1.53v1.52h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M12.195 15.23h1.52v1.53h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="m13.715 1.52 4.57 0 0 9.14 1.52 0 0 -9.14 1.53 0 0 -1.52 -10.67 0 0 1.52 1.53 0 0 9.14 1.52 0 0 -9.14z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M9.145 10.66h3.05v1.53h-3.05Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M9.145 18.28h1.52v1.53h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="m7.615 27.42 1.53 0 0 1.53 13.71 0 0 -1.53 1.53 0 0 -1.52 1.52 0 0 -3.05 -1.52 0 0 -1.52 -3.05 0 0 1.52 -1.53 0 0 1.53 -4.57 0 0 -1.53 -3.04 0 0 -1.52 -4.58 0 0 1.52 -1.52 0 0 3.05 1.52 0 0 1.52z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M7.615 12.19h1.53v1.52h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M6.095 28.95h1.52v1.52h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M6.095 13.71h1.52v1.52h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M4.575 25.9h1.52v3.05h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M4.575 15.23h1.52v3.05h-1.52Z" fill="#FFFFFF" stroke-width="1"></path>
    <path d="M3.045 18.28h1.53v7.62h-1.53Z" fill="#FFFFFF" stroke-width="1"></path>
  </g>
</svg>`;

export type HomepageLogoPosition =
  (typeof HOMEPAGE_LOGO_ALLOWED_POSITIONS)[number];

export const HOMEPAGE_LOGO_DISABLED = 'disabled';

export const HOMEPAGE_LOGO_DEFAULT_POSITION: HomepageLogoPosition =
  'bottom-right';

export const HOMEPAGE_LOGO_POSITION_PLACEHOLDER = '__HOMEPAGE_LOGO_POSITION__';

export const HOMEPAGE_LOGO_STYLE = `
<style id="lab-homepage-logo-style">
  .lab-homepage-logo-wrapper {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483647;
  }

  .lab-homepage-logo-wrapper[data-corner='top-left'] {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .lab-homepage-logo-wrapper[data-corner='top-right'] {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .lab-homepage-logo-wrapper[data-corner='bottom-left'] {
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
  }

  .lab-homepage-logo-wrapper[data-corner='bottom-right'] {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .lab-homepage-logo-wrapper-inner {
    pointer-events: auto;
    padding: 24px;
  }

  .lab-homepage-logo {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(18, 18, 23, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 8px 24px rgba(5, 5, 10, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: pointer;
    transition: transform 180ms ease, opacity 180ms ease;
    opacity: 0.85;
  }

  .lab-homepage-logo:hover {
    transform: scale(1.05);
    opacity: 1;
  }

  .lab-homepage-logo svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
    color: rgba(255, 255, 255, 0.85);
  }
</style>
`;

export const HOMEPAGE_LOGO_MARKUP = `
<div class="lab-homepage-logo-wrapper" data-corner="${HOMEPAGE_LOGO_POSITION_PLACEHOLDER}">
  <div class="lab-homepage-logo-wrapper-inner">
    <a
      class="lab-homepage-logo"
      href="/"
      aria-label="Go to lab.ozenc.dev"
    >
      ${FLASK_ICON_SVG}
    </a>
  </div>
</div>
`;
