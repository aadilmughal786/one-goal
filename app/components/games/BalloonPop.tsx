'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BsBalloon } from 'react-icons/bs';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;
const BALLOON_SIZE = 50;
const POP_SCORE = 10;
const GAME_DURATION = 30; // seconds

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
}

const BalloonPop: React.FC = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const colors = ['red', 'blue', 'green', 'yellow', 'purple'];

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setBalloons([]);
    setGameOver(false);

    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Game loop: move balloons
    gameIntervalRef.current = setInterval(() => {
      setBalloons(prevBalloons => {
        const newBalloons = prevBalloons.map(b => ({
          ...b,
          y: b.y - 2, // Balloons float up
        }));

        // Remove balloons that go off-screen
        return newBalloons.filter(b => b.y > -BALLOON_SIZE);
      });
    }, 20); // Update every 20ms

    // Spawn new balloons
    spawnIntervalRef.current = setInterval(() => {
      setBalloons(prevBalloons => [
        ...prevBalloons,
        {
          id: Date.now(),
          x: Math.random() * (GAME_WIDTH - BALLOON_SIZE),
          y: GAME_HEIGHT, // Start from bottom
          color: colors[Math.floor(Math.random() * colors.length)],
        },
      ]);
    }, 1000); // Spawn every 1 second

    // Game timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerIntervalRef.current!);
          clearInterval(gameIntervalRef.current!);
          clearInterval(spawnIntervalRef.current!);
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startGame();
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [startGame]);

  const handleBalloonClick = useCallback((id: number, _: string) => {
    setBalloons(prevBalloons => prevBalloons.filter(b => b.id !== id));
    setScore(prevScore => prevScore + POP_SCORE);
  }, []);

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Balloon Pop</h2>

      <div className="flex justify-around mb-4 text-lg font-medium">
        <p>
          Score: <span className="font-bold text-accent">{score}</span>
        </p>
        <p>
          Time Left: <span className="font-bold text-accent">{timeLeft}s</span>
        </p>
      </div>

      <div
        className="overflow-hidden relative mx-auto border-2 border-border-primary bg-bg-primary"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        }}
      >
        {balloons.map(balloon => (
          <div
            key={balloon.id}
            className="absolute cursor-pointer"
            style={{
              left: balloon.x,
              top: balloon.y,
              width: BALLOON_SIZE,
              height: BALLOON_SIZE,
              color: balloon.color, // Apply color to the icon
            }}
            onClick={() => handleBalloonClick(balloon.id, balloon.color)}
          >
            <BsBalloon size={BALLOON_SIZE} />
          </div>
        ))}
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

export default BalloonPop;
