#!/usr/bin/env node
// Turns the web export into an installable app (iPhone "Add to Home Screen", Android "Install app").
// Usage: node scripts/pwa.mjs dist /popote
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const base = (process.argv[3] ?? '').replace(/\/$/, '');

copyFileSync('assets/icon.png', join(dir, 'apple-touch-icon.png'));
copyFileSync('assets/icon.png', join(dir, 'icon-1024.png'));

writeFileSync(
  join(dir, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Popote',
      short_name: 'Popote',
      description: 'Carnet de recettes libre : importer, cuisiner, planifier, faire les courses.',
      start_url: `${base}/`,
      scope: `${base}/`,
      display: 'standalone',
      background_color: '#FBF6EF',
      theme_color: '#FBF6EF',
      icons: [{ src: `${base}/icon-1024.png`, sizes: '1024x1024', type: 'image/png', purpose: 'any maskable' }],
    },
    null,
    2,
  ),
);

const tags = [
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Popote">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="theme-color" content="#FBF6EF">',
].join('\n    ');

const indexPath = join(dir, 'index.html');
const html = readFileSync(indexPath, 'utf8').replace('</head>', `    ${tags}\n  </head>`);
writeFileSync(indexPath, html);
// GitHub Pages serves 404.html for unknown paths: reuse the app so deep links (/recipe/…) work.
writeFileSync(join(dir, '404.html'), html);
console.log('PWA files written to', dir);
