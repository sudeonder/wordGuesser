# Word Guessing Game - Backend

FastAPI backend for the word guessing game using word embedding similarity.

## Setup

1. Create a virtual environment (recommended):
```bash
# Option 1: Use default python3 (recommended: Python 3.10+)
python3 -m venv venv

# Option 2: Specify a specific Python version explicitly
/Library/Frameworks/Python.framework/Versions/3.10/bin/python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### GET /new-game
Creates a new game session and returns a `game_id`.

**Response:**
```json
{
  "game_id": "string"
}
```

### POST /score
Scores a guess against the secret word.

**Request:**
```json
{
  "game_id": "string",
  "guess": "string"
}
```

**Response:**
```json
{
  "similarity": 0.85,
  "score": 85,
  "is_correct": false
}
```

## TODO

- [ ] Load word list from `words.txt` file
- [ ] Integrate fastText embedding model for actual similarity computation
- [ ] Replace placeholder similarity function with embedding-based cosine similarity

## Development Notes

- Games are stored in-memory (will be lost on server restart)
- No authentication or database required for Version 0
- CORS is configured to allow requests from `http://localhost:3000`
