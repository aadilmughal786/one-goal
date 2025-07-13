'use client';

import React, { useCallback, useEffect, useState } from 'react';

const SudokuGame: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(0))
  );
  const [initialBoard, setInitialBoard] = useState<number[][]>(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(0))
  );
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Helper function to check if a number can be placed in a cell
  const isValid = useCallback((b: number[][], row: number, col: number, num: number) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && b[row][x] === num) {
        return false;
      }
    }
    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && b[x][col] === num) {
        return false;
      }
    }
    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (
          (i + startRow !== row || j + startCol !== col) &&
          b[i + startRow][j + startCol] === num
        ) {
          return false;
        }
      }
    }
    return true;
  }, []);

  // Function to get all errors on the board
  const getErrors = useCallback(
    (currentBoard: number[][]) => {
      const newErrors = new Set<string>();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const num = currentBoard[r][c];
          if (num !== 0 && !isValid(currentBoard, r, c, num)) {
            newErrors.add(`${r}-${c}`);
          }
        }
      }
      return newErrors;
    },
    [isValid]
  );

  // Check if the board is complete
  const checkComplete = useCallback(
    (currentBoard: number[][]) => {
      // Check if all cells are filled
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] === 0) {
            return false;
          }
        }
      }
      // Check if there are no errors
      return getErrors(currentBoard).size === 0;
    },
    [getErrors]
  );

  // Backtracking solver
  const solveSudokuHelper = useCallback(
    (b: number[][]) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (b[r][c] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValid(b, r, c, num)) {
                b[r][c] = num;
                if (solveSudokuHelper(b)) {
                  return true;
                } else {
                  b[r][c] = 0; // Backtrack
                }
              }
            }
            return false;
          }
        }
      }
      return true;
    },
    [isValid]
  );

  // Generate a full valid Sudoku board
  const generateFullBoard = useCallback(() => {
    const newBoard = Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));

    // Fill the first row with shuffled numbers 1-9
    const firstRow = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 9; i++) {
      newBoard[0][i] = firstRow[i];
    }

    // Use backtracking to fill the rest
    function fill(b: number[][]) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (b[r][c] === 0) {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (const num of nums) {
              if (isValid(b, r, c, num)) {
                b[r][c] = num;
                if (fill(b)) {
                  return true;
                } else {
                  b[r][c] = 0;
                }
              }
            }
            return false;
          }
        }
      }
      return true;
    }

    fill(newBoard);
    return newBoard;
  }, [isValid]);

  // Remove cells to create a puzzle with unique solution
  const removeCells = useCallback(
    (fullBoard: number[][], difficulty: number) => {
      const puzzle = fullBoard.map(row => [...row]);
      let cellsToRemove = difficulty;

      while (cellsToRemove > 0) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] !== 0) {
          const backup = puzzle[row][col];
          puzzle[row][col] = 0;

          // Check if puzzle still has unique solution
          const testBoard = puzzle.map(r => [...r]);
          if (solveSudokuHelper(testBoard)) {
            cellsToRemove--;
          } else {
            puzzle[row][col] = backup; // Restore if no solution
          }
        }
      }

      return puzzle;
    },
    [solveSudokuHelper]
  );

  const generateSudoku = useCallback(
    (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
      const difficultyMap = {
        easy: 35,
        medium: 45,
        hard: 55,
      };

      const fullBoard = generateFullBoard();
      const puzzle = removeCells(fullBoard, difficultyMap[difficulty]);

      setBoard(puzzle);
      setInitialBoard(puzzle.map(row => [...row]));
      setSolution(null);
      setMessage(`New ${difficulty} puzzle generated. Fill in the missing numbers!`);
      setErrors(new Set());
      setIsComplete(false);
      setSelectedCell(null);
    },
    [generateFullBoard, removeCells]
  );

  useEffect(() => {
    generateSudoku();
  }, [generateSudoku]);

  const solveSudoku = useCallback(() => {
    const boardToSolve = board.map(row => [...row]);
    if (solveSudokuHelper(boardToSolve)) {
      setSolution(boardToSolve);
      setBoard(boardToSolve);
      setMessage('Here is the solution!');
      setErrors(new Set());
      setIsComplete(true);
    } else {
      setMessage('Cannot solve this puzzle.');
    }
  }, [board, solveSudokuHelper]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      // Only allow single digits 1-9 or empty
      if (value !== '' && !/^[1-9]$/.test(value)) {
        return;
      }

      const parsedValue = value === '' ? 0 : parseInt(value);

      const newBoard = board.map(arr => arr.slice());
      newBoard[row][col] = parsedValue;
      setBoard(newBoard);

      const newErrors = getErrors(newBoard);
      setErrors(newErrors);

      // Check if puzzle is complete
      const complete = checkComplete(newBoard);
      setIsComplete(complete);

      if (complete) {
        setMessage('Congratulations! You solved the puzzle!');
      } else if (newErrors.size === 0) {
        setMessage('Keep going! No errors so far.');
      } else {
        setMessage('');
      }
    },
    [board, getErrors, checkComplete]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (initialBoard[row][col] === 0 && !solution) {
        setSelectedCell({ row, col });
      }
    },
    [initialBoard, solution]
  );

  const clearCell = useCallback(() => {
    if (selectedCell) {
      handleCellChange(selectedCell.row, selectedCell.col, '');
    }
  }, [selectedCell, handleCellChange]);

  const getHint = useCallback(() => {
    if (solution) return;

    // Find an empty cell and fill it with the correct answer
    const boardToSolve = board.map(row => [...row]);
    if (solveSudokuHelper(boardToSolve)) {
      // Find first empty cell
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0) {
            handleCellChange(r, c, boardToSolve[r][c].toString());
            setMessage('Hint: One cell filled for you!');
            return;
          }
        }
      }
    }
  }, [board, solution, solveSudokuHelper, handleCellChange]);

  return (
    <div className="text-center card">
      <h2 className="mb-4 text-2xl font-semibold text-text-primary">Sudoku Game</h2>

      <div className="mb-4 text-lg font-medium text-text-secondary">{message}</div>

      <div className="grid grid-cols-9 gap-0 mx-auto mb-6 border-2 border-border-primary w-fit">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className={`w-10 h-10 text-center text-xl font-bold bg-bg-primary focus:outline-none focus:ring-2 focus:ring-border-accent cursor-pointer
                ${isComplete ? 'text-green-600' : cell === 0 ? '' : 'text-text-primary'}
                ${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-2 border-border-primary' : 'border-r border-border-secondary'}
                ${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-2 border-border-primary' : 'border-b border-border-secondary'}
                ${colIndex === 0 ? 'border-l border-border-secondary' : ''}
                ${rowIndex === 0 ? 'border-t border-border-secondary' : ''}
                ${initialBoard[rowIndex][colIndex] !== 0 ? 'bg-bg-tertiary font-bold text-text-accent' : ''}
                ${errors.has(`${rowIndex}-${colIndex}`) ? 'bg-red-100 border-red-500 ring-red-500 text-red-700' : ''}
                ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'ring-2 ring-border-accent' : ''}
                ${solution !== null || initialBoard[rowIndex][colIndex] !== 0 ? 'cursor-not-allowed' : 'hover:bg-bg-tertiary'}
                `}
              value={cell === 0 ? '' : cell}
              onChange={e => handleCellChange(rowIndex, colIndex, e.target.value)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              disabled={solution !== null || initialBoard[rowIndex][colIndex] !== 0}
            />
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={() => generateSudoku('easy')}
          className="px-3 py-2 text-white bg-green-500 rounded-md transition-colors duration-300 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Easy
        </button>
        <button
          onClick={() => generateSudoku('medium')}
          className="px-3 py-2 text-white bg-yellow-500 rounded-md transition-colors duration-300 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          Medium
        </button>
        <button
          onClick={() => generateSudoku('hard')}
          className="px-3 py-2 text-white bg-red-500 rounded-md transition-colors duration-300 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Hard
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => generateSudoku()}
          className="px-4 py-2 text-white rounded-md transition-colors duration-300 bg-text-accent hover:bg-text-accent/80 focus:outline-none focus:ring-2 focus:ring-border-accent"
        >
          New Game
        </button>
        <button
          onClick={solveSudoku}
          className="px-4 py-2 text-white bg-blue-500 rounded-md transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={solution !== null}
        >
          Solve
        </button>
        <button
          onClick={getHint}
          className="px-4 py-2 text-white bg-purple-500 rounded-md transition-colors duration-300 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={solution !== null}
        >
          Hint
        </button>
        <button
          onClick={clearCell}
          className="px-4 py-2 rounded-md border transition-colors duration-300 text-text-primary bg-bg-tertiary hover:bg-bg-tertiary/80 border-border-primary focus:outline-none focus:ring-2 focus:ring-border-accent"
          disabled={!selectedCell || solution !== null}
        >
          Clear
        </button>
      </div>

      {errors.size > 0 && !isComplete && (
        <div className="p-2 mt-4 text-red-700 bg-red-100 rounded-md border border-red-300">
          There are {errors.size} error{errors.size > 1 ? 's' : ''} on the board. Please check
          highlighted cells.
        </div>
      )}

      {isComplete && (
        <div className="p-2 mt-4 text-green-700 bg-green-100 rounded-md border border-green-300">
          🎉 Congratulations! You completed the puzzle! 🎉
        </div>
      )}
    </div>
  );
};

export default SudokuGame;
