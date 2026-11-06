import { buildShoppingList, itemQuantityText } from '../shopping';
import { aisleOf } from '../aisles';
import { detectAllergens } from '../allergens';
import { matchRecipes } from '../match';
import { formatQty, scaleIngredient, ingredientLine } from '../scale';
import { toGrams } from '../robot';
import { parseIngredient } from '../parse/ingredient';
import type { Recipe } from '../types';

const ing = (s: string) => parseIngredient(s);
const recipe = (id: string, servings: number, lines: string[]): Recipe => ({
  id,
  title: id,
  sourceType: 'manual',
  servings,
  dishType: 'main',
  tags: [],
  ingredients: lines.map(ing),
  steps: [],
  favourite: false,
  cookedCount: 0,
  createdAt: '',
  updatedAt: '',
});

describe('scale', () => {
  test('fractions and decimals', () => {
    expect(formatQty(0.5, 'tsp', 'fr')).toBe('½');
    expect(formatQty(1.5, undefined, 'fr')).toBe('1 ½');
    expect(formatQty(1.5, 'kg', 'fr')).toBe('1,5');
    expect(formatQty(333.33, 'g', 'fr')).toBe('335');
    expect(formatQty(2.999, undefined, 'en')).toBe('3');
  });
  test('scaling a line', () => {
    expect(ingredientLine(scaleIngredient(ing('200 g de farine'), 1.5), 'fr')).toBe('300 g farine');
    expect(ingredientLine(scaleIngredient(ing('1 c. à soupe de miel'), 0.5), 'fr')).toBe('½ c. à soupe miel');
  });
});

describe('shopping list', () => {
  const recipes = {
    a: recipe('a', 2, ['200 g de farine', '2 oeufs', '25 cl de lait', 'Sel', '1 c. à soupe de sucre']),
    b: recipe('b', 4, ['1 kg de farine', '3 œufs', '1 l de lait', "2 gousses d'ail", '1 c. à café de sucre']),
  };
  const list = buildShoppingList(
    [
      { id: '1', date: '2026-11-09', meal: 'dinner', recipeId: 'a', servings: 4 },
      { id: '2', date: '2026-11-10', meal: 'lunch', recipeId: 'b', servings: 4 },
    ],
    recipes,
    [{ id: 'p', name: 'sel' }],
    'fr',
  );
  const by = (k: string) => list.find((i) => i.key === k)!;

  test('merges metric units', () => {
    expect(by('farine')).toMatchObject({ qty: 1.4, unit: 'kg', aisle: 'sweet' });
    expect(by('lait')).toMatchObject({ qty: 1.5, unit: 'l', aisle: 'dairy' });
  });
  test('merges counts across spelling (oeufs / œufs)', () => {
    expect(by('oeuf').qty).toBe(7);
  });
  test('keeps different units apart', () => {
    expect(itemQuantityText(by('sucre'), 'fr')).toBe('2 c. à soupe + 1 c. à café');
  });
  test('"Sel, poivre" without quantity becomes two items', () => {
    const l = buildShoppingList(
      [{ id: '1', date: '2026-11-09', meal: 'dinner', recipeId: 'c', servings: 2 }],
      { c: recipe('c', 2, ['Sel, poivre', 'Sel et poivre du moulin']) },
      [],
      'fr',
    );
    expect(l.map((i) => i.key).sort()).toEqual(['poivre', 'poivre du moulin', 'sel']);
  });
  test('kg and l are rounded to one decimal', () => {
    expect(formatQty(1.125, 'l', 'fr')).toBe('1,1');
  });
  test('pantry items are flagged', () => {
    expect(by('sel').atHome).toBe(true);
    expect(by('ail').atHome).toBe(false);
  });
});

describe('aisles', () => {
  test.each([
    ['tomates cerises', 'produce'],
    ['lait de coco', 'savoury'],
    ['vinaigre balsamique', 'savoury'],
    ['laitue', 'produce'],
    ['crème fraîche', 'dairy'],
    ['blanc de poulet', 'meat'],
    ['pâte feuilletée', 'dairy'],
    ['spaghetti', 'savoury'],
    ['pommes de terre', 'produce'],
    ['noix de muscade', 'spices'],
    ['vin blanc', 'drinks'],
    ['papier cuisson', 'other'],
  ])('%s -> %s', (name, aisle) => expect(aisleOf(name)).toBe(aisle));
});

describe('allergens', () => {
  test('detects and avoids false friends', () => {
    expect(detectAllergens([ing('200 g de farine'), ing('2 oeufs'), ing('50 g de beurre')]).sort()).toEqual(['eggs', 'gluten', 'milk']);
    expect(detectAllergens([ing('40 cl de lait de coco'), ing('1 pincée de noix de muscade')])).toEqual([]);
    expect(detectAllergens([ing('2 c. à soupe de beurre de cacahuète')])).toEqual(['peanuts']);
    expect(detectAllergens([ing('1 aubergine'), ing('1 c. à soupe de sauce soja')]).sort()).toEqual(['gluten', 'soy']);
  });
});

describe('fridge matcher', () => {
  test('ranks by share of ingredients you have', () => {
    const rs = [
      recipe('omelette', 2, ['3 oeufs', '50 g de fromage', 'sel']),
      recipe('quiche', 4, ['1 pâte brisée', '3 oeufs', '20 cl de crème', '200 g de lardons']),
      recipe('soupe', 4, ['3 carottes', '1 oignon']),
    ];
    const m = matchRecipes(['oeuf', 'fromage'], rs);
    expect(m.map((x) => x.recipe.id)).toEqual(['omelette', 'quiche']);
    expect(m[0].missing).toEqual([]);
  });
});

describe('robot grams', () => {
  test('volume to grams', () => {
    expect(toGrams(ing('2 c. à soupe de sucre'))).toMatchObject({ qty: 26, unit: 'g' });
    expect(toGrams(ing('25 cl de lait'))).toMatchObject({ qty: 258, unit: 'g' });
    expect(toGrams(ing('3 oeufs'))).toMatchObject({ qty: 3, unit: undefined });
  });
});
