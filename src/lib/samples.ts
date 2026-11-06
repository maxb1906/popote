import { parseRecipeText } from './parse/recipeText';
import type { RecipeDraft } from './types';

/** Three sample recipes written for Popote, so a new notebook has something to try. */
const FR = [
  `Dahl de lentilles corail
Pour 4 personnes · Préparation : 10 min · Cuisson : 25 min
Ingrédients
250 g de lentilles corail
1 oignon
2 gousses d'ail
1 morceau de gingembre (3 cm)
1 c. à soupe de curry en poudre
40 cl de lait de coco
1 boîte de tomates concassées (400 g)
50 cl d'eau
1 citron vert
1 c. à soupe d'huile d'olive
Sel
Étapes
1. Émincez l'oignon, l'ail et le gingembre.
2. Faites-les revenir 5 min dans l'huile avec le curry.
3. Ajoutez les lentilles rincées, les tomates, le lait de coco et l'eau.
4. Laissez mijoter 20 minutes en remuant de temps en temps.
5. Salez, pressez le citron vert et servez avec du riz ou du pain naan.`,
  `Crêpes de la Chandeleur
Pour 4 personnes · Préparation : 10 min · Cuisson : 20 min
Ingrédients
250 g de farine
4 œufs
50 cl de lait
30 g de beurre fondu
1 c. à soupe de sucre
1 pincée de sel
Étapes
1. Mélangez la farine, le sucre et le sel dans un saladier.
2. Creusez un puits, ajoutez les œufs et fouettez en versant le lait petit à petit.
3. Incorporez le beurre fondu et laissez reposer la pâte 30 minutes.
4. Faites cuire les crêpes 1 minute de chaque côté dans une poêle bien chaude.`,
  `Salade de pois chiches, feta et concombre
Pour 2 personnes · Préparation : 15 min
Ingrédients
1 boîte de pois chiches (400 g)
1 concombre
200 g de tomates cerises
100 g de feta
1/2 oignon rouge
1 bouquet de persil
2 c. à soupe d'huile d'olive
1 citron
Sel, poivre
Étapes
1. Rincez et égouttez les pois chiches.
2. Coupez le concombre en dés, les tomates en deux et émincez l'oignon.
3. Mélangez le tout avec la feta émiettée et le persil ciselé.
4. Assaisonnez avec l'huile, le jus du citron, le sel et le poivre.`,
];

const EN = [
  `Red lentil dahl
Serves 4 · Prep: 10 min · Cook: 25 min
Ingredients
250 g red lentils
1 onion
2 cloves garlic
1 piece ginger (3 cm)
1 tbsp curry powder
400 ml coconut milk
1 can chopped tomatoes (400 g)
500 ml water
1 lime
1 tbsp olive oil
Salt
Method
1. Chop the onion, garlic and ginger.
2. Fry them for 5 min in the oil with the curry powder.
3. Add the rinsed lentils, tomatoes, coconut milk and water.
4. Simmer for 20 minutes, stirring now and then.
5. Season, squeeze over the lime and serve with rice or naan.`,
  `Simple pancakes
Serves 4 · Prep: 10 min · Cook: 20 min
Ingredients
250 g flour
4 eggs
500 ml milk
30 g melted butter
1 tbsp sugar
1 pinch of salt
Method
1. Mix the flour, sugar and salt in a bowl.
2. Make a well, add the eggs and whisk while pouring in the milk little by little.
3. Stir in the melted butter and let the batter rest for 30 minutes.
4. Cook the pancakes 1 minute on each side in a very hot pan.`,
  `Chickpea, feta and cucumber salad
Serves 2 · Prep: 15 min
Ingredients
1 can chickpeas (400 g)
1 cucumber
200 g cherry tomatoes
100 g feta
1/2 red onion
1 bunch parsley
2 tbsp olive oil
1 lemon
Salt, pepper
Method
1. Rinse and drain the chickpeas.
2. Dice the cucumber, halve the tomatoes and slice the onion.
3. Mix everything with the crumbled feta and chopped parsley.
4. Dress with the oil, lemon juice, salt and pepper.`,
];

export function sampleRecipes(lang: 'fr' | 'en'): RecipeDraft[] {
  return (lang === 'fr' ? FR : EN).map((text, i) => ({
    ...parseRecipeText(text, { sourceType: 'manual' }),
    tags: [['végétarien', 'vegan'], ['dessert'], ['végétarien', 'rapide']][i].map((t) => (lang === 'en' ? ({ végétarien: 'vegetarian', rapide: 'quick' } as Record<string, string>)[t] ?? t : t)),
  }));
}
