'use client'

import { useState, useEffect } from 'react'
import { newGame, scoreGuess, revealWord } from '@/lib/api'

interface Guess {
  word: string
  similarity: number
  score: number
  isCorrect: boolean
}

export default function Home() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [guess, setGuess] = useState('')
  const [guessHistory, setGuessHistory] = useState<Guess[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secretWord, setSecretWord] = useState<string | null>(null)
  const [isPeeking, setIsPeeking] = useState(false)

  // Initialize game on page load
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Check if game_id exists in localStorage
        const storedGameId = localStorage.getItem('game_id')
        
        if (storedGameId) {
          setGameId(storedGameId)
        } else {
          // Create new game
          const response = await newGame()
          setGameId(response.game_id)
          localStorage.setItem('game_id', response.game_id)
        }
      } catch (err) {
        setError('Failed to initialize game. Please refresh the page.')
        console.error('Error initializing game:', err)
      }
    }

    initializeGame()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gameId || !guess.trim()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await scoreGuess(gameId, guess.trim())
      
      const newGuess: Guess = {
        word: guess.trim(),
        similarity: response.similarity,
        score: response.score,
        isCorrect: response.is_correct,
      }

      setGuessHistory([newGuess, ...guessHistory])
      setGuess('')

      if (response.is_correct) {
        // Game won! Could show a success message or reset
        alert('Congratulations! You guessed the word correctly!')
      }
    } catch (err) {
      setError('Failed to score guess. Please try again.')
      console.error('Error scoring guess:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewGame = async () => {
    try {
      const response = await newGame()
      setGameId(response.game_id)
      localStorage.setItem('game_id', response.game_id)
      setGuessHistory([])
      setGuess('')
      setError(null)
      setSecretWord(null)
      setIsPeeking(false)
    } catch (err) {
      setError('Failed to create new game. Please try again.')
      console.error('Error creating new game:', err)
    }
  }

  const handlePeekStart = async () => {
    if (!gameId) return
    
    setIsPeeking(true)
    
    // Fetch the secret word when user starts holding
    try {
      const response = await revealWord(gameId)
      setSecretWord(response.secret_word)
    } catch (err) {
      console.error('Error revealing word:', err)
      setIsPeeking(false)
      // If game not found, it might have expired (server restart)
      // Don't show error to user, just silently fail
    }
  }

  const handlePeekEnd = () => {
    setIsPeeking(false)
    setSecretWord(null)
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">
            Word Guessing Game
          </h1>
          
          {/* Eye icon for peeking */}
          {gameId && (
            <button
              onMouseDown={handlePeekStart}
              onMouseUp={handlePeekEnd}
              onMouseLeave={handlePeekEnd}
              onTouchStart={handlePeekStart}
              onTouchEnd={handlePeekEnd}
              className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
              title="Click and hold to peek at the secret word"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-6 h-6 ${isPeeking ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              
              {/* Secret word display when peeking */}
              {isPeeking && secretWord && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg z-10 whitespace-nowrap text-sm font-semibold">
                  {secretWord}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                </div>
              )}
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="guess" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your guess:
              </label>
              <div className="flex gap-2">
                <input
                  id="guess"
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Type a word..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isLoading || !gameId}
                />
                <button
                  type="submit"
                  disabled={isLoading || !gameId || !guess.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>

          <button
            onClick={handleNewGame}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            New Game
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Guess History
          </h2>
          
          {guessHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No guesses yet. Make your first guess above!
            </p>
          ) : (
            <div className="space-y-3">
              {guessHistory.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    item.isCorrect
                      ? 'bg-green-50 dark:bg-green-900 border-green-400 dark:border-green-600'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {item.word}
                    </span>
                    {item.isCorrect && (
                      <span className="px-2 py-1 bg-green-500 text-white rounded text-sm font-medium">
                        Correct!
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>Similarity: {(item.similarity * 100).toFixed(1)}%</span>
                    <span>Score: {item.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
