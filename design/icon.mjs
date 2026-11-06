// Generates every app icon from one SVG drawing (an original cooking-pot mark).
// Usage: npm i --no-save @resvg/resvg-js && node design/icon.mjs
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const ACCENT = '#AD3D1A';
const CREAM = '#FBF6EF';

/** The pot, drawn on a 1024 grid, centred in a 640x640 box so it stays inside Android's safe zone. */
const pot = (fill) => `
  <g fill="none" stroke="${fill}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
    <path d="M430 300c-18-26 18-46 0-72"/>
    <path d="M512 300c-18-26 18-46 0-72"/>
    <path d="M594 300c-18-26 18-46 0-72"/>
  </g>
  <rect x="300" y="352" width="424" height="44" rx="22" fill="${fill}"/>
  <path d="M332 420h360v170c0 60-48 108-108 108H440c-60 0-108-48-108-108z" fill="${fill}"/>
  <path d="M332 470h-34c-22 0-40 18-40 40s18 40 40 40h34" fill="none" stroke="${fill}" stroke-width="30" stroke-linecap="round"/>
  <path d="M692 470h34c22 0 40 18 40 40s-18 40-40 40h-34" fill="none" stroke="${fill}" stroke-width="30" stroke-linecap="round"/>
`;

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${body}</svg>`;

const render = (s, size, out) => {
  const png = new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(out, png);
  console.log('wrote', out);
};

// iOS / store icon: full bleed, no transparency
render(svg(pot(CREAM), ACCENT), 1024, 'assets/icon.png');
// Android adaptive icon: foreground on transparent, background colour set in app.json
render(svg(`<g transform="translate(512 512) scale(0.82) translate(-512 -512)">${pot(CREAM)}</g>`), 1024, 'assets/android-icon-foreground.png');
render(svg(`<g transform="translate(512 512) scale(0.82) translate(-512 -512)">${pot('#FFFFFF')}</g>`), 1024, 'assets/android-icon-monochrome.png');
render(svg(pot(ACCENT)), 512, 'assets/splash-icon.png');
render(svg(pot(CREAM), ACCENT), 48, 'assets/favicon.png');
writeFileSync('design/icon.svg', svg(pot(CREAM), ACCENT));
