import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login',    renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'home',          renderMode: RenderMode.Client },
  { path: 'feed',          renderMode: RenderMode.Client },
  { path: 'profile/:id',   renderMode: RenderMode.Client },
  { path: 'notifications', renderMode: RenderMode.Client },
  { path: 'search',        renderMode: RenderMode.Client },
  { path: 'explore',       renderMode: RenderMode.Client },
  { path: 'post/:id',      renderMode: RenderMode.Client },
  { path: 'settings',      renderMode: RenderMode.Client },
  { path: '**',            renderMode: RenderMode.Client }
];
