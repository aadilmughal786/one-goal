'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { FaRegCircle, FaTimes } from 'react-icons/fa';

type Player = 'X' | 'O' | null;

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player>(null);

  const calculateWinner = useCallback((squares: Player[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }, []);

  const handleClick = useCallback(
    (i: number) => {
      if (winner || board[i]) {
        return;
      }
      const newBoard = [...board];
      newBoard[i] = xIsNext ? 'X' : 'O';
      setBoard(newBoard);
      setXIsNext(!xIsNext);
      setWinner(calculateWinner(newBoard));
    },
    [board, xIsNext, winner, calculateWinner]
  );

  const renderSquare = useCallback(
    (i: number) => (
      <button
        key={i} // Added unique key prop
        className="flex justify-center items-center w-28 h-28 text-6xl font-bold border transition-colors duration-200 border-border-primary bg-bg-primary hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
        onClick={() => handleClick(i)}
      >
        {board[i] === 'X' && <FaTimes className="text-red-500 animate-pop-in" />}
        {board[i] === 'O' && <FaRegCircle className="text-blue-500 animate-pop-in" />}
      </button>
    ),
    [board, handleClick]
  );

  const status = useMemo(() => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (board.every(Boolean)) {
      return "It's a draw!";
    } else {
      return `Next player: ${xIsNext ? 'X' : 'O'}`;
    }
  }, [winner, xIsNext, board]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  }, []);

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Tic-Tac-Toe</h2>

      <div className="mb-4 text-xl font-medium transition-opacity duration-300 ease-in-out animate-fade-in">
        {status}
      </div>

      <div className="grid grid-cols-3 gap-2 mx-auto mb-6 w-fit">
        {Array(9)
          .fill(null)
          .map((_, i) => renderSquare(i))}
      </div>

      {(winner || board.every(Boolean)) && (
        <button
          onClick={resetGame}
          className="px-4 py-2 w-full text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default TicTacToe;
