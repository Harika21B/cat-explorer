## Cat Explorer

Cat Explorer is an Angular 17 + Angular Material single-page application for exploring cats using **The Cat API**.  
You can:

- Browse random cat images by breed
- Filter by breed using a dedicated selector
- Mark images as favorites and manage them in a dialog
- Vote on images (up/down) and review or edit your votes
- See breed-specific statistics for favorites and votes

---

## Tech Stack

- **Framework**: Angular 17 (standalone components, signals)
- **UI Library**: Angular Material
- **Language**: TypeScript
- **HTTP / Data**: `HttpClient` + The Cat API

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended)
- **npm** 9+  
- A free API key from **The Cat API** (`https://thecatapi.com`).

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd cat-explorer
```

2. Install dependencies:

```bash
npm install
```

3. Configure your Cat API key:

Update `src/app/environments/environment.ts` (or your environment management of choice) with your own key:

```ts
export const environment = {
  production: false,
  catApiKey: 'YOUR_CAT_API_KEY_HERE',
};
```

> **Note**: In a real project you should not commit real API keys. Use environment-specific files or secrets management.

4. (Optional) Confirm the dev proxy:

The project uses a proxy to avoid CORS issues and to route `/api` to The Cat API:

```json
{
  "/api": {
    "target": "https://api.thecatapi.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": "/v1"
    },
    "logLevel": "debug"
  }
}
```

This is already configured in `src/proxy.conf.json` and wired in `angular.json` via the dev server options.

---

## Running the App

### Development server

```bash
npm start
```

This runs `ng serve`:

- App URL: `http://localhost:4200`
- API proxy: all HTTP calls go to `/api/...` and are forwarded to The Cat API.

The app will automatically reload if you change any of the source files.

### Production build

```bash
npm run build
```

The optimized build will be output to `dist/cat-explorer`.

### Unit tests

```bash
npm test
```

Runs unit tests via Karma and Jasmine.

---

## Application Overview

- **Root component**: `AppComponent`
  - Top toolbar showing app title and breed-specific statistics (favorites and votes).
  - Tabbed interface:
    - **Random Cats**: displays random cats (optionally filtered by breed), supports voting, favoriting, and viewing details.
    - **Favorites**: shows your favorites, with helpful empty states and filtering by current breed.
    - **My Votes**: shows your votes, with breed filters and empty states.
  - Uses Angular Material components for a modern UI (toolbar, tabs, icons, badges, dialogs, buttons, snack bars).

- **Breed selection**: `BreeSelectorComponent`
  - Allows choosing a specific breed or "All Breeds".
  - Changing breed refreshes the random cats tab and adjusts statistics and filters.

- **Grid display**: `CatGridComponent`
  - Displays cats in a responsive grid.
  - Emits events for vote, favorite toggle, and details view.

- **Dialogs**
  - `FavoritesDialogComponent`: manage and view all favorites.
  - `VotesDialogComponent`: inspect and manage votes, including editing or deleting.
  - `CatDetailsDialogComponent`: detailed information for a specific cat image.

- **Data service**: `CarServiceService`
  - Centralized service for:
    - Fetching breeds, random cats, specific images, image analysis
    - Adding/removing/updating favorites
    - Creating, updating, deleting votes
  - Uses Angular **signals** for state:
    - Breeds, images, votes, favorites
    - Loading and error state
    - Selected breed and derived computed values (e.g. breed-specific counts).
  - Relies on `environment.catApiKey` and the `/api` proxy.

---

## Environment & Configuration

- **Environment file**: `src/app/environments/environment.ts`
  - Holds the `catApiKey` used by `CarServiceService`.
- **Proxy config**: `src/proxy.conf.json`
  - Forwards `/api` calls to `https://api.thecatapi.com/v1`.
- **Angular config**: `angular.json`
  - Configures build/serve targets, styles, and includes the proxy.

For production, you should:

- Provide a separate environment file with `production: true`.
- Inject the API key via environment variables or a secure secret store.

---

## Scripts

From `package.json`:

- **`npm start`**: Run dev server (`ng serve`).
- **`npm run build`**: Build for production (`ng build`).
- **`npm run watch`**: Build in watch mode (`ng build --watch --configuration development`).
- **`npm test`**: Run unit tests (`ng test`).

---

## Notes

- This project is meant as a learning/demo application for:
  - Angular 17 standalone components and signals
  - Angular Material UI
  - Integrating with an external REST API (The Cat API)
- Feel free to adapt components, styles, or data flows to suit your needs.

# CatExplorer

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
