# MovieNight Backend Service

The Node.js/Express backend handles interactions with the TMDB API, data caching, and persistent local storage using SQLite.

## Core Features
1. **TMDB Integration:** Uses `tmdbService.js` to communicate with the TMDB API. It concurrently fetches metadata (`Promise.all`) to power the recommendations engine efficiently.
2. **SQLite Database:** Stores User Profiles, composite User Preferences (likes/dislikes), and a TTL Cache for TMDB requests to dramatically speed up user searches.
3. **Security:** Secured with `helmet` for HTTP headers, and strict endpoint validation using `express-validator` to prevent malicious payloads from reaching the database.

## Development Setup

1. `npm install`
2. Create a `.env` file with `TMDB_API_KEY` and `TMDB_ACCESS_TOKEN`.
3. To start the API server:
   ```bash
   npm start
   ```

*Note: The server runs on port `3001` and is configured to proxy requests from the Vite frontend during development. In production, the Express server also serves the static files from `../frontend/dist`.*

## Testing
The Express application is cleanly separated into `app.js` (logic) and `server.js` (listener/shutdown) to support isolated testing via `supertest`.

* Run the test suite: `npm test`
* Generate a coverage report: `npm run test:coverage`

## Extending the API
To add new routes, implement them in `app.js`. For any route touching the database, ensure it uses parameterized queries (or `express-validator`) to maintain SQLite injection protection. For new TMDB endpoints, define the request in `tmdbService.js` to leverage the built-in caching engine.
