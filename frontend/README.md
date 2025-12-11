# Frontend project

## Purposes

### Critical features

Review clear cuts on a map or a list view  
Allow users to edit clear cutting form to add extra information

## CI/CD

### Build and test 
A github action run on all branches to build and test code : [Front CI](../.github/workflows/frontend-ci.yml)  

## Development commands

Install [node](https://nodejs.org/fr)  
Install package manager [pnpm](https://pnpm.io/fr/installation)  
Install dependencies : `pnpm i`  
To run in development mode : `pnpm dev`  
To run in development mode with mock service worker: `pnpm dev:mock`  
To run in development mode on a mobile device (same Wi-Fi network)  
 - Run `pnpm dev:host`
 - Copy the `Network URL` displayed in the terminal
 - In `.env.development` file, set `VITE_API` to this Network URL with port `8080`.
 - On your phone, navigate to the `Network URL`  

To format and lint : `pnpm cleanup`  
To start storybook: `pnpm storybook`

## VS Code configuration

Please install the recommended extensions listed [recommended extensions file](../.vscode/extensions.json)

Then use [workspace folder settings](./.vscode/settings.json)

## Technical choices

- Package manager : [PNPM](https://pnpm.io/fr/) centralized package manager for javascript packages, reduce amount of downloaded across multiple projects
- SPA : [React](https://fr.react.dev/) library, many usages among professional frontend developers
- Map : [Leaflet](https://leafletjs.com/) and [React Leaflet](https://react-leaflet.js.org/) library, free map, allow to draw lines, polygons, circles on a map
- CSS Framework : [Tailwind](https://tailwindcss.com/), flexible css design
- State management : [RTK](https://redux-toolkit.js.org/), well suited state management with a good documentation
- Build tool : [Vite](https://vite.dev/), fast and simple tool
- Test framework : [Vitest](https://vitest.dev/), works well with Vite
- Integration test : [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), interacts with a computed dom to test UI
- Mock server : [MSW](https://mswjs.io/) intercept http requests and returns mocks
- Format / Linter : [Biome](https://biomejs.dev/) formatter and linter, easier to configure than eslint and faster
- Routing : [Tanstack router](https://tanstack.com/router/latest) files based routing, type safe router
- Progressive WebApp : [Vite PWA](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) Add pwa integration with vite tool

## Mocks

To mocks api requests we use [MSW](https://mswjs.io/)
You can add mocks in the folder /src/mocks

## PWA

PWA configuration is done vite.config.ts.  
We use register type "prompt" to allow user prompting before updating installed version. We have to proceed like this because if user is editing a form we don't want a refresh of the application without its consent.

## Folders architecture

### /features

On subfolder by feature e.g : clear-cutting handle all features relative to clear cuts, visualization, edition etc...

### /routes

File based routing please see [Tanstack router](https://tanstack.com/router/latest) documentation

### /shared

Available files in the whole project as components, hooks, store etc ...

### /test

Test files

### /mocks

List of mocks and http handlers


