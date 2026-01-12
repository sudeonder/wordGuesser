from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import secrets
from app.embedding import compute_similarity

router = APIRouter()

# In-memory game storage: { game_id: secret_word }
games = {}


class ScoreRequest(BaseModel):
    game_id: str
    guess: str


class ScoreResponse(BaseModel):
    similarity: float
    score: int
    is_correct: bool


@router.get("/new-game")
async def new_game():
    """
    Create a new game session.
    Returns a game_id that should be used for subsequent guesses.
    """
    # Load word list from words.txt
    import random
    import os
    
    words_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "words.txt")
    
    try:
        with open(words_file, "r") as f:
            word_list = [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        # Fallback to a small word list if words.txt is not found
        word_list = [
            "apple", "banana", "cherry", "dragon", "elephant", "forest", "garden",
            "hammer", "island", "jungle", "knight", "lighthouse", "mountain",
            "ocean", "palace", "quasar", "river", "sunset", "temple", "universe"
        ]
    
    # Randomly select a secret word
    secret_word = random.choice(word_list)
    
    # Generate a unique game_id
    game_id = secrets.token_urlsafe(16)
    
    # Store game in memory
    games[game_id] = secret_word
    
    return {"game_id": game_id}


@router.post("/score", response_model=ScoreResponse)
async def score_guess(request: ScoreRequest):
    """
    Score a guess against the secret word for the given game_id.
    Returns similarity score, numerical score, and whether the guess is correct.
    """
    # Validate game_id exists
    if request.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    secret_word = games[request.game_id]
    guess = request.guess.strip().lower()
    
    # Check if guess is correct (exact match)
    is_correct = guess == secret_word.lower()
    
    # TODO: Use actual word embeddings to compute similarity
    # For now, using placeholder similarity computation
    similarity = compute_similarity(guess, secret_word)
    
    # Convert similarity (0-1) to score (0-100)
    score = int(similarity * 100)
    
    return ScoreResponse(
        similarity=similarity,
        score=score,
        is_correct=is_correct
    )
