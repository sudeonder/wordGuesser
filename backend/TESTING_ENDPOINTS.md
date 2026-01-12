# Testing the API Endpoints

## Available Endpoints

1. **GET /new-game** - Creates a new game session
2. **POST /score** - Scores a guess against the secret word
3. **GET /docs** - Interactive API documentation (Swagger UI)
4. **GET /redoc** - Alternative API documentation

---

## Method 1: Interactive API Documentation (Easiest!)

FastAPI automatically provides interactive documentation. This is the easiest way to test:

1. **Start the server:**
   ```bash
   cd /Users/sudeonder/Desktop/guess/backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Open your browser and go to:**
   ```
   http://localhost:8000/docs
   ```
   
3. **You'll see a Swagger UI interface where you can:**
   - Click on each endpoint to expand it
   - Click "Try it out" button
   - Fill in the parameters
   - Click "Execute" to test
   - See the response directly in the browser

---

## Method 2: Using cURL (Command Line)

### Step 1: Start a New Game

```bash
curl http://localhost:8000/new-game
```

**Expected Response:**
```json
{
  "game_id": "abc123xyz..."
}
```

**Save the game_id for the next step!**

### Step 2: Make a Guess

Replace `YOUR_GAME_ID` with the game_id from Step 1:

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{"game_id": "YOUR_GAME_ID", "guess": "apple"}'
```

**Expected Response:**
```json
{
  "similarity": 0.85,
  "score": 85,
  "is_correct": false
}
```

### Complete Example (Copy-paste ready)

```bash
# Step 1: Start new game and save game_id
GAME_ID=$(curl -s http://localhost:8000/new-game | grep -o '"game_id":"[^"]*' | cut -d'"' -f4)
echo "Game ID: $GAME_ID"

# Step 2: Make a guess
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d "{\"game_id\": \"$GAME_ID\", \"guess\": \"banana\"}"

# Step 3: Try another guess
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d "{\"game_id\": \"$GAME_ID\", \"guess\": \"apple\"}"
```

---

## Method 3: Using Python requests

Create a test script `test_api.py`:

```python
import requests

BASE_URL = "http://localhost:8000"

# Step 1: Start a new game
print("Starting new game...")
response = requests.get(f"{BASE_URL}/new-game")
response.raise_for_status()
data = response.json()
game_id = data["game_id"]
print(f"Game ID: {game_id}\n")

# Step 2: Make some guesses
guesses = ["apple", "banana", "fruit", "car"]

for guess in guesses:
    print(f"Guessing: {guess}")
    response = requests.post(
        f"{BASE_URL}/score",
        json={"game_id": game_id, "guess": guess}
    )
    response.raise_for_status()
    result = response.json()
    print(f"  Similarity: {result['similarity']:.3f}")
    print(f"  Score: {result['score']}")
    print(f"  Correct: {result['is_correct']}\n")
```

Run it:
```bash
pip install requests  # if not already installed
python test_api.py
```

---

## Method 4: Using httpie (Cleaner syntax)

If you have `httpie` installed:

```bash
# Install httpie (optional)
pip install httpie

# Start new game
http GET http://localhost:8000/new-game

# Make a guess
http POST http://localhost:8000/score game_id="YOUR_GAME_ID" guess="apple"
```

---

## Testing Scenarios

### Test 1: Basic Flow
1. Create a new game → Get `game_id`
2. Make a guess → Get similarity score
3. Make multiple guesses with the same `game_id`

### Test 2: Exact Match
```bash
# Create game and make multiple guesses until you find the word
# When is_correct is true, you've won!
```

### Test 3: Similar Words
```bash
# Test how fastText calculates similarity
# Try: "apple" vs "fruit" (should be high similarity)
# Try: "apple" vs "car" (should be low similarity)
```

### Test 4: Invalid Game ID
```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{"game_id": "invalid", "guess": "apple"}'
```
**Expected:** 404 error with "Game not found"

---

## Expected Behavior

### GET /new-game
- **Response:** `{"game_id": "string"}`
- **Status:** 200 OK
- **Behavior:** Creates a new game session with a random word from `words.txt`

### POST /score
- **Request Body:**
  ```json
  {
    "game_id": "string",
    "guess": "string"
  }
  ```
- **Response:**
  ```json
  {
    "similarity": 0.85,
    "score": 85,
    "is_correct": false
  }
  ```
- **Fields:**
  - `similarity`: Float between 0 and 1 (cosine similarity from fastText)
  - `score`: Integer between 0 and 100 (similarity * 100)
  - `is_correct`: Boolean (true if exact match)
- **Status:** 200 OK (success) or 404 (game not found)

---

## Verifying fastText is Working

1. **Check server startup logs:**
   ```
   Loading fastText model from .../cc.en.300.bin...
   FastText model loaded successfully!
   ```
   If you see this, fastText is loaded!

2. **Test semantic similarity:**
   - Guess words related to the secret word should have higher scores
   - Example: If secret is "apple", "fruit" should score higher than "car"

3. **Compare with fallback:**
   - With fastText: Similar words get meaningful similarity scores
   - Without fastText: Only character overlap is used (less accurate)

---

## Troubleshooting

### Server won't start
- Make sure you're in the backend directory
- Ensure virtual environment is activated
- Check that port 8000 is not already in use

### "Game not found" error
- Make sure you're using the correct `game_id` from `/new-game`
- Game IDs expire when the server restarts (games are in-memory)

### Model loading issues
- Check that `cc.en.300.bin` exists in the backend directory
- Look for warning messages in the server logs
- The app will still work with fallback similarity if model is missing

### CORS errors (when testing from browser console)
- Make sure the frontend runs on `http://localhost:3000`
- CORS is configured to allow requests from that origin

---

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] `/docs` page loads in browser
- [ ] Can create new game (GET /new-game)
- [ ] Can score a guess (POST /score)
- [ ] Similar words get higher scores than unrelated words
- [ ] Exact match returns `is_correct: true`
- [ ] Invalid game_id returns 404 error
- [ ] fastText model loads successfully (check startup logs)

---

## Next Steps

Once endpoints are tested and working:
1. Test the frontend integration
2. Test the full game flow
3. Verify fastText similarity calculations are meaningful
4. Test edge cases (empty strings, very long words, etc.)
