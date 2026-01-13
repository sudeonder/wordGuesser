'use client'

import { useState, useEffect, useMemo } from 'react'
import { newGame, scoreGuess, revealWord, getHints } from '@/lib/api'

interface Guess {
  word: string
  similarity: number
  score: number
  isCorrect: boolean
  proximityRank: number | null
  proximityInTop1500: boolean
}

interface HintItem {
  word: string
  similarity: number
  score: number
}

export default function Home() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [guess, setGuess] = useState('')
  const [guessHistory, setGuessHistory] = useState<Guess[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secretWord, setSecretWord] = useState<string | null>(null)
  const [isPeeking, setIsPeeking] = useState(false)
  const [hints, setHints] = useState<HintItem[]>([])
  const [isHintModalOpen, setIsHintModalOpen] = useState(false)
  const [isLoadingHints, setIsLoadingHints] = useState(false)

  // Sort guess history by proximity (closest first)
  const sortedGuessHistory = useMemo(() => {
    return [...guessHistory].sort((a, b) => {
      // Correct guesses always first
      if (a.isCorrect && !b.isCorrect) return -1
      if (!a.isCorrect && b.isCorrect) return 1
      
      // If both correct, maintain order
      if (a.isCorrect && b.isCorrect) return 0
      
      // Sort by proximity rank (lower rank = closer = better)
      // null ranks (not in top 1500) go to the end
      const rankA = a.proximityRank ?? Infinity
      const rankB = b.proximityRank ?? Infinity
      
      return rankA - rankB
    })
  }, [guessHistory])

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
        proximityRank: response.proximity_rank,
        proximityInTop1500: response.proximity_in_top_1500,
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

  const handleGetHints = async () => {
    if (!gameId) return
    
    setIsLoadingHints(true)
    setIsHintModalOpen(true)
    
    try {
      const response = await getHints(gameId)
      setHints(response.hints)
    } catch (err) {
      console.error('Error getting hints:', err)
      setError('Failed to load hints. Please try again.')
      setIsHintModalOpen(false)
    } finally {
      setIsLoadingHints(false)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          <h1 className="text-5xl font-extrabold text-center text-white drop-shadow-2xl relative">
            <span className="relative z-10 inline-block animate-bounce" style={{ animationDuration: '2s' }}>
              Sudo
            </span>
            <span className="relative z-10 inline-block mx-2 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse">
              Guesser
            </span>
            {/* Animated glow effect */}
            <span className="absolute inset-0 text-cyan-400 blur-xl opacity-50 animate-pulse" style={{ animationDuration: '1.5s' }}>
              Sudo Guesser
            </span>
            {/* Shimmer effect */}
            <span className="absolute inset-0 -z-10 bg-white/10 blur-2xl animate-pulse" style={{ animationDuration: '2.5s' }}></span>
          </h1>
          
          {/* Eye icon for peeking */}
          {gameId && (
            <button
              onMouseDown={handlePeekStart}
              onMouseUp={handlePeekEnd}
              onMouseLeave={handlePeekEnd}
              onTouchStart={handlePeekStart}
              onTouchEnd={handlePeekEnd}
              className="relative p-2 text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg"
              title="Click and hold to peek at the secret word"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-6 h-6 ${isPeeking ? 'text-cyan-400' : ''}`}
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
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 bg-cyan-500 text-gray-900 rounded-lg shadow-xl shadow-cyan-500/50 z-10 whitespace-nowrap text-sm font-semibold">
                  {secretWord}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-500 rotate-45"></div>
                </div>
              )}
            </button>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="guess" className="block text-sm font-medium text-gray-300 mb-2">
                Enter your guess:
              </label>
              <div className="flex gap-2">
                <input
                  id="guess"
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Type a word..."
                  className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  disabled={isLoading || !gameId}
                />
                <button
                  type="submit"
                  disabled={isLoading || !gameId || !guess.trim()}
                  className="relative px-6 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden group border-2 border-cyan-500/50 hover:border-cyan-400 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-400/50"
                >
                  <span className="relative z-10 font-semibold">
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </span>
                  {/* Animated shine effect */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                  {/* Neon glow effect */}
                  <span className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-300 blur-sm"></span>
                  {/* Pulsing border glow */}
                  <span className="absolute -inset-0.5 bg-cyan-500/50 rounded-lg opacity-0 group-hover:opacity-100 group-hover:animate-pulse blur-md transition-opacity duration-300"></span>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGetHints}
              disabled={isLoadingHints || !gameId}
              className="relative px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm hover:scale-105 active:scale-95 overflow-hidden group border-2 border-orange-500/50 hover:border-orange-400 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-400/50"
            >
              <span className="relative z-10 font-semibold">
                {isLoadingHints ? 'Loading...' : '💡 Hint'}
              </span>
              {/* Animated shine effect */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
              {/* Neon glow effect */}
              <span className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-300 blur-sm"></span>
              {/* Pulsing border glow */}
              <span className="absolute -inset-0.5 bg-orange-500/50 rounded-lg opacity-0 group-hover:opacity-100 group-hover:animate-pulse blur-md transition-opacity duration-300"></span>
            </button>
            <button
              onClick={handleNewGame}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm border border-slate-600"
            >
              New Game
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Guess History
          </h2>
          
          {guessHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No guesses yet. Make your first guess above!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Guess</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Similarity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Proximity</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGuessHistory.map((item, index) => {
                    // Determine proximity display
                    let proximityDisplay = "—"
                    let proximityColor = "text-gray-500 dark:text-gray-400"
                    let proximityBar = null
                    
                    if (item.isCorrect) {
                      proximityDisplay = "🎯 Exact Match!"
                      proximityColor = "text-green-600 dark:text-green-400 font-bold"
                    } else if (item.proximityRank !== null && item.proximityRank <= 1000) {
                      // Show rank out of 1000
                      // Rank 2 should show 999/1000, Rank 800 should show 200/1000
                      // Formula: displayRank = 1000 - proximityRank (for rank > 1)
                      // Special case: rank 1 and 2 both show 999/1000
                      let displayRank = 1000 - item.proximityRank
                      if (item.proximityRank <= 2) {
                        displayRank = 999  // Top 2 show 999/1000
                      }
                      proximityDisplay = `${displayRank} / 1000`
                      proximityColor = "text-orange-600 dark:text-orange-400"
                      
                      // Progress bar
                      const progressPercent = (displayRank / 1000) * 100
                      proximityBar = (
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )
                    } else if (item.proximityInTop1500) {
                      proximityDisplay = "Warm (1500+)"
                      proximityColor = "text-yellow-600 dark:text-yellow-400"
                    } else {
                      proximityDisplay = "Cold"
                      proximityColor = "text-blue-600 dark:text-blue-400"
                    }
                    
                    return (
                      <tr
                        key={index}
                        className={`border-b border-slate-700/50 ${
                          item.isCorrect
                            ? 'bg-emerald-900/20 hover:bg-emerald-900/30'
                            : 'hover:bg-slate-700/30'
                        } transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {item.word}
                            </span>
                            {item.isCorrect && (
                              <span className="px-2 py-1 bg-emerald-500 text-gray-900 rounded text-xs font-medium shadow-lg shadow-emerald-500/50">
                                ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300">
                            {(item.similarity * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className={`font-medium ${proximityColor}`}>
                              {proximityDisplay}
                            </span>
                            {proximityBar}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hint Modal */}
      {isHintModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                💡 Top 100 Closest Words
              </h2>
              <button
                onClick={() => setIsHintModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingHints ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading hints...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {hints.map((hint, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 border border-slate-700/30 transition-colors"
                    >
                      <span className="font-medium text-white">
                        {index + 1}. {hint.word}
                      </span>
                      <div className="flex gap-4 text-sm text-gray-300">
                        <span>Similarity: {(hint.similarity * 100).toFixed(1)}%</span>
                        <span className="font-semibold">Score: {hint.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700">
              <button
                onClick={() => setIsHintModalOpen(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funky Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">Made with</span>
              <span className="text-red-500 animate-pulse">❤️</span>
              <span className="font-mono">by</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg tracking-wide">
                Sude
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span className="font-mono">© 2026</span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 tracking-wider">
                Bilkent
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-600">
              <span className="animate-bounce">🎯</span>
              <span>Word Embeddings Game</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🚀</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
