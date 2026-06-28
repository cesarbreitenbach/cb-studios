import { hydrateRoot } from 'react-dom/client';
import type { StudioView } from '@cb/shared';
import SitePage from './site/SitePage.js';

declare global { interface Window { __STUDIO__: StudioView } }

const root = document.getElementById('root')!;
hydrateRoot(root, <SitePage view={window.__STUDIO__} />);
