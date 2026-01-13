from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import secrets
from app.embedding import compute_similarity, get_model
import random
import os

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
    proximity_rank: int | None  # Rank in corpus (None if not in corpus or > 1500)
    proximity_in_top_1500: bool  # True if in top 1500 closest words


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
    Returns similarity score, numerical score, proximity rank, and whether the guess is correct.
    """
    # Validate game_id exists
    if request.game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    secret_word = games[request.game_id]
    guess = request.guess.strip().lower()
    
    # Check if guess is correct (exact match)
    is_correct = guess == secret_word.lower()
    
    # Compute similarity
    similarity = compute_similarity(guess, secret_word)
    
    # Convert similarity (0-1) to score (0-100)
    score = int(similarity * 100)
    
    # Calculate proximity rank by comparing with all words in corpus
    proximity_rank = None
    proximity_in_top_1500 = False
    
    # Load word list from words.txt
    words_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "words.txt")
    
    try:
        with open(words_file, "r") as f:
            word_list = [line.strip().lower() for line in f if line.strip()]
        
        # Calculate similarity for all words and find rank of guess
        word_similarities = []
        for word in word_list:
            # Skip the secret word itself
            if word.lower() == secret_word.lower():
                continue
            
            word_sim = compute_similarity(word, secret_word)
            word_similarities.append((word, word_sim))
        
        # Sort by similarity (highest first)
        word_similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Find the rank of the guess word
        for rank, (word, sim) in enumerate(word_similarities, start=1):
            if word.lower() == guess.lower():
                proximity_rank = rank
                proximity_in_top_1500 = rank <= 1500
                break
        
    except FileNotFoundError:
        # If words.txt not found, can't calculate proximity
        pass
    
    return ScoreResponse(
        similarity=similarity,
        score=score,
        is_correct=is_correct,
        proximity_rank=proximity_rank,
        proximity_in_top_1500=proximity_in_top_1500
    )


@router.get("/reveal/{game_id}")
async def reveal_word(game_id: str):
    """
    Reveal the secret word for a given game_id.
    This endpoint allows users to peek at the answer (e.g., when holding an eye icon).
    """
    # Validate game_id exists
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    secret_word = games[game_id]
    
    return {"secret_word": secret_word}

# define request/response models for hint endpoint
class HintItem(BaseModel):
    word: str
    similarity: float
    score: int

class HintResponse(BaseModel):
    hints: list[HintItem]

@router.get("/hint/{game_id}")
async def get_hints(game_id: str):
    """
    Get the top 100 closest words to secret word with their similarities.
    Only searches within the curated word corpus (words.txt) to ensure
    hints are from the same vocabulary as possible secret words.
    """
    # validate game_id exists
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")

    secret_word = games[game_id]
    
    # Load word list from words.txt (same corpus used for secret words)
    words_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "words.txt")
    
    try:
        with open(words_file, "r") as f:
            word_list = [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Word corpus file (words.txt) not found"
        )
    
    # Get the fastText model
    model = get_model()
    
    if model is None:
        raise HTTPException(
            status_code=503, 
            detail="FastText model not loaded. Please ensure the model file is available."
        )
    
    try:
        # Calculate similarity for each word in the corpus
        hints = []
        for word in word_list:
            # Skip the secret word itself
            if word.lower() == secret_word.lower():
                continue
            
            # Compute similarity using our embedding function
            similarity = compute_similarity(word, secret_word)
            score = int(similarity * 100)
            
            hints.append(HintItem(
                word=word,
                similarity=similarity,
                score=score
            ))
        
        # Sort by similarity (highest first) and take top 100
        hints.sort(key=lambda x: x.similarity, reverse=True)
        top_hints = hints[:100]
        
        return HintResponse(hints=top_hints)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing hints: {str(e)}"
        )

