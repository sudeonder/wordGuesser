# Word Guessing Game - Frontend

Next.js frontend for the word guessing game using word embedding similarity.

## Setup

1. Install dependencies:
```bash
npm install
```

## Running the Development Server

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Environment Variables

You can optionally set the backend API URL via environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

By default, it uses `http://localhost:8000`.

## Project Structure

```
frontend/
  app/
    page.tsx          # Main game page
    layout.tsx        # Root layout
    globals.css       # Global styles with Tailwind
  lib/
    api.ts            # API helper functions
  tailwind.config.ts  # Tailwind configuration
  package.json        # Dependencies
  tsconfig.json       # TypeScript configuration
```

## Features

- Single-player word guessing game
- Real-time similarity scoring
- Guess history with similarity scores
- Game state persisted in localStorage
- Modern, responsive UI with Tailwind CSS

## Development Notes

- Game ID is stored in localStorage to persist across page refreshes
- No authentication required for Version 0
- API calls are made to the backend running on port 8000
