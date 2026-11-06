# Contribuer à Popote

Merci ! Quelques règles simples.

## Avant d'ouvrir une PR

```bash
npm test
npm run typecheck
```

Les deux doivent passer. Si vous touchez aux couleurs : `npm run contrast` (zéro échec WCAG AA).

## Bons premiers sujets

- **Une recette mal importée ?** Ajoutez le texte (ou un extrait de la page) comme cas de test dans `src/lib/__tests__/`, puis corrigez `src/lib/parse/`. C'est le cœur de l'app.
- **Un ingrédient dans le mauvais rayon ?** Complétez les mots-clés de `src/lib/aisles.ts` et ajoutez un test.
- **Une nouvelle langue ?** Copiez le dictionnaire `en` de `src/i18n.ts`, traduisez, ajoutez le choix dans `src/app/(tabs)/settings.tsx`. Les unités et mots-clés d'ingrédients sont dans `src/lib/units.ts` et `src/lib/parse/`.

## Principes

- **Hors ligne et sans compte d'abord.** Une fonction qui exige un serveur doit rester optionnelle.
- **Pas de collecte de données**, pas de SDK de pistage ou de publicité.
- **Accessibilité** : chaque bouton a un libellé, les couleurs passent le contraste AA, les cibles tactiles font au moins 44 px.
- Les textes de l'interface passent par `t('…')`, jamais en dur dans les écrans.
- Ne copiez pas de code, de textes, d'images ou d'icônes d'autres applications.

## Signaler un bug

Indiquez le téléphone, la version de Popote (Réglages), les étapes pour reproduire, et pour un import raté le lien ou le texte de la recette.
