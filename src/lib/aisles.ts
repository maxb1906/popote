import { fold } from './text';
import type { Aisle } from './types';

/** Keyword -> aisle, French and English, folded (no accents). First match in this order wins. */
const RULES: [Aisle, string[]][] = [
  ['frozen', ['surgele', 'frozen', 'glace vanille', 'petits pois surgeles', 'ice cream']],
  ['spices', [
    'sel', 'salt', 'poivre', 'pepper', 'paprika', 'cumin', 'curry', 'curcuma', 'turmeric', 'cannelle', 'cinnamon', 'muscade', 'nutmeg',
    'piment', 'chili', 'herbes de provence', 'origan', 'oregano', 'thym seche', 'cardamome', 'gingembre moulu', 'garam masala', 'ras el hanout',
    'coriandre moulue', 'clou de girofle', 'cloves', 'vanille', 'vanilla', 'safran', 'saffron', 'bouillon', 'stock cube', 'laurier', 'bay leaf',
    'cajun', 'za atar', 'sumac', 'fenugrec', 'anis', 'badiane', 'graines de fenouil', 'piment d espelette', 'mélange', 'epice', 'spice',
  ]],
  ['fish', [
    'saumon', 'salmon', 'thon', 'tuna', 'cabillaud', 'cod', 'colin', 'merlu', 'poisson', 'fish', 'crevette', 'shrimp', 'prawn', 'moule', 'mussel',
    'sardine', 'maquereau', 'mackerel', 'truite', 'trout', 'bar ', 'dorade', 'lieu', 'calamar', 'squid', 'poulpe', 'octopus', 'saint jacques',
    'scallop', 'crabe', 'crab', 'homard', 'lobster', 'anchois', 'anchov', 'haddock', 'surimi', 'gambas', 'langoustine', 'huitre', 'oyster',
  ]],
  ['meat', [
    'poulet', 'chicken', 'boeuf', 'beef', 'veau', 'veal', 'porc', 'pork', 'agneau', 'lamb', 'dinde', 'turkey', 'canard', 'duck', 'jambon', 'ham',
    'lardon', 'bacon', 'saucisse', 'sausage', 'chorizo', 'steak', 'viande', 'meat', 'escalope', 'filet mignon', 'cote', 'roti', 'merguez',
    'chipolata', 'blanc de', 'cuisse', 'magret', 'pancetta', 'prosciutto', 'coppa', 'salami', 'hache', 'minced', 'mince', 'ground beef',
  ]],
  ['dairy', [
    'lait', 'milk', 'beurre', 'butter', 'creme', 'cream', 'fromage', 'cheese', 'yaourt', 'yogurt', 'yoghurt', 'oeuf', 'egg', 'mozzarella',
    'parmesan', 'emmental', 'gruyere', 'comte', 'feta', 'chevre', 'ricotta', 'mascarpone', 'burrata', 'cheddar', 'roquefort', 'camembert',
    'reblochon', 'raclette', 'fromage blanc', 'skyr', 'petit suisse', 'faisselle', 'philadelphia', 'cottage', 'brie', 'pecorino', 'halloumi',
    'tofu', 'pate feuilletee', 'pate brisee', 'pate sablee', 'pate a pizza', 'puff pastry', 'shortcrust', 'gnocchi',
  ]],
  ['bakery', ['pain', 'bread', 'baguette', 'brioche', 'tortilla', 'wrap', 'pita', 'naan', 'burger bun', 'buns', 'croissant', 'bagel', 'focaccia', 'ciabatta']],
  ['drinks', ['vin ', 'vin blanc', 'vin rouge', 'wine', 'biere', 'beer', 'jus d', 'juice', 'eau gazeuse', 'sparkling', 'cidre', 'cider', 'soda', 'rhum', 'rum', 'vodka', 'gin', 'whisky', 'cognac', 'porto', 'champagne', 'prosecco', 'sirop', 'syrup', 'cafe', 'coffee', 'the ', 'tea']],
  ['sweet', [
    'sucre', 'sugar', 'chocolat', 'chocolate', 'cacao', 'cocoa', 'miel', 'honey', 'confiture', 'jam', 'levure', 'yeast', 'baking powder',
    'bicarbonate', 'baking soda', 'farine', 'flour', 'maizena', 'fecule', 'cornstarch', 'amande en poudre', 'poudre d amande', 'ground almond',
    'biscuit', 'speculoos', 'pepites', 'chips', 'nutella', 'pate a tartiner', 'caramel', 'sirop d erable', 'maple', 'agave', 'cassonade',
    'vergeoise', 'gelatine', 'agar', 'colorant', 'sucre glace', 'icing', 'praline', 'pralin', 'flocons d avoine', 'oats', 'cereales', 'cereal',
  ]],
  ['savoury', [
    'pate', 'pasta', 'spaghetti', 'penne', 'tagliatelle', 'fusilli', 'linguine', 'lasagne', 'macaroni', 'nouille', 'noodle', 'riz', 'rice',
    'quinoa', 'boulgour', 'bulgur', 'semoule', 'couscous', 'lentille', 'lentil', 'pois chiche', 'chickpea', 'haricot rouge', 'haricots blancs',
    'kidney', 'beans', 'huile', 'oil', 'vinaigre', 'vinegar', 'moutarde', 'mustard', 'mayonnaise', 'ketchup', 'sauce soja', 'soy sauce', 'tamari',
    'concentre de tomate', 'tomato paste', 'coulis', 'passata', 'tomates concassees', 'pulpe de tomate', 'chopped tomatoes', 'lait de coco',
    'coconut milk', 'creme de coco', 'conserve', 'olive', 'capre', 'caper', 'cornichon', 'pickle', 'pesto', 'tahini', 'tahin', 'harissa',
    'nuoc mam', 'fish sauce', 'sauce', 'bouillon', 'chapelure', 'breadcrumb', 'panko', 'polenta', 'noix', 'nut', 'amande', 'almond', 'noisette',
    'hazelnut', 'cajou', 'cashew', 'pistache', 'pistachio', 'pignon', 'pine nut', 'graine', 'seed', 'sesame', 'raisin sec', 'raisins secs', 'raisin',
    'dattes', 'date', 'abricot sec', 'cranberr', 'mais en conserve', 'thon en boite', 'sweetcorn',
  ]],
  ['produce', [
    'tomate', 'tomato', 'oignon', 'onion', 'echalote', 'shallot', 'ail', 'garlic', 'carotte', 'carrot', 'pomme de terre', 'potato', 'patate',
    'courgette', 'zucchini', 'aubergine', 'eggplant', 'poivron', 'bell pepper', 'concombre', 'cucumber', 'salade', 'lettuce', 'laitue', 'roquette',
    'arugula', 'epinard', 'spinach', 'chou', 'cabbage', 'brocoli', 'broccoli', 'champignon', 'mushroom', 'poireau', 'leek', 'celeri', 'celery',
    'fenouil', 'fennel', 'radis', 'radish', 'betterave', 'beet', 'navet', 'turnip', 'panais', 'parsnip', 'potiron', 'potimarron', 'courge',
    'squash', 'pumpkin', 'butternut', 'avocat', 'avocado', 'citron', 'lemon', 'lime', 'orange', 'pomme', 'apple', 'poire', 'pear', 'banane',
    'banana', 'fraise', 'strawberr', 'framboise', 'raspberr', 'myrtille', 'blueberr', 'mangue', 'mango', 'ananas', 'pineapple', 'peche', 'peach',
    'abricot', 'apricot', 'prune', 'plum', 'cerise', 'cherr', 'kiwi', 'melon', 'pasteque', 'watermelon', 'grenade', 'pomegranate', 'figue', 'fig',
    'persil', 'parsley', 'coriandre', 'cilantro', 'coriander', 'basilic', 'basil', 'menthe', 'mint', 'ciboulette', 'chive', 'aneth', 'dill',
    'thym', 'thyme', 'romarin', 'rosemary', 'estragon', 'tarragon', 'sauge', 'sage', 'gingembre', 'ginger', 'piment frais', 'oignon nouveau',
    'spring onion', 'scallion', 'haricot vert', 'green bean', 'petit pois', 'peas', 'mais', 'corn', 'asperge', 'asparagus', 'artichaut', 'artichoke',
    'endive', 'mache', 'cresson', 'pousse', 'sprout', 'patate douce', 'sweet potato', 'citronnelle', 'lemongrass', 'legume', 'vegetable', 'fruit',
  ]],
];

/** Pre-built for speed: [aisle, folded keyword][] */
const KEYWORDS: [Aisle, string][] = RULES.flatMap(([a, ks]) => ks.map((k) => [a, fold(k)] as [Aisle, string]));

/** Overrides that must be checked before the generic rules (e.g. "lait de coco" is not dairy). */
const OVERRIDES: [string, Aisle][] = [
  ['lait de coco', 'savoury'],
  ['creme de coco', 'savoury'],
  ['coconut milk', 'savoury'],
  ['lait d amande', 'drinks'],
  ['lait d avoine', 'drinks'],
  ['lait de soja', 'drinks'],
  ['beurre de cacahuete', 'sweet'],
  ['peanut butter', 'sweet'],
  ['noix de coco', 'sweet'],
  ['noix de muscade', 'spices'],
  ['pomme de terre', 'produce'],
  ['pommes de terre', 'produce'],
  ['jus de citron', 'produce'],
  ['zeste', 'produce'],
  ['concentre de tomate', 'savoury'],
  ['tomates concassees', 'savoury'],
  ['tomates pelees', 'savoury'],
  ['coulis de tomate', 'savoury'],
  ['pate a pizza', 'dairy'],
  ['fromage rape', 'dairy'],
  ['sucre vanille', 'sweet'],
  ['extrait de vanille', 'sweet'],
  ['gousse de vanille', 'sweet'],
  ['thym frais', 'produce'],
  ['eau', 'other'],
];

export function aisleOf(name: string): Aisle {
  const f = ` ${fold(name)} `;
  for (const [k, a] of OVERRIDES) if (f.includes(` ${k} `) || f.trim() === k) return a;
  for (const [a, k] of KEYWORDS) {
    // short keys must be whole words ("vin" is not "vinaigre", "lait" is not "laitue");
    // longer ones match a word start ("tomate" matches "tomates")
    const hit = k.length <= 4 ? [` ${k} `, ` ${k}s `, ` ${k}x `].some((p) => f.includes(p)) : f.includes(` ${k}`);
    if (hit) return a;
  }
  return 'other';
}
