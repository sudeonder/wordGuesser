# How the FastText Model is Used in the App

## ✅ Verification Status

**Model File:** `cc.en.300.bin`  
**Size:** 6.7GB  
**Location:** `/Users/sudeonder/Desktop/guess/backend/cc.en.300.bin`  
**Status:** ✅ Downloaded and ready to use

---

## Application Flow Overview

Here's how the fastText model is integrated into your word guessing game:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Startup                        │
│                    (backend/app/main.py)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  @app.on_event("startup")                                       │
│  - Loads model from: backend/cc.en.300.bin                      │
│  - Calls: load_embedding_model(model_path)                      │
│  - Model stored in global variable: _model                      │
│  - Takes ~10-30 seconds (one-time only)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Model Loaded and Ready in Memory                    │
│              (backend/app/embedding.py)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   GET /new-game  │  │  POST /score     │
        │                  │  │                  │
        │ Creates game     │  │ Scores guess     │
        │ Selects word     │  │ Uses model!      │
        └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────┐
                        │ compute_similarity()      │
                        │ (embedding.py)            │
                        │                           │
                        │ 1. Get word vectors       │
                        │    vec1 = model.get_word_ │
                        │         vector(guess)     │
                        │    vec2 = model.get_word_ │
                        │         vector(secret)    │
                        │                           │
                        │ 2. Calculate cosine       │
                        │    similarity             │
                        │                           │
                        │ 3. Normalize to 0-1       │
                        │    range                  │
                        └───────────────────────────┘
```

---

## Step-by-Step Explanation

### 1. **Application Startup** (`app/main.py`)

When you start the backend server with:
```bash
uvicorn app.main:app --reload --port 8000
```

The `startup_event()` function automatically runs and:

```python
@app.on_event("startup")
async def startup_event():
    # Default path: backend/cc.en.300.bin
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cc.en.300.bin")
    
    # Load the model into memory (one-time operation)
    load_embedding_model(model_path)
```

**What happens:**
- The fastText model file (`cc.en.300.bin`) is loaded into memory
- This takes ~10-30 seconds the first time
- The model is stored in a global variable `_model` in `embedding.py`
- You'll see messages: "Loading fastText model..." and "FastText model loaded successfully!"

### 2. **Model Loading** (`app/embedding.py`)

The `load_embedding_model()` function:

```python
def load_embedding_model(model_path: str):
    global _model
    
    # Load the model (fastText library function)
    _model = fasttext.load_model(model_path)
    
    # Model is now in memory and ready to use
    return _model
```

**Key points:**
- The model is loaded **once** at startup
- It stays in memory for the entire application lifetime
- All similarity calculations reuse the same model instance
- This is efficient - no need to reload for each request

### 3. **Game Creation** (`app/routes.py` - `/new-game` endpoint)

When a user starts a new game:

```python
@router.get("/new-game")
async def new_game():
    # Selects a random word from words.txt
    secret_word = random.choice(word_list)
    
    # Creates a game_id and stores the secret word
    games[game_id] = secret_word
    
    return {"game_id": game_id}
```

**Note:** The model is NOT used here yet - it just selects a word.

### 4. **Scoring a Guess** (`app/routes.py` - `/score` endpoint)

When a user makes a guess, this is where the model comes into play:

```python
@router.post("/score")
async def score_guess(request: ScoreRequest):
    secret_word = games[request.game_id]
    guess = request.gue ss.strip().lower()
    
    # 🎯 THIS IS WHERE THE MODEL IS USED!
    similarity = compute_similarity(guess, secret_word)
    
    score = int(similarity * 100)  # Convert 0-1 to 0-100
    
    return ScoreResponse(
        similarity=similarity,
        score=score,
        is_correct=(guess == secret_word)
    )
```

### 5. **Similarity Calculation** (`app/embedding.py` - `compute_similarity()`)

This is the core function that uses the fastText model:

```python
def compute_similarity(word1: str, word2: str) -> float:
    # Step 1: Get word vectors (300-dimensional arrays)
    vec1 = _model.get_word_vector(word1)  # e.g., "apple" → [0.23, -0.45, ..., 0.12]
    vec2 = _model.get_word_vector(word2)  # e.g., "banana" → [0.19, -0.41, ..., 0.08]
    
    # Step 2: Calculate cosine similarity
    # Formula: cos(θ) = (A · B) / (||A|| × ||B||)
    similarity = cosine_similarity(vec1, vec2)
    # Returns value between -1 and 1 (typically 0 to 1 for words)
    
    # Step 3: Normalize to 0-1 range for our game
    normalized_similarity = (similarity + 1) / 2
    
    return normalized_similarity  # Returns value between 0 and 1
```

**What fastText does:**
- Converts each word into a 300-dimensional vector (array of numbers)
- These vectors capture semantic meaning (similar words have similar vectors)
- Uses subword information, so it works even for words not in training data
- Example: "apple" and "banana" will have similar vectors (both fruits)

---

## Example Flow

Let's trace through an example game:

1. **Startup:**
   ```
   User starts backend server
   → Model loads: "Loading fastText model from .../cc.en.300.bin..."
   → Model loaded: "FastText model loaded successfully!"
   ```

2. **New Game:**
   ```
   Frontend calls: GET /new-game
   → Backend selects secret word: "apple"
   → Returns: {"game_id": "abc123"}
   ```

3. **User Guesses:**
   ```
   User guesses: "banana"
   Frontend calls: POST /score {"game_id": "abc123", "guess": "banana"}
   ```

4. **Similarity Calculation:**
   ```
   Backend calls: compute_similarity("banana", "apple")
   → Model converts "banana" to 300-dim vector
   → Model converts "apple" to 300-dim vector
   → Calculate cosine similarity: ~0.65 (both are fruits!)
   → Normalize: (0.65 + 1) / 2 = 0.825
   → Return similarity: 0.825
   ```

5. **Response:**
   ```json
   {
     "similarity": 0.825,
     "score": 82,
     "is_correct": false
   }
   ```

---

## Key Features

### 1. **Semantic Understanding**
The model understands word relationships:
- "apple" vs "banana" → High similarity (both fruits)
- "apple" vs "fruit" → High similarity (apple is a fruit)
- "apple" vs "car" → Low similarity (unrelated)

### 2. **Out-of-Vocabulary Handling**
FastText uses subword information, so it can handle:
- Words not in training data
- Misspellings (to some degree)
- Compound words

### 3. **Performance**
- Model loads once at startup (~10-30 seconds)
- Each similarity calculation is fast (~milliseconds)
- Model stays in memory (no disk I/O per request)

### 4. **Fallback Behavior**
If the model file is missing:
- Application still starts successfully
- Uses simple character-based similarity (Jaccard similarity)
- Shows warning message in console

---

## Testing the Model

You can test if the model is working by:

1. **Start the backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Look for these messages:**
   ```
   Loading fastText model from /path/to/cc.en.300.bin...
   FastText model loaded successfully!
   ```

3. **Test via API:**
   ```bash
   # Start a new game
   curl http://localhost:8000/new-game
   # Returns: {"game_id": "..."}
   
   # Make a guess
   curl -X POST http://localhost:8000/score \
     -H "Content-Type: application/json" \
     -d '{"game_id": "...", "guess": "apple"}'
   # Returns: {"similarity": 0.8, "score": 80, "is_correct": false}
   ```

---

## Configuration Options

### Default Model Path
- **Default:** `backend/cc.en.300.bin`
- **Set via environment variable:**
  ```bash
  export FASTTEXT_MODEL_PATH=/custom/path/to/model.bin
  uvicorn app.main:app --reload --port 8000
  ```

### Using a Different Model
If you want to use the Wikipedia model instead:
```bash
# Download wiki.en.bin to backend/ directory
# Then set environment variable:
export FASTTEXT_MODEL_PATH=/Users/sudeonder/Desktop/guess/backend/wiki.en.bin
uvicorn app.main:app --reload --port 8000
```

---

## Summary

✅ **Model downloaded and verified** (6.7GB file exists)  
✅ **Model loads automatically** when backend starts  
✅ **Model is used** when scoring guesses via `/score` endpoint  
✅ **Model calculates semantic similarity** between guess and secret word  
✅ **Results normalized** to 0-1 range for game scoring  

The model is now fully integrated and ready to use! 🎉
