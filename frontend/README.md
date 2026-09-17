# Frontend

## Rôle

Consulter les coupes rases sur une carte ou en liste, et permettre aux
bénévoles de remplir le formulaire de constat d'une coupe.

## CI

Le workflow [Frontend CI](../.github/workflows/frontend-ci.yml) lance le lint,
les tests et le build sur les pull requests vers `main` et à chaque fusion.

## Commandes de développement

Installer [Node.js](https://nodejs.org/fr) (version dans `.nvmrc`) et
[pnpm](https://pnpm.io/fr/installation).

| Commande | Effet |
|---|---|
| `pnpm i` | Installer les dépendances |
| `pnpm dev` | Serveur de développement sur <http://localhost:5173>, API sur le port 8080 |
| `pnpm dev:mock` | Idem avec l'API simulée par Mock Service Worker, sans backend |
| `pnpm dev:host` | Serveur accessible depuis un téléphone sur le même réseau Wi-Fi (voir ci-dessous) |
| `pnpm cleanup` | Formater et corriger le lint (Biome) |
| `pnpm lint` | Vérifier le format et le lint sans modifier les fichiers (comme la CI) |
| `pnpm test:unit` | Tests de logique pure, sans navigateur |
| `pnpm test:browser` | Tests de composants et de parcours (Playwright/Chromium) |
| `pnpm coverage` | Couverture des deux projets de tests (terminal et `coverage/`) |
| `pnpm build` | Vérification des types et build de production |
| `pnpm storybook` | Explorateur de composants |

Pour tester sur un téléphone :

1. lancer `pnpm dev:host` et copier l'URL `Network` affichée dans le terminal ;
2. dans `.env.development`, donner à `VITE_API` cette URL avec le port `8080` ;
3. ouvrir l'URL `Network` sur le téléphone.

## Configuration VS Code

Installer les extensions listées dans
[.vscode/extensions.json](../.vscode/extensions.json), puis utiliser les
[réglages du dossier](./.vscode/settings.json).

## Choix techniques

- Gestionnaire de paquets : [pnpm](https://pnpm.io/fr/), stockage centralisé des paquets, moins de téléchargements entre projets.
- SPA : [React](https://fr.react.dev/), bibliothèque la plus répandue chez les développeurs frontend.
- Carte : [Leaflet](https://leafletjs.com/) et [React Leaflet](https://react-leaflet.js.org/), fond de carte libre, tracé de lignes, polygones et cercles.
- CSS : [Tailwind](https://tailwindcss.com/).
- État : [Redux Toolkit](https://redux-toolkit.js.org/), bien documenté.
- Build : [Vite](https://vite.dev/), rapide et simple.
- Tests : [Vitest](https://vitest.dev/), intégré à Vite ; [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) pour interagir avec le DOM rendu.
- Serveur simulé : [MSW](https://mswjs.io/), intercepte les requêtes HTTP et renvoie des données de test.
- Format et lint : [Biome](https://biomejs.dev/), plus simple à configurer et plus rapide qu'ESLint.
- Routage : [TanStack Router](https://tanstack.com/router/latest), routes par fichier, typées.
- PWA : [Vite PWA](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html).

## Données simulées

Les requêtes vers l'API sont simulées avec [MSW](https://mswjs.io/) ; les
handlers sont dans `src/mocks/`.

## PWA

La configuration PWA est dans `vite.config.ts`, avec `registerType: "prompt"` :
l'utilisateur est prévenu avant qu'une nouvelle version s'installe, pour ne pas
recharger l'application pendant qu'il édite un formulaire.

## Organisation des dossiers

Détaillée dans [doc/architecture.md](../doc/architecture.md#frontend).

- `src/features/` : un sous-dossier par fonctionnalité (`clear-cut` pour tout ce qui concerne les coupes : carte, liste, formulaire ; `admin`, `user`, `offline`).
- `src/routes/` : routes par fichier, voir la documentation de [TanStack Router](https://tanstack.com/router/latest).
- `src/shared/` : composants, hooks, store et client API partagés par tout le projet.
- `src/components/ui/` : primitives shadcn/ui.
- `src/test/` : utilitaires de test (rendu de l'application, page objects, store) et tests unitaires.
- `src/mocks/` : données simulées et handlers HTTP.
