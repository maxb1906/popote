import { parseIngredient } from '../parse/ingredient';

const p = (s: string) => {
  const { qty, qtyMax, unit, name, note } = parseIngredient(s);
  return { qty, qtyMax, unit, name, note };
};

describe('parseIngredient', () => {
  test.each([
    ["200 g de farine", { qty: 200, unit: 'g', name: 'farine' }],
    ["200g farine", { qty: 200, unit: 'g', name: 'farine' }],
    ["2 c. à soupe d'huile d'olive", { qty: 2, unit: 'tbsp', name: "huile d'olive" }],
    ['1 c.à.c de sel', { qty: 1, unit: 'tsp', name: 'sel' }],
    ['1 càs de miel', { qty: 1, unit: 'tbsp', name: 'miel' }],
    ['50 cl de lait', { qty: 50, unit: 'cl', name: 'lait' }],
    ['3 œufs', { qty: 3, name: 'œufs' }],
    ['½ citron', { qty: 0.5, name: 'citron' }],
    ['1 ½ tasse de riz', { qty: 1.5, unit: 'cup', name: 'riz' }],
    ['1/2 oignon', { qty: 0.5, name: 'oignon' }],
    ['1,5 kg de pommes de terre', { qty: 1.5, unit: 'kg', name: 'pommes de terre' }],
    ["2 gousses d'ail", { qty: 2, unit: 'clove', name: 'ail' }],
    ['1 boîte de tomates concassées (400 g)', { qty: 1, unit: 'can', name: 'tomates concassées', note: '400 g' }],
    ['1 oignon, émincé', { qty: 1, name: 'oignon', note: 'émincé' }],
    ['une pincée de sel', { qty: 1, unit: 'pinch', name: 'sel' }],
    ['deux carottes', { qty: 2, name: 'carottes' }],
    ['2-3 tomates', { qty: 2, qtyMax: 3, name: 'tomates' }],
    ['Sel, poivre', { name: 'Sel, poivre' }],
    ['Farine : 250 g', { qty: 250, unit: 'g', name: 'Farine' }],
    ['Oeufs x3', { qty: 3, name: 'Oeufs' }],
    ['- 100 g de beurre mou', { qty: 100, unit: 'g', name: 'beurre mou' }],
    ['🍋 1 citron vert', { qty: 1, name: 'citron vert' }],
    ['3 noix', { qty: 3, name: 'noix' }],
    ['1 noix de beurre', { qty: 1, unit: 'knob', name: 'beurre' }],
    ['2 tbsp olive oil', { qty: 2, unit: 'tbsp', name: 'olive oil' }],
    ['1 cup of flour', { qty: 1, unit: 'cup', name: 'flour' }],
    ['a pinch of salt', { qty: 1, unit: 'pinch', name: 'salt' }],
    ['un demi-citron', { qty: 0.5, name: 'citron' }],
    ['quelques feuilles de basilic', { unit: 'leaf', name: 'basilic' }],
    ["Huile d'olive 2 c. à soupe", { qty: 2, unit: 'tbsp', name: "Huile d'olive" }],
    ['1 pot de yaourt nature', { qty: 1, unit: 'jar', name: 'yaourt nature' }],
  ])('%s', (input, expected) => {
    expect(p(input)).toMatchObject(expected);
  });
});
