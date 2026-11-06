#!/usr/bin/env node
// WCAG 2 contrast check for design/tokens.json, light ("color") and dark ("colorDark").
// Usage: node scripts/contrast.mjs design/tokens.json   (exit 1 on any AA failure)
import { readFileSync } from 'node:fs';

const NEEDS = { normal: [4.5, 7], large: [3, 4.5], ui: [3, 3] };

function rgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function lum(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const file = process.argv[2] ?? 'design/tokens.json';
const tokens = JSON.parse(readFileSync(file, 'utf8'));
let fails = 0;
let count = 0;
for (const theme of ['color', 'colorDark']) {
  const cols = tokens[theme];
  if (!cols) continue;
  console.log(`\n${theme}`);
  for (const [fg, bg, size = 'normal'] of tokens.pairs) {
    count++;
    if (!cols[fg] || !cols[bg]) {
      console.log(`  ??    ${fg} on ${bg}: unknown token`);
      fails++;
      continue;
    }
    const r = ratio(cols[fg], cols[bg]);
    const [aa, aaa] = NEEDS[size] ?? NEEDS.normal;
    const grade = size === 'ui' ? (r >= aa ? 'PASS' : 'FAIL') : r >= aaa ? 'AAA' : r >= aa ? 'AA' : 'FAIL';
    if (r < aa) fails++;
    console.log(`  ${grade.padEnd(5)} ${r.toFixed(2).padStart(5)}:1  ${fg.padEnd(14)} on ${bg.padEnd(12)} ${size === 'normal' ? '' : size}`);
  }
}
console.log(`\n  ${count} pairs, ${fails} failing AA`);
process.exit(fails ? 1 : 0);
