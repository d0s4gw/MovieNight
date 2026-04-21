# MovieNight Frontend Application

A dynamic, responsive Single Page Application (SPA) built with React and Vite, featuring a premium glassmorphism aesthetic.

## Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Authentication**: Firebase Client SDK (Secure login/signup)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Core Features
1. **Secure Login:** Integrated with Firebase Auth for private, per-owner data isolation.
2. **Household Profiles:** Manage family members with a dynamic profile switcher. Supports Adult and Child restrictions.
3. **Glassmorphism Design:** Modern UI utilizing CSS variables, Flexbox/Grid, and backdrop-blur effects.
4. **Optimized Fetching:** Uses `AbortController` to prevent race conditions during rapid filtering.

## Development Setup
1. `npm install`
2. Create a `.env` file with your `VITE_FIREBASE_*` credentials.
3. `npm run dev`

## Scripts
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles for production.
- `npm test`: Runs the Vitest test suite.
- `npm run test:coverage`: Runs tests with coverage report.

## Testing
We use **Vitest** and **React Testing Library**.
- Run tests: `npm test`
- Run with coverage: `npm test -- --coverage`

## Deployment Notes
In production, all `/api` requests are rewritten to the backend Cloud Run service via **Firebase Hosting** configuration.
