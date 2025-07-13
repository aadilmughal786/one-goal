'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20; // pixels
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 5, y: 5 };
const INITIAL_DIRECTION = { x: 0, y: 1 }; // Start moving down
const GAME_SPEED = 150; // milliseconds

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const directionRef = useRef(INITIAL_DIRECTION);
  const snakeRef = useRef(INITIAL_SNAKE);
  const foodRef = useRef(INITIAL_FOOD);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs whenever state changes
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  const generateFood = useCallback(() => {
    let newFood: { x: number; y: number };
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  }, []); // No dependency on snake, uses snakeRef.current

  const checkCollision = useCallback(
    (head: { x: number; y: number }) => {
      const currentSnake = snakeRef.current;
      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
      }
      // Self-collision
      for (let i = 1; i < currentSnake.length; i++) {
        if (head.x === currentSnake[i].x && head.y === currentSnake[i].y) {
          return true;
        }
      }
      return false;
    },
    [] // No dependency on snake, uses snakeRef.current
  );

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const currentDirection = directionRef.current;
      const head = { x: newSnake[0].x + currentDirection.x, y: newSnake[0].y + currentDirection.y };

      if (checkCollision(head)) {
        setGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(head);

      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prevScore => prevScore + 1);
        generateFood();
      } else {
        newSnake.pop();
      }
      return newSnake;
    });
  }, [checkCollision, generateFood]); // Dependencies are now stable callbacks

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        if (directionRef.current.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (directionRef.current.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (directionRef.current.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (directionRef.current.x === 0) setDirection({ x: 1, y: 0 });
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const startGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    generateFood();

    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    gameIntervalRef.current = setInterval(moveSnake, GAME_SPEED);
  }, [generateFood, moveSnake]);

  useEffect(() => {
    if (!gameOver) {
      gameIntervalRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    }
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameOver, moveSnake]);

  // Initial game start
  useEffect(() => {
    startGame();
  }, [startGame]);

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Snake Game</h2>

      <div className="mb-4 text-lg font-medium">
        <p>
          Score: <span className="font-bold text-accent">{score}</span>
        </p>
      </div>

      <div
        className="relative mx-auto border-2 border-border-primary bg-bg-primary"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-500 border border-green-700"
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          ></div>
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        ></div>
      </div>

      {gameOver && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="mb-2 text-xl font-bold text-red-500">Game Over!</p>
          <p className="text-lg font-medium">
            Final Score: <span className="font-bold text-accent">{score}</span>
          </p>
          <button
            onClick={startGame}
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
