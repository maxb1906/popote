import { fold } from './text';
import type { Ingredient } from './types';

/** The 14 allergens EU law requires to be declared (Regulation 1169/2011, annex II). */
export type Allergen =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

const WORDS: Record<Allergen, string[]> = {
  gluten: ['farine', 'flour', 'ble', 'wheat', 'pain', 'bread', 'baguette', 'brioche', 'pate', 'pates', 'pasta', 'spaghetti', 'penne', 'tagliatelle', 'lasagne', 'nouille', 'noodle', 'semoule', 'couscous', 'boulgour', 'bulgur', 'orge', 'barley', 'seigle', 'rye', 'epeautre', 'spelt', 'avoine', 'oat', 'chapelure', 'breadcrumb', 'panko', 'biscuit', 'speculoos', 'tortilla', 'pita', 'naan', 'croissant', 'gnocchi', 'biere', 'beer', 'sauce soja', 'soy sauce', 'seitan', 'macaroni', 'fusilli', 'ravioli', 'feuilletee', 'brisee', 'sablee'],
  crustaceans: ['crevette', 'shrimp', 'prawn', 'gambas', 'homard', 'lobster', 'crabe', 'crab', 'langoustine', 'ecrevisse', 'crayfish', 'surimi'],
  eggs: ['oeuf', 'egg', 'mayonnaise', 'mayo', 'jaune', 'yolk', 'blanc d oeuf', 'meringue'],
  fish: ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'cabillaud', 'cod', 'colin', 'merlu', 'anchois', 'anchov', 'sardine', 'maquereau', 'mackerel', 'truite', 'trout', 'dorade', 'bar', 'lieu', 'haddock', 'nuoc mam', 'fish sauce', 'surimi'],
  peanuts: ['cacahuete', 'arachide', 'peanut'],
  soy: ['soja', 'soy', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh'],
  milk: ['lait', 'milk', 'beurre', 'butter', 'creme', 'cream', 'fromage', 'cheese', 'yaourt', 'yogurt', 'yoghurt', 'mozzarella', 'parmesan', 'emmental', 'gruyere', 'comte', 'feta', 'chevre', 'ricotta', 'mascarpone', 'burrata', 'cheddar', 'roquefort', 'camembert', 'reblochon', 'raclette', 'skyr', 'brie', 'pecorino', 'halloumi', 'ghee', 'lactose', 'chantilly', 'bechamel'],
  nuts: ['amande', 'almond', 'noisette', 'hazelnut', 'noix', 'walnut', 'cajou', 'cashew', 'pistache', 'pistachio', 'pecan', 'macadamia', 'praline', 'pralin', 'nutella', 'pate a tartiner', 'frangipane', 'massepain', 'marzipan'],
  celery: ['celeri', 'celery', 'celeriac'],
  mustard: ['moutarde', 'mustard'],
  sesame: ['sesame', 'tahini', 'tahin', 'gomasio'],
  sulphites: ['vin', 'wine', 'porto', 'champagne', 'cidre', 'cider', 'abricot sec', 'raisin sec', 'vinaigre balsamique', 'balsamic'],
  lupin: ['lupin'],
  molluscs: ['moule', 'mussel', 'huitre', 'oyster', 'calamar', 'squid', 'poulpe', 'octopus', 'seiche', 'cuttlefish', 'saint jacques', 'scallop', 'palourde', 'clam', 'bulot', 'escargot', 'snail'],
};

/** Phrases that look like an allergen but are not (or are a different one). */
const NOT: [string, Allergen[]][] = [
  ['lait de coco', ['milk']],
  ['creme de coco', ['milk']],
  ['coconut milk', ['milk']],
  ['coconut cream', ['milk']],
  ['lait d amande', ['milk']],
  ['almond milk', ['milk']],
  ['lait d avoine', ['milk']],
  ['oat milk', ['milk']],
  ['lait de soja', ['milk']],
  ['soy milk', ['milk']],
  ['beurre de cacahuete', ['milk']],
  ['peanut butter', ['milk']],
  ['beurre de cacao', ['milk']],
  ['cocoa butter', ['milk']],
  ['noix de coco', ['nuts']],
  ['coconut', ['nuts']],
  ['noix de muscade', ['nuts']],
  ['nutmeg', ['nuts']],
  ['creme de marron', ['milk']],
  ['farine de riz', ['gluten']],
  ['rice flour', ['gluten']],
  ['farine de mais', ['gluten']],
  ['farine de pois chiche', ['gluten']],
  ['chickpea flour', ['gluten']],
  ['pates de riz', ['gluten']],
  ['nouilles de riz', ['gluten']],
  ['rice noodle', ['gluten']],
  ['sans gluten', ['gluten']],
  ['gluten free', ['gluten']],
  ['eggplant', ['eggs']],
  ['vinaigre', ['sulphites']],
];

export function detectAllergens(ingredients: Ingredient[]): Allergen[] {
  const found = new Set<Allergen>();
  for (const ing of ingredients) {
    let f = ` ${fold(`${ing.name} ${ing.note ?? ''}`)} `;
    const blocked = new Set<Allergen>();
    for (const [phrase, al] of NOT) {
      if (f.includes(` ${phrase}`)) {
        al.forEach((a) => blocked.add(a));
      }
    }
    // re-add specific combos that the NOT list removed from the text but that still carry an allergen
    if (/ (vinaigre balsamique|balsamic)/.test(` ${fold(ing.name)} `)) found.add('sulphites');
    for (const [a, words] of Object.entries(WORDS) as [Allergen, string[]][]) {
      if (blocked.has(a)) continue;
      if (words.some((w) => (w.length <= 4 ? new RegExp(`\\s${w}(s|x)?\\s`).test(f) : f.includes(` ${w}`)))) found.add(a);
    }
  }
  return [...found];
}
