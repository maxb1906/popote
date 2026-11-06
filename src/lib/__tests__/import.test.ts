import { recipesFromHtml } from '../import/jsonld';
import { captionFromHtml, detectSource, instagramCaption } from '../import/social';
import { metaContent } from '../import/html';
import { splitInput } from '../import';

const PAGE = `<!doctype html><html><head>
<title>Tarte aux pommes - Mon blog</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
 {"@type":"WebSite","name":"Mon blog"},
 {"@type":["Recipe"],"name":"Tarte aux pommes &amp; cannelle","image":["https://ex.com/a.jpg"],
  "recipeYield":"6 parts","prepTime":"PT20M","cookTime":"PT35M","recipeCategory":"Dessert",
  "recipeIngredient":["1 pâte brisée","4 pommes","50 g de sucre","1 c. à café de cannelle"],
  "recipeInstructions":[{"@type":"HowToSection","name":"Tarte","itemListElement":[
    {"@type":"HowToStep","text":"Étalez la pâte dans un moule."},
    {"@type":"HowToStep","text":"Disposez les pommes, saupoudrez de sucre et enfournez 35 min."}]}],
  "nutrition":{"@type":"NutritionInformation","calories":"310 kcal","fatContent":"12 g"},
  "keywords":"tarte, pomme, automne"}
]}</script></head><body></body></html>`;

describe('JSON-LD', () => {
  test('finds a Recipe inside @graph', () => {
    const [r] = recipesFromHtml(PAGE, 'https://ex.com/tarte');
    expect(r.title).toBe('Tarte aux pommes & cannelle');
    expect(r.servings).toBe(6);
    expect(r.prepMinutes).toBe(20);
    expect(r.totalMinutes).toBe(55);
    expect(r.dishType).toBe('dessert');
    expect(r.ingredients).toHaveLength(4);
    expect(r.ingredients[3]).toMatchObject({ qty: 1, unit: 'tsp', name: 'cannelle' });
    expect(r.steps).toHaveLength(2);
    expect(r.steps[1].timerSeconds).toBe(2100);
    expect(r.nutrition).toEqual({ kcal: 310, fat: 12, protein: undefined, carbs: undefined });
    expect(r.image).toBe('https://ex.com/a.jpg');
    expect(r.tags).toContain('automne');
  });

  test('instructions given as one string', () => {
    const html = `<script type="application/ld+json">{"@type":"Recipe","name":"Soupe","recipeIngredient":["1 poireau"],"recipeInstructions":"1. Coupez le poireau. 2. Faites cuire 20 min."}</script>`;
    const [r] = recipesFromHtml(html);
    expect(r.steps.map((s) => s.text)).toEqual(['Coupez le poireau.', 'Faites cuire 20 min.']);
  });

  test('page without recipe', () => {
    expect(recipesFromHtml('<html><head><title>x</title></head></html>')).toEqual([]);
  });
});

describe('social', () => {
  test('detectSource', () => {
    expect(detectSource('https://www.instagram.com/reel/abc/')).toBe('instagram');
    expect(detectSource('https://vm.tiktok.com/xyz')).toBe('tiktok');
    expect(detectSource('https://youtu.be/abc')).toBe('youtube');
    expect(detectSource('https://fr.pinterest.com/pin/1')).toBe('pinterest');
    expect(detectSource('https://www.marmiton.org/recettes/x.aspx')).toBe('web');
  });

  test('instagram og:description', () => {
    expect(instagramCaption('1,234 likes, 56 comments - chef.lea on May 2, 2026: "Risotto crémeux\n200 g de riz"')).toBe(
      'Risotto crémeux\n200 g de riz',
    );
  });

  test('meta with apostrophes', () => {
    const html = `<meta property="og:description" content="Ajoutez l'huile d'olive" />`;
    expect(metaContent(html, 'og:description')).toBe("Ajoutez l'huile d'olive");
  });

  test('youtube description', () => {
    const html = `<meta name="title" content="Best Dahl"><meta property="og:title" content="Best Dahl - YouTube"><script>var x={"shortDescription":"Ingredients:\\n200 g red lentils\\n1 onion\\nMethod:\\nCook everything 20 min."}</script>`;
    const cap = captionFromHtml(html, 'youtube');
    expect(cap?.title).toBe('Best Dahl');
    expect(cap?.text).toContain('200 g red lentils');
  });

  test('splitInput', () => {
    const { urls, text } = splitInput('regarde https://a.com/x, et https://b.com/y.');
    expect(urls).toEqual(['https://a.com/x', 'https://b.com/y']);
    expect(text.replace(/\s+/g, ' ')).toBe('regarde et');
  });
});
