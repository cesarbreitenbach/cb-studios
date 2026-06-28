import type { FC } from 'react';
import type { StudioView, Theme } from '@cb/shared';
import ThemeA from './ThemeA.js';
import ThemeB from './ThemeB.js';
import ThemeC from './ThemeC.js';

export const THEME_COMPONENTS: Record<Theme, FC<{ view: StudioView }>> = {
  A: ThemeA, B: ThemeB, C: ThemeC,
};
