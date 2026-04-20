# MovieNight Backend Service

The Node.js/Express backend handles interactions with the TMDB API and manages data using Google Cloud Firestore.

## Tech Stack
- **Database**: Google Cloud Firestore (via MongoDB API)
- **ODM**: Mongoose
- **Authentication**: Firebase Admin SDK (JWT Verification)
- **Logging**: Structured JSON Logging (Pino)
- **External API**: [The Movie Database (TMDB)](https://developer.themoviedb.org/docs)
- **Security**: `helmet`, `cors`, and `express-validator`

## Core Features
1. **TMDB Integration:** Uses `tmdbService.js` to communicate with the TMDB API. Includes a TTL Cache to speed up repeated requests.
2. **Mongoose Models:** Stores user profiles, preferences, and watchlists in Firestore via Mongoose schemas, ensuring data consistency.
3. **Cloud-Ready:** Includes health checks, graceful shutdown, and structured logging for Google Cloud Run.
4. **Secure Auth:** All API endpoints are protected by Firebase Auth middleware, ensuring data isolation between users.

## Development Setup
1. `npm install`
2. Create `.env` with `MONGODB_URI`, `TMDB_API_KEY`, and `TMDB_ACCESS_TOKEN`.
3. Place your `service-account.json` in this directory.
4. `npm start`
5. Run `npm run test:db` to verify database connectivity.

## API Endpoints
All endpoints are prefixed with `/api` and require a `Bearer <token>`.
- `/movies`: Search and discover movies
- `/user/profile`: Manage the authenticated user's profile
- `/preferences`: Manage likes/dislikes
- `/watchlist`: Manage the personal watchlist
- `/date-night`: Generate mutual recommendations for two users
- `/recommendations`: Get AI-driven recommendations based on likes
