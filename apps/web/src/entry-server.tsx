import { renderToString } from 'react-dom/server';
import type { StudioView } from '@cb/shared';
import SitePage from './site/SitePage.js';

export function render(view: StudioView): string {
  return renderToString(<SitePage view={view} />);
}
