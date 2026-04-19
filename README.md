# MovieNight 🍿

MovieNight is a full-stack, multi-user web application designed to help households discover movies, manage personal preferences, and generate tailored recommendations based on streaming availability.

## Architecture

* **Frontend:** Built with React, Vite, and modern CSS featuring glassmorphism and dark-mode aesthetics.
* **Backend:** Built with Node.js and Express. Handles API routing, input validation (express-validator), and security headers (Helmet).
* **Database:** SQLite handles local persistence for User Profiles, Movie Preferences (Likes/Dislikes), and includes a fast API Caching layer to respect rate limits.
* **External API:** Integrates tightly with [The Movie Database (TMDB)](https://developer.themoviedb.org/docs) for real-time movie discovery and high-resolution posters.

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* A TMDB API Key and Read Access Token

### Configuration
1. Navigate into the `backend` directory.
2. Create a `.env` file from `.env.example` (or configure it manually) with your TMDB credentials:
   ```env
   TMDB_API_KEY=your_api_key_here
   TMDB_ACCESS_TOKEN=your_access_token_here
   ```

### Running the Application (Production Mode)
The backend is configured to statically serve the built React frontend.

1. **Build the frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. **Start the backend:**
   ```bash
   cd ../backend
   npm install
   npm start
   ```
3. Open your browser to `http://localhost:3001`!

## Multi-User Household
The application supports multiple profiles in the same household. 
* Navigate to the **Household** tab to add your family members. 
* Age-restricted profiles automatically set appropriate rating filters on the Discover page.
* "For You" recommendations are strictly isolated to the *Active User* selected in the header dropdown.

## Testing
Comprehensive testing is implemented across the stack:
* **Backend Tests (Jest + Supertest):** `cd backend && npm run test:coverage`
* **Frontend Tests (Vitest + React Testing Library):** `cd frontend && npm run test -- --coverage`

## Documentation
For more detailed instructions on extending or running individual development servers, please refer to the specific READMEs:
* [Backend README](./backend/README.md)
* [Frontend README](./frontend/README.md)
