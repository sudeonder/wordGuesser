# Word Guessing Game (FastText Edition)

A single-player **word-guessing game** powered by **FastText word embeddings**. You guess a word; the backend scores how semantically close it is to the secret word using cosine similarity.

## What’s included

### Gameplay + UI
- **Modern dark UI** (Next.js + Tailwind)
- **Large “Latest Guess” card** shown above history (word + similarity + proximity)
- **Guess history table**: `guess | similarity | proximity`
  - History is **sorted by proximity**
  - Proximity states:
    - **Exact Match**
    - **Top 1000**: shows `X / 1000` + a progress bar
    - **Warm**: in top 1500
    - **Cold**: not in top 1500
- **Peek feature**: press-and-hold eye icon to reveal the secret word (debug/cheat)
- **Hint button**: opens a modal showing the **top 100 closest words** (from corpus)
- **Victory effect**: special visual effect instead of an alert
- **Footer**: “Sude • 2026 • Bilkent” (funky)

### Backend
- **FastAPI** backend with endpoints to:
  - create a new game
  - score a guess (similarity + rank signals)
  - reveal the secret word (peek)
  - get top-100 hint words
- **FastText model loaded once on startup** (configurable path)
- **Curated corpus** (`backend/words.txt`) used to:
  - pick random secret words
  - compute proximity rank / top-1500 signals
  - generate hint list

> Note: Game sessions are currently **in-memory**, so restarting the backend invalidates existing `game_id`s.

## Repo structure
- `frontend/` — Next.js (TypeScript, Tailwind)
- `backend/` — FastAPI (Python), FastText integration, corpus tooling

## Local development

### 0) Clone the repo

```bash
git clone <YOUR_REPO_URL>
cd guess
```

### 1) Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### FastText model (recommended)

The backend will look for `backend/cc.en.300.bin` by default.

```bash
cd backend
wget https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.en.300.bin.gz
gunzip cc.en.300.bin.gz
```

If you want to store the model elsewhere, set:

```bash
export FASTTEXT_MODEL_PATH=/absolute/path/to/cc.en.300.bin
```

#### (Optional) Rebuild the corpus

This repo includes `backend/words.txt` already, but you can regenerate it:

```bash
cd backend
source venv/bin/activate
python build_corpus.py
```

#### Run the backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Backend API:
- `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### 2) Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- `http://localhost:3000`

## API overview (backend)

- **GET** `/new-game` → create a game, returns `{ game_id }`
- **POST** `/score` → score a guess
- **GET** `/reveal/{game_id}` → reveal secret word for that game
- **GET** `/hint/{game_id}` → top 100 closest words from corpus

For detailed endpoint testing commands, see `backend/TESTING_ENDPOINTS.md`.

## Configuration

Backend:
- **`FASTTEXT_MODEL_PATH`**: absolute path to `.bin` model file (defaults to `backend/cc.en.300.bin`)

Frontend:
- By default the frontend expects the backend at `http://localhost:8000` (see `frontend/lib/api.ts`).

## Troubleshooting

### “Game not found” (404)
- The backend stores games in-memory. If you restart the backend, previously issued `game_id`s are invalid.

### FastText install issues (macOS)
If `pip install fasttext` fails due to build isolation / pybind, try:

```bash
pip install pybind11
pip install --no-build-isolation fasttext==0.9.2
```

### Model not found
- Ensure `backend/cc.en.300.bin` exists, or set `FASTTEXT_MODEL_PATH`.
- If the model isn’t found, the backend falls back to a simpler similarity and will log a warning.

## Notes / Next improvements
- Persist games (Redis/Postgres) so `game_id`s survive restarts
- Cache hint computations (top-100 similarity list) for faster repeated opens
