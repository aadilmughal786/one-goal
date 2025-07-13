'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

const GuessTheNumber: React.FC = () => {
  const [secretNumber, setSecretNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [messageKey, setMessageKey] = useState<number>(0); // Key for animation trigger

  const generateSecretNumber = useCallback(() => {
    setSecretNumber(Math.floor(Math.random() * 100) + 1); // Number between 1 and 100
    setGuess('');
    setMessage('Guess a number between 1 and 100.');
    setAttempts(0);
    setGameOver(false);
    setMessageKey(prev => prev + 1); // Trigger animation
  }, []);

  useEffect(() => {
    generateSecretNumber();
  }, [generateSecretNumber]);

  const handleGuessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
  }, []);

  const handleSubmitGuess = useCallback(() => {
    const userGuess = parseInt(guess);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
      setMessage('Please enter a valid number between 1 and 100.');
      setMessageKey(prev => prev + 1); // Trigger animation
      return;
    }

    setAttempts(prev => prev + 1);

    if (userGuess === secretNumber) {
      setMessage(
        `Congratulations! You guessed the number ${secretNumber} in ${attempts + 1} attempts.`
      );
      setGameOver(true);
    } else if (userGuess < secretNumber) {
      setMessage('Too low! Try again.');
    } else {
      setMessage('Too high! Try again.');
    }
    setMessageKey(prev => prev + 1); // Trigger animation
  }, [guess, secretNumber, attempts]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !gameOver) {
        handleSubmitGuess();
      }
    },
    [handleSubmitGuess, gameOver]
  );

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Guess the Number</h2>

      <div className="mb-4">
        <p
          key={messageKey} // Key change triggers re-render and animation
          className="text-lg font-medium mb-2 transition-opacity duration-500 ease-in-out animate-fade-in"
        >
          {message}
        </p>
        <input
          type="number"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300 ease-in-out"
          value={guess}
          onChange={handleGuessChange}
          onKeyPress={handleKeyPress}
          disabled={gameOver}
          placeholder="Enter your guess"
        />
      </div>

      <button
        onClick={handleSubmitGuess}
        disabled={gameOver}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-300"
      >
        <FaQuestionCircle /> {gameOver ? 'Game Over' : 'Submit Guess'}
      </button>

      {gameOver && (
        <button
          onClick={generateSecretNumber}
          className="w-full px-4 py-2 mt-4 text-white rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
        >
          Play Again
        </button>
      )}

      <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
        <p className="text-lg font-medium">
          Attempts: <span className="font-bold text-accent">{attempts}</span>
        </p>
      </div>
    </div>
  );
};

export default GuessTheNumber;
