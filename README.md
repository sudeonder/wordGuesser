# Word Guessing Game

A single-player word guessing game that uses word embedding similarity to score guesses.

## Project Structure

This is a monorepo containing:

- `frontend/` - Next.js application (TypeScript, Tailwind CSS)
- `backend/` - FastAPI application (Python)

## Quick Start

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

See `backend/README.md` for more details.

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

See `frontend/README.md` for more details.

## Development Notes

- Both frontend and backend can be run independently
- No authentication or database required for Version 0
- Games are stored in-memory (backend state is lost on restart)
- Word embeddings integration is prepared but uses placeholder similarity for now

## TODO

- [ ] Integrate fastText embedding model in backend
- [ ] Load word list from `words.txt` file in backend
- [ ] Replace placeholder similarity computation with actual embedding-based cosine similarity
