<p align="center"><img src="design/icon.svg" width="96" alt=""></p>

<h1 align="center">Popote</h1>

<p align="center">
Le carnet de recettes libre, gratuit et sans compte.<br>
Collez un lien, cuisinez, planifiez la semaine, faites les courses.
</p>

<p align="center"><a href="#english">English below</a></p>

---

## Ce que fait Popote

- **Import de recettes** depuis un lien (sites de recettes, Instagram, TikTok, YouTube, Facebook, Pinterest), plusieurs liens d'un coup, un texte collé, un fichier (.txt, .html, sauvegarde) — **sans IA et sans serveur** : la lecture se fait sur le téléphone.
- **Fiche recette** : portions ajustables (quantités recalculées), temps, étiquettes, valeurs nutritionnelles, photo, **allergènes détectés** (les 14 allergènes réglementaires), mode **« tout en grammes »** pour robot cuiseur ou balance.
- **Mode cuisine** : une étape à la fois en grand, écran toujours allumé, **minuteurs** détectés dans les étapes (alerte même app fermée).
- **« J'ai cuisiné ça »** : compteur, et suggestions de recettes de votre carnet pour finir les restes.
- **Semaine** : planning midi / soir, portions par repas, « remplir avec des idées ».
- **Liste de courses** générée depuis la semaine : ingrédients fusionnés, quantités additionnées (g + kg, cl + l…), **classés par rayon**, articles ajoutés à la main, partage.
- **Mode magasin** : un rayon à la fois, en grand, hors ligne.
- **Mon placard** : ce que vous avez toujours (sel, huile…) passe dans « Déjà à la maison ».
- **Frigo** : « qu'est-ce que je cuisine avec ce que j'ai ? » classe vos recettes selon ce qu'il y a dans le frigo.
- **Carnets** pour ranger les recettes, favoris, recherche par plat ou ingrédient, 4 tris.
- **Sauvegarde** en un fichier pour changer de téléphone ou partager le carnet avec le foyer.
- Français et anglais, thème clair et sombre.

### Option : votre propre IA

Popote marche sans IA. Si vous voulez **importer des photos** (livre de cuisine, fiche manuscrite) ou des PDF scannés, ajoutez **votre** clé dans Réglages → IA :

- **Anthropic (Claude)** — modèle par défaut `claude-opus-5-5`, modifiable ;
- ou tout service **compatible OpenAI** (OpenAI, Mistral, OpenRouter…), y compris un **Ollama local** gratuit (`http://IP-de-votre-PC:11434/v1`).

La clé reste sur le téléphone et n'est envoyée qu'au service choisi.

## Vie privée

Pas de compte, pas de serveur, pas de pistage, pas de publicité. Tout est stocké sur l'appareil. Les seules requêtes réseau sont celles que vous déclenchez : ouvrir le lien que vous collez (et l'oEmbed officiel de TikTok / YouTube), et l'IA si vous l'avez configurée.

## Télécharger

- **Android** : téléchargez `popote-x.y.z.apk` depuis la page [Releases](https://github.com/maxb1906/popote/releases/latest), ouvrez-le sur le téléphone et autorisez l'installation. L'APK est reconstruit automatiquement à chaque mise à jour.
- **iPhone / iPad** : ouvrez [maxb1906.github.io/popote](https://maxb1906.github.io/popote/) dans **Safari**, touchez Partager → **Sur l'écran d'accueil**. Popote s'ouvre alors comme une app, en plein écran, et garde vos données sur l'appareil. Limite de cette version : l'import par lien ne marche pas (Safari bloque la lecture des autres sites) ; collez plutôt le texte de la recette.
- **iPhone, app native** : avec Expo Go (voir ci-dessous) pour l'essayer, ou via TestFlight / App Store, qui demande un compte Apple Developer.

## Installer et lancer

Prérequis : [Node.js](https://nodejs.org) 20+ et l'app **Expo Go** sur votre téléphone.

```bash
npm install
npx expo start
```

Scannez le QR code avec Expo Go (Android) ou l'appareil photo (iPhone). `npm run web` ouvre une version navigateur pour développer (l'import par lien n'y fonctionne pas : les navigateurs bloquent la lecture d'autres sites).

### Construire les versions installables

- **APK Android** : automatique. Le workflow `.github/workflows/android.yml` compile l'APK à chaque push sur `main` et le publie dans la release `latest`. En local : `npx expo prebuild -p android` puis `cd android && ./gradlew assembleRelease` (Java 17 et SDK Android requis).
- **Web / iPhone** : automatique. `.github/workflows/web.yml` publie la version web installable sur GitHub Pages.
- **App iOS native** (TestFlight / App Store) : compte [Apple Developer](https://developer.apple.com/programs/) et compte Expo gratuit, puis `npx eas-cli@latest build -p ios --profile production` et `npx eas-cli@latest submit -p ios`. Pas besoin de Mac : la compilation se fait sur les serveurs d'Expo.
- **Play Store** : `npx eas-cli@latest build -p android --profile production` (fichier .aab) puis `submit`.

## Développer

```bash
npm test            # tests unitaires des analyseurs (ingrédients, recettes, courses…)
npm run typecheck   # TypeScript
npm run contrast    # contraste WCAG des couleurs du thème
```

| Dossier | Contenu |
| --- | --- |
| `src/app/` | écrans (Expo Router) |
| `src/lib/parse/` | lecture d'ingrédients, de durées, de recettes en texte libre (FR + EN) |
| `src/lib/import/` | import par lien : données schema.org des pages, légendes des réseaux sociaux |
| `src/lib/shopping.ts`, `aisles.ts` | fusion des quantités et classement par rayon |
| `src/lib/ai.ts` | import IA optionnel avec la clé de l'utilisateur |
| `src/store/` | données locales (Zustand + AsyncStorage) |
| `src/i18n.ts` | textes FR / EN — ajoutez une langue ici |
| `design/` | couleurs (`tokens.json`), icône (`icon.mjs`) |

Les contributions sont bienvenues : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE). Popote est un projet indépendant, sans lien avec aucune autre application de recettes.

---

<a id="english"></a>

## English

**Popote** is a free, open-source recipe notebook with no account and no server.

- Import recipes from links (recipe sites, Instagram, TikTok, YouTube, Facebook, Pinterest), pasted text or files. Parsing runs on the phone, no AI needed.
- Recipe sheet with servings scaling, allergen detection, nutrition, and an "everything in grams" mode for kitchen robots.
- Cook mode: big steps, screen kept on, timers found in the steps.
- Week planner, shopping list merged and grouped by aisle, store mode, pantry staples, "what can I cook with my fridge".
- Notebooks, favourites, search, backup file to move or share your data. French and English, light and dark.
- Optional: bring your own AI key (Claude, any OpenAI-compatible API, or a local Ollama) to import photos and scanned PDFs.

```bash
npm install
npx expo start      # then open in Expo Go
npm test
```

Licence: MIT.
