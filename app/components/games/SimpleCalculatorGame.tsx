'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const SimpleCalculatorGame: React.FC = () => {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operator, setOperator] = useState<string>('+');
  const [answer, setAnswer] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateProblem = useCallback(() => {
    const operators = ['+', '-', '*', '/'];
    const newOperator = operators[Math.floor(Math.random() * operators.length)];
    let newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;

    // Ensure division results in whole numbers for simplicity
    if (newOperator === '/') {
      newNum1 = newNum1 * newNum2; // Make newNum1 a multiple of newNum2
    }

    setNum1(newNum1);
    setNum2(newNum2);
    setOperator(newOperator);
    setAnswer('');
    setMessage('');
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    generateProblem();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!);
          setGameOver(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [generateProblem]);

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startGame]);

  const handleSubmit = useCallback(() => {
    let correctAnswer;
    switch (operator) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '*':
        correctAnswer = num1 * num2;
        break;
      case '/':
        correctAnswer = num1 / num2;
        break;
      default:
        correctAnswer = 0;
    }

    if (parseFloat(answer) === correctAnswer) {
      setMessage('Correct!');
      setScore(prevScore => prevScore + 1);
      generateProblem();
    } else {
      setMessage('Incorrect. Try again!');
    }
  }, [num1, num2, operator, answer, generateProblem]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !gameOver) {
        handleSubmit();
      }
    },
    [handleSubmit, gameOver]
  );

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Simple Calculator Game</h2>

      <div className="flex justify-around mb-4 text-lg font-medium">
        <p>
          Score: <span className="font-bold text-accent">{score}</span>
        </p>
        <p>
          Time Left: <span className="font-bold text-accent">{timeLeft}s</span>
        </p>
      </div>

      {!gameOver ? (
        <div className="mb-6">
          <p className="mb-4 text-3xl font-bold">
            {num1} {operator} {num2} =
          </p>
          <input
            type="number"
            className="p-2 w-full text-xl text-center rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Your Answer"
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 mt-4 w-full text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Submit Answer
          </button>
          {message && <p className="mt-2 text-lg font-medium">{message}</p>}
        </div>
      ) : (
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

export default SimpleCalculatorGame;
