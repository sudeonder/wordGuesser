const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface NewGameResponse {
  game_id: string
}

export interface ScoreResponse {
  similarity: number
  score: number
  is_correct: boolean
}

export interface ScoreRequest {
  game_id: string
  guess: string
}

/**
 * Create a new game session
 */
export async function newGame(): Promise<NewGameResponse> {
  const response = await fetch(`${API_BASE_URL}/new-game`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to create new game: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Score a guess against the secret word
 */
export async function scoreGuess(
  gameId: string,
  guess: string
): Promise<ScoreResponse> {
  const requestBody: ScoreRequest = {
    game_id: gameId,
    guess: guess,
  }

  const response = await fetch(`${API_BASE_URL}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Failed to score guess: ${response.statusText}`)
  }

  return response.json()
}
