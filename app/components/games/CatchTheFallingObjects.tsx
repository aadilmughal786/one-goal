'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaAppleAlt } from 'react-icons/fa';
import { FaBomb, FaStar } from 'react-icons/fa6';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;
const CHARACTER_SIZE = 40;
const OBJECT_SIZE = 30;
const FALL_SPEED = 5;
const SPAWN_INTERVAL = 1000; // ms

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'good' | 'bad';
}

const CatchTheFallingObjects: React.FC = () => {
  const [characterX, setCharacterX] = useState(GAME_WIDTH / 2 - CHARACTER_SIZE / 2);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const characterXRef = useRef(characterX);

  // Keep characterXRef updated
  useEffect(() => {
    characterXRef.current = characterX;
  }, [characterX]);

  const startGame = useCallback(() => {
    setCharacterX(GAME_WIDTH / 2 - CHARACTER_SIZE / 2);
    setObjects([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);

    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);

    gameIntervalRef.current = setInterval(() => {
      setObjects(prevObjects => {
        const newObjects = prevObjects.map(obj => ({
          ...obj,
          y: obj.y + FALL_SPEED,
        }));

        // Check for collisions and out-of-bounds objects
        return newObjects.filter(obj => {
          // Check if object is caught - use ref for current position
          const currentCharacterX = characterXRef.current;
          if (
            obj.y + OBJECT_SIZE >= GAME_HEIGHT - CHARACTER_SIZE &&
            obj.y + OBJECT_SIZE <= GAME_HEIGHT &&
            obj.x + OBJECT_SIZE >= currentCharacterX &&
            obj.x <= currentCharacterX + CHARACTER_SIZE
          ) {
            if (obj.type === 'good') {
              setScore(prevScore => prevScore + 1);
            } else {
              setGameOver(true);
            }
            return false; // Remove caught object
          }
          // Check if object went out of bounds (missed)
          if (obj.y > GAME_HEIGHT) {
            if (obj.type === 'good') {
              setGameOver(true); // Missed good object
            }
            return false; // Remove missed object
          }
          return true; // Keep object
        });
      });
    }, 20); // Game update speed

    spawnIntervalRef.current = setInterval(() => {
      setObjects(prevObjects => [
        ...prevObjects,
        {
          id: Date.now(),
          x: Math.floor(Math.random() * (GAME_WIDTH - OBJECT_SIZE)),
          y: 0,
          type: Math.random() < 0.8 ? 'good' : 'bad', // 80% good, 20% bad
        },
      ]);
    }, SPAWN_INTERVAL);
  }, []); // Remove characterX dependency

  useEffect(() => {
    if (gameStarted && !gameOver) {
      startGame();
    }
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [startGame, gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver) {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);

      // Update high score
      if (score > highScore) {
        setHighScore(score);
      }
    }
  }, [gameOver, score, highScore]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver || !gameStarted) return;
      if (e.key === 'ArrowLeft') {
        setCharacterX(prevX => Math.max(0, prevX - 20));
      } else if (e.key === 'ArrowRight') {
        setCharacterX(prevX => Math.min(GAME_WIDTH - CHARACTER_SIZE, prevX + 20));
      }
    },
    [gameOver, gameStarted]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (gameOver || !gameStarted) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newX = Math.max(0, Math.min(GAME_WIDTH - CHARACTER_SIZE, mouseX - CHARACTER_SIZE / 2));
      setCharacterX(newX);
    },
    [gameOver, gameStarted]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (gameOver || !gameStarted) return;

      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const newX = Math.max(0, Math.min(GAME_WIDTH - CHARACTER_SIZE, touchX - CHARACTER_SIZE / 2));
      setCharacterX(newX);
    },
    [gameOver, gameStarted]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getObjectIcon = (type: 'good' | 'bad') => {
    if (type === 'good') return <FaAppleAlt className="text-green-500" size={OBJECT_SIZE} />;
    return <FaBomb className="text-red-500" size={OBJECT_SIZE} />;
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setObjects([]);
    setScore(0);
    setCharacterX(GAME_WIDTH / 2 - CHARACTER_SIZE / 2);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
  };

  return (
    <div className="text-center card">
      <h2 className="mb-4 text-2xl font-semibold text-text-primary">Catch the Falling Objects</h2>

      <div className="flex justify-around mb-4 text-lg font-medium">
        <p className="text-text-secondary">
          Score: <span className="font-bold text-text-accent">{score}</span>
        </p>
        <p className="text-text-secondary">
          High Score: <span className="font-bold text-text-accent">{highScore}</span>
        </p>
      </div>

      <div
        className="overflow-hidden relative mx-auto border-2 border-border-primary bg-bg-primary cursor-none"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Character */}
        <div
          className="flex absolute justify-center items-center rounded-full transition-all duration-75 bg-text-accent"
          style={{
            left: characterX,
            top: GAME_HEIGHT - CHARACTER_SIZE,
            width: CHARACTER_SIZE,
            height: CHARACTER_SIZE,
          }}
        >
          <FaStar className="text-white" size={CHARACTER_SIZE * 0.6} fill="currentColor" />
        </div>

        {/* Falling Objects */}
        {objects.map(obj => (
          <div
            key={obj.id}
            className="absolute"
            style={{
              left: obj.x,
              top: obj.y,
              width: OBJECT_SIZE,
              height: OBJECT_SIZE,
            }}
          >
            {getObjectIcon(obj.type)}
          </div>
        ))}

        {/* Game Start Overlay */}
        {!gameStarted && !gameOver && (
          <div className="flex absolute inset-0 flex-col justify-center items-center backdrop-blur-sm bg-white/90">
            <div className="text-center">
              <h3 className="mb-2 text-xl font-bold text-gray-800">Ready to Play?</h3>
              <p className="mb-4 text-gray-600">Catch the apples, avoid the bombs!</p>
              <p className="mb-6 text-sm text-gray-500">Use arrow keys or mouse/touch to move</p>
              <button
                onClick={startGame}
                className="px-6 py-3 text-white bg-blue-600 rounded-md transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>

      {gameOver && (
        <div className="p-4 mt-6 bg-gray-50 rounded-md border border-gray-300">
          <p className="mb-2 text-xl font-bold text-red-500">Game Over!</p>
          <p className="text-lg font-medium text-gray-600">
            Final Score: <span className="font-bold text-blue-600">{score}</span>
          </p>
          {score === highScore && score > 0 && (
            <p className="mt-1 font-medium text-green-500">🎉 New High Score! 🎉</p>
          )}
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={startGame}
              className="px-4 py-2 text-white bg-blue-600 rounded-md transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Play Again
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md border border-gray-300 transition-colors duration-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Use ← → arrow keys or mouse/touch to move</p>
        <p>Catch 🍎 apples for points • Avoid 💣 bombs • Don&apos;t miss apples!</p>
      </div>
    </div>
  );
};

export default CatchTheFallingObjects;
