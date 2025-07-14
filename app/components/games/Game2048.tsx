'use client';

import React, { useCallback, useEffect, useState } from 'react';

const TILE_SIZE = 100;
const GRID_SIZE = 4;

interface Tile {
  x: number;
  y: number;
  value: number;
  id: number;
}

const generateInitialTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  let idCounter = 0;

  const addRandomTile = (currentTiles: Tile[]) => {
    const availablePositions: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!currentTiles.some(tile => tile.x === x && tile.y === y)) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length > 0) {
      const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const newValue = Math.random() < 0.9 ? 2 : 4;
      currentTiles.push({ ...randomPos, value: newValue, id: idCounter++ });
    }
  };

  addRandomTile(tiles);
  addRandomTile(tiles);
  return tiles;
};

const Game2048: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>(() => generateInitialTiles());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const checkGameOver = useCallback((currentTiles: Tile[]) => {
    // Check for empty cells
    if (currentTiles.length < GRID_SIZE * GRID_SIZE) return false;

    // Check for possible merges
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const currentTile = currentTiles.find(tile => tile.x === x && tile.y === y);
        if (!currentTile) continue;

        const neighbors = [
          currentTiles.find(tile => tile.x === x + 1 && tile.y === y),
          currentTiles.find(tile => tile.x === x - 1 && tile.y === y),
          currentTiles.find(tile => tile.x === x && tile.y === y + 1),
          currentTiles.find(tile => tile.x === x && tile.y === y - 1),
        ];

        if (neighbors.some(neighbor => neighbor && neighbor.value === currentTile.value)) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const addRandomTile = useCallback((currentTiles: Tile[]) => {
    const availablePositions: { x: number; y: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!currentTiles.some(tile => tile.x === x && tile.y === y)) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length > 0) {
      const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const newValue = Math.random() < 0.9 ? 2 : 4;
      setTiles(prevTiles => [...prevTiles, { ...randomPos, value: newValue, id: Date.now() }]);
      return true;
    }
    return false;
  }, []);

  const slideTiles = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver) return;

      let newTiles: Tile[] = JSON.parse(JSON.stringify(tiles)); // Deep copy
      let moved = false;
      let newScore = score;

      const getTile = (x: number, y: number) =>
        newTiles.find((tile: Tile) => tile.x === x && tile.y === y);
      const removeTile = (id: number) =>
        (newTiles = newTiles.filter((tile: Tile) => tile.id !== id));

      const mergeTiles = (tile1: Tile, tile2: Tile) => {
        tile1.value *= 2;
        newScore += tile1.value;
        removeTile(tile2.id);
        moved = true;
      };

      const slideRow = (row: (Tile | undefined)[]) => {
        const filteredRow = row.filter((tile): tile is Tile => tile !== undefined);
        for (let i = 0; i < filteredRow.length - 1; i++) {
          if (filteredRow[i].value === filteredRow[i + 1].value) {
            mergeTiles(filteredRow[i], filteredRow[i + 1]);
            filteredRow.splice(i + 1, 1); // Remove merged tile
          }
        }
        return filteredRow;
      };

      for (let i = 0; i < GRID_SIZE; i++) {
        const line: (Tile | undefined)[] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
          if (direction === 'up') line.push(getTile(i, j));
          else if (direction === 'down') line.push(getTile(i, GRID_SIZE - 1 - j));
          else if (direction === 'left') line.push(getTile(j, i));
          else if (direction === 'right') line.push(getTile(GRID_SIZE - 1 - j, i));
        }

        const mergedLine = slideRow(line);

        // Update positions
        for (let j = 0; j < mergedLine.length; j++) {
          const tile = mergedLine[j];
          let newX = tile.x;
          let newY = tile.y;
          if (direction === 'up') newY = j;
          else if (direction === 'down') newY = GRID_SIZE - 1 - j;
          else if (direction === 'left') newX = j;
          else if (direction === 'right') newX = GRID_SIZE - 1 - j;

          if (tile.x !== newX || tile.y !== newY) moved = true;
          tile.x = newX;
          tile.y = newY;
        }

        // Fill empty spaces
        for (let j = mergedLine.length; j < GRID_SIZE; j++) {
          let newX = 0,
            newY = 0;
          if (direction === 'up') newY = j;
          else if (direction === 'down') newY = GRID_SIZE - 1 - j;
          else if (direction === 'left') newX = j;
          else if (direction === 'right') newX = GRID_SIZE - 1 - j;

          // Add placeholder for empty cells to maintain grid structure during processing
          // These placeholders will be filtered out later
          newTiles.push({ x: newX, y: newY, value: 0, id: Date.now() + j });
        }
      }

      setScore(newScore);
      setTiles(newTiles.filter((tile: Tile) => tile.value !== 0)); // Filter out placeholders

      if (moved) {
        addRandomTile(newTiles.filter((tile: Tile) => tile.value !== 0));
      }

      if (checkGameOver(newTiles.filter((tile: Tile) => tile.value !== 0))) {
        setGameOver(true);
      }
    },
    [tiles, score, gameOver, addRandomTile, checkGameOver]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowUp':
          slideTiles('up');
          break;
        case 'ArrowDown':
          slideTiles('down');
          break;
        case 'ArrowLeft':
          slideTiles('left');
          break;
        case 'ArrowRight':
          slideTiles('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slideTiles, gameOver]);

  const resetGame = useCallback(() => {
    setTiles(generateInitialTiles());
    setScore(0);
    setGameOver(false);
  }, []);

  const getTileColor = (value: number) => {
    switch (value) {
      case 0:
        return 'bg-bg-tertiary'; // Empty cell background
      case 2:
        return 'bg-bg-primary';
      case 4:
        return 'bg-bg-secondary';
      case 8:
        return 'bg-yellow-300';
      case 16:
        return 'bg-orange-400';
      case 32:
        return 'bg-red-500';
      case 64:
        return 'bg-purple-600';
      case 128:
        return 'bg-blue-700';
      case 256:
        return 'bg-green-700';
      case 512:
        return 'bg-indigo-700';
      case 1024:
        return 'bg-pink-700';
      case 2048:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300'; // Fallback
    }
  };

  const getTileTextColor = (value: number) => {
    if (value === 2 || value === 4 || value === 8) {
      return 'text-text-primary';
    } else if (value === 2048) {
      return 'text-black';
    } else {
      return 'text-white';
    }
  };

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">2048</h2>

      <div className="mb-4 text-lg font-medium">
        <p>
          Score: <span className="font-bold text-accent">{score}</span>
        </p>
      </div>

      <div
        className="grid gap-2 p-2 mx-auto rounded-lg bg-bg-tertiary"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
          width: GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * 8 + 16, // grid gap + padding
          height: GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * 8 + 16,
        }}
      >
        {Array(GRID_SIZE * GRID_SIZE)
          .fill(null)
          .map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const tile = tiles.find(t => t.x === x && t.y === y);
            return (
              <div
                key={index}
                className={`flex items-center justify-center rounded-lg text-3xl font-bold ${getTileTextColor(tile?.value || 0)} ${getTileColor(tile?.value || 0)}`}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              >
                {tile?.value || ''}
              </div>
            );
          })}
      </div>

      {gameOver && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="mb-2 text-xl font-bold text-red-500">Game Over!</p>
          <p className="text-lg font-medium">
            Final Score: <span className="font-bold text-accent">{score}</span>
          </p>
          <button
            onClick={resetGame}
            className="px-4 py-2 mt-4 text-black rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Game2048;
