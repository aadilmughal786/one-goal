'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaHammer } from 'react-icons/fa';

const WhackAMole: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [moles, setMoles] = useState<boolean[]>(Array(9).fill(false));
  const [gameOver, setGameOver] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setMoles(Array(9).fill(false));

    if (timerRef.current) clearInterval(timerRef.current);
    if (moleTimerRef.current) clearInterval(moleTimerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(moleTimerRef.current!); // Clear mole timer as well
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    moleTimerRef.current = setInterval(() => {
      setMoles(() => {
        const newMoles = Array(9).fill(false);
        const randomIndex = Math.floor(Math.random() * 9);
        newMoles[randomIndex] = true;
        return newMoles;
      });
    }, 1000); // Moles appear every second
  }, []);

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [startGame]);

  const whackMole = useCallback(
    (index: number) => {
      if (moles[index] && !gameOver) {
        setScore(prevScore => prevScore + 1);
        setMoles(_prevMoles => {
          const newMoles = [..._prevMoles];
          newMoles[index] = false; // Hide the mole immediately
          return newMoles;
        });
      }
    },
    [moles, gameOver]
  );

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Whack-a-Mole</h2>

      <div className="flex justify-around mb-4 text-lg font-medium">
        <p>
          Score: <span className="font-bold text-accent">{score}</span>
        </p>
        <p>
          Time Left: <span className="font-bold text-accent">{timeLeft}s</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 w-fit mx-auto">
        {moles.map((isMoleUp, index) => (
          <div
            key={index}
            className={`w-24 h-24 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 transform
              ${isMoleUp ? 'bg-green-500 scale-105' : 'bg-bg-primary'}
              ${gameOver ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-tertiary'}`}
            onClick={() => whackMole(index)}
          >
            {isMoleUp && (
              <FaHammer
                size={40}
                className="text-white transition-transform duration-200 transform scale-100 animate-mole-pop"
              />
            )}
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
            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default WhackAMole;
