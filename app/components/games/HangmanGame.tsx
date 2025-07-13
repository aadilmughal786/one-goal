'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaRedo } from 'react-icons/fa';

const wordList = [
  'JAVASCRIPT',
  'REACT',
  'PYTHON',
  'DEVELOPER',
  'PROGRAMMING',
  'COMPUTER',
  'ALGORITHM',
  'DATABASE',
  'FRAMEWORK',
  'COMPONENT',
];

const HangmanGame: React.FC = () => {
  const [wordToGuess, setWordToGuess] = useState<string>('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [incorrectGuesses, setIncorrectGuesses] = useState<number>(0);
  const maxIncorrectGuesses = 6;

  const initializeGame = useCallback(() => {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setWordToGuess(randomWord);
    setGuessedLetters(new Set());
    setIncorrectGuesses(0);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const displayWord = useMemo(() => {
    return wordToGuess
      .split('')
      .map(letter => (guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  }, [wordToGuess, guessedLetters]);

  const isWinner = useMemo(() => {
    return wordToGuess.split('').every(letter => guessedLetters.has(letter));
  }, [wordToGuess, guessedLetters]);

  const isLoser = useMemo(() => {
    return incorrectGuesses >= maxIncorrectGuesses;
  }, [incorrectGuesses, maxIncorrectGuesses]);

  const handleGuess = useCallback(
    (letter: string) => {
      const upperCaseLetter = letter.toUpperCase();
      if (guessedLetters.has(upperCaseLetter) || isWinner || isLoser) {
        return;
      }

      const newGuessedLetters = new Set(guessedLetters);
      newGuessedLetters.add(upperCaseLetter);
      setGuessedLetters(newGuessedLetters);

      if (!wordToGuess.includes(upperCaseLetter)) {
        setIncorrectGuesses(prev => prev + 1);
      }
    },
    [guessedLetters, wordToGuess, isWinner, isLoser]
  );

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (isWinner || isLoser) return;
      const letter = e.key.toUpperCase();
      if (letter.match(/^[A-Z]$/)) {
        handleGuess(letter);
      }
    },
    [handleGuess, isWinner, isLoser]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const renderHangmanDrawing = () => {
    const parts = [
      <div
        key="gallows"
        className="absolute top-0 left-0 w-full h-full border-b-2 border-l-2 border-text-primary"
      ></div>,
      <div
        key="head"
        className="absolute top-[20px] left-[calc(50%-15px)] w-[30px] h-[30px] rounded-full border-2 border-text-primary"
      ></div>,
      <div
        key="body"
        className="absolute top-[50px] left-[calc(50%-1px)] w-[2px] h-[50px] bg-text-primary"
      ></div>,
      <div
        key="arm-left"
        className="absolute top-[60px] left-[calc(50%-25px)] w-[25px] h-[2px] bg-text-primary origin-right -rotate-45"
      ></div>,
      <div
        key="arm-right"
        className="absolute top-[60px] left-[calc(50%+1px)] w-[25px] h-[2px] bg-text-primary origin-left rotate-45"
      ></div>,
      <div
        key="leg-left"
        className="absolute top-[100px] left-[calc(50%-25px)] w-[25px] h-[2px] bg-text-primary origin-right rotate-45"
      ></div>,
      <div
        key="leg-right"
        className="absolute top-[100px] left-[calc(50%+1px)] w-[25px] h-[2px] bg-text-primary origin-left -rotate-45"
      ></div>,
    ];
    return (
      <div className="relative w-[150px] h-[150px] mx-auto mb-6">
        {parts.slice(0, incorrectGuesses)}
      </div>
    );
  };

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Hangman Game</h2>

      {renderHangmanDrawing()}

      <p className="mb-6 text-3xl font-bold tracking-widest">{displayWord}</p>

      {isWinner && <p className="mb-4 text-xl font-semibold text-green-500">You won!</p>}
      {isLoser && (
        <p className="mb-4 text-xl font-semibold text-red-500">
          You lost! The word was: <span className="font-bold">{wordToGuess}</span>
        </p>
      )}

      {!isWinner && !isLoser && (
        <div className="grid grid-cols-7 gap-2 mb-6">
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={guessedLetters.has(letter) || isWinner || isLoser}
              className={`p-2 rounded-md text-lg font-semibold transition-colors
                ${
                  guessedLetters.has(letter)
                    ? wordToGuess.includes(letter)
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-accent text-white hover:bg-accent-dark'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {(isWinner || isLoser) && (
        <button
          onClick={initializeGame}
          className="flex gap-2 justify-center items-center px-4 py-2 w-full text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaRedo /> Play Again
        </button>
      )}
    </div>
  );
};

export default HangmanGame;
