import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIcons } from '@sevtech/icons';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(), 
    provideIcons({
      // относительный путь резолвится от <base href> — работает и в dev (/),
      // и на GitHub Pages (/icons-list/)
      path: 'icons',
    }),
  ],
};