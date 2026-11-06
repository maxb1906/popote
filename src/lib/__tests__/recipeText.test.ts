import { parseRecipeText } from '../parse/recipeText';
import { findDurationSeconds, parseIsoDuration } from '../parse/duration';

const CAPTION = `Gratin de courgettes express 🧀✨
Le plat du soir qui fait l'unanimité !

Ingrédients (pour 4 personnes) :
- 3 courgettes
- 2 œufs
- 20 cl de crème fraîche
- 100 g de gruyère râpé
- Sel, poivre

Préparation :
1. Préchauffez le four à 200°C.
2. Coupez les courgettes en rondelles et faites-les revenir 10 min à la poêle.
3. Battez les œufs avec la crème, salez, poivrez.
4. Versez sur les courgettes, ajoutez le fromage et enfournez 25 minutes.

#gratin #recettefacile #food`;

describe('parseRecipeText', () => {
  test('caption with headers', () => {
    const r = parseRecipeText(CAPTION);
    expect(r.title).toBe('Gratin de courgettes express');
    expect(r.servings).toBe(4);
    expect(r.ingredients.map((i) => i.name)).toEqual(['courgettes', 'œufs', 'crème fraîche', 'gruyère râpé', 'Sel, poivre']);
    expect(r.steps).toHaveLength(4);
    expect(r.steps[1].timerSeconds).toBe(600);
    expect(r.steps[3].timerSeconds).toBe(1500);
    expect(r.steps[0].text).toBe('Préchauffez le four à 200°C.');
  });

  test('no headers: classify lines', () => {
    const r = parseRecipeText(`Pancakes moelleux
250 g de farine
2 oeufs
30 cl de lait
1 sachet de levure
Mélangez la farine et la levure, puis ajoutez les oeufs et le lait petit à petit.
Faites cuire dans une poêle chaude 2 minutes de chaque côté.`);
    expect(r.title).toBe('Pancakes moelleux');
    expect(r.ingredients).toHaveLength(4);
    expect(r.steps).toHaveLength(2);
    expect(r.dishType).toBe('dessert');
  });

  test('English recipe with inline steps', () => {
    const r = parseRecipeText(`Easy tomato pasta
Serves 2
Ingredients: 200g spaghetti; 1 can chopped tomatoes; 2 cloves garlic; 2 tbsp olive oil
Method: 1) Cook the pasta for 10 minutes. 2) Fry the garlic in the oil, add the tomatoes and simmer 15 min. 3) Mix and serve.`);
    expect(r.servings).toBe(2);
    expect(r.ingredients.map((i) => i.unit)).toEqual(['g', 'can', 'clove', 'tbsp']);
    expect(r.steps).toHaveLength(3);
    expect(r.steps[0].timerSeconds).toBe(600);
  });

  test('times', () => {
    const r = parseRecipeText(`Quiche lorraine
Préparation : 15 min | Cuisson : 40 min
Ingrédients
1 pâte brisée
200 g de lardons
Étapes
Étalez la pâte. Ajoutez les lardons, puis l'appareil et enfournez 40 min.`);
    expect(r.prepMinutes).toBe(15);
    expect(r.cookMinutes).toBe(40);
    expect(r.totalMinutes).toBe(55);
    expect(r.dishType).toBe('main');
  });
});

describe('durations', () => {
  test.each([
    ['cuire 1 h 30', 5400],
    ['1h30', 5400],
    ['10 à 15 minutes', 600],
    ['laisser reposer 2 heures', 7200],
    ['bake 45 mins', 2700],
    ['30 secondes', 30],
    ['préchauffer le four à 180°C', undefined],
    ['ajoutez 2 sachets', undefined],
  ])('%s', (s, n) => expect(findDurationSeconds(s)).toBe(n));

  test('iso', () => {
    expect(parseIsoDuration('PT1H15M')).toBe(75);
    expect(parseIsoDuration('PT20M')).toBe(20);
    expect(parseIsoDuration('P0DT0H35M')).toBe(35);
    expect(parseIsoDuration(undefined)).toBeUndefined();
  });
});
