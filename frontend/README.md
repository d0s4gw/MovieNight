# MovieNight Frontend Application

The frontend is a dynamic, responsive Single Page Application (SPA) built with React and Vite. It heavily relies on modern CSS (Vanilla CSS, no tailwind required) utilizing CSS variables, Flexbox/Grid, and glassmorphism.

## Core Features
1. **Dynamic Routing (Tabs):** Features a clean UI with "Discover", "For You", and "Household" tabs managing local state.
2. **Multi-User Context:** Allows switching between household members, applying default content ratings based on the profile's age restrictions.
3. **Race Condition Prevention:** Uses `AbortController` in all data-fetching `useEffect` hooks to instantly cancel stale API requests when users click through filters quickly.

## Development Setup

1. `npm install`
2. To start the Vite development server:
   ```bash
   npm run dev
   ```
*Note: Vite is configured to proxy all `/api` requests to `http://localhost:3001`. You must have the backend running simultaneously for API functionality.*

## Testing
The application uses Vitest and `@testing-library/react` configured with a `jsdom` environment.

* Run the test suite: `npm test`
* Generate a coverage report: `npm run test -- --coverage`

## Extending the UI
The application styles are centrally defined in `index.css` via CSS custom variables (`--bg`, `--accent`, `--glass-bg`). When creating new components, utilize the existing `.glass`, `.tab-btn`, and `.search-input` classes to maintain the premium aesthetic.
