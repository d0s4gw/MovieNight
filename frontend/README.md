# MovieNight Frontend Application

A dynamic, responsive Single Page Application (SPA) built with React and Vite, featuring a premium glassmorphism aesthetic.

## Tech Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Authentication**: Firebase Client SDK (Secure login/signup)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Core Features
1. **Secure Login:** Integrated with Firebase Auth for private, per-user movie preferences and watchlists.
2. **Glassmorphism Design:** Modern UI utilizing CSS variables, Flexbox/Grid, and backdrop-blur effects.
3. **Optimized Fetching:** Uses `AbortController` to prevent race conditions during rapid filtering.

## Development Setup
1. `npm install`
2. Create a `.env` file with your `VITE_FIREBASE_*` credentials.
3. `npm run dev`

## Scripts
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles for production.
- `npm test`: Runs the Vitest test suite.

## Deployment Notes
In production, all `/api` requests are rewritten to the backend Cloud Run service via **Firebase Hosting** configuration.
