'use client';

import React, { useCallback, useEffect, useState } from 'react';

const NUM_DISKS = 3; // Default number of disks

const TowerOfHanoi: React.FC = () => {
  const [towers, setTowers] = useState<number[][]>([[], [], []]); // [[disks on peg 1], [disks on peg 2], [disks on peg 3]]
  const [moves, setMoves] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [selectedDisk, setSelectedDisk] = useState<{ disk: number; fromPeg: number } | null>(null);

  const initializeGame = useCallback(() => {
    const initialDisks = Array.from({ length: NUM_DISKS }, (_, i) => NUM_DISKS - i);
    setTowers([initialDisks, [], []]);
    setMoves(0);
    setMessage('Move all disks from Peg 1 to Peg 3.');
    setSelectedDisk(null);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handlePegClick = useCallback(
    (pegIndex: number) => {
      if (selectedDisk === null) {
        // Select a disk to move
        const topDisk = towers[pegIndex][towers[pegIndex].length - 1];
        if (topDisk) {
          setSelectedDisk({ disk: topDisk, fromPeg: pegIndex });
          setMessage(
            `Selected disk ${topDisk} from Peg ${pegIndex + 1}. Now select a destination peg.`
          );
        } else {
          setMessage('This peg is empty. Select a peg with disks.');
        }
      } else {
        // Move the selected disk to this peg
        const fromPegIndex = selectedDisk.fromPeg;
        const diskToMove = selectedDisk.disk;
        const toPegIndex = pegIndex;

        if (fromPegIndex === toPegIndex) {
          setMessage('Disk is already on this peg. Deselecting.');
          setSelectedDisk(null);
          return;
        }

        const destinationPeg = towers[toPegIndex];
        const topDiskOnDestination = destinationPeg[destinationPeg.length - 1];

        if (topDiskOnDestination && diskToMove > topDiskOnDestination) {
          setMessage('Cannot place a larger disk on a smaller disk.');
          setSelectedDisk(null);
          return;
        }

        const newTowers = towers.map(arr => arr.slice()); // Deep copy
        newTowers[fromPegIndex].pop(); // Remove from source
        newTowers[toPegIndex].push(diskToMove); // Add to destination

        setTowers(newTowers);
        setMoves(prevMoves => prevMoves + 1);
        setSelectedDisk(null);
        setMessage('');

        // Check for win condition
        if (newTowers[2].length === NUM_DISKS) {
          setMessage(`Congratulations! You solved the Tower of Hanoi in ${moves + 1} moves!`);
        }
      }
    },
    [towers, selectedDisk, moves]
  );

  const renderDisk = (diskSize: number) => {
    const width = diskSize * 20 + 20; // Scale disk width
    return (
      <div
        key={diskSize}
        className="mx-auto h-5 bg-blue-500 rounded-md border border-blue-700"
        style={{ width: `${width}px` }}
      ></div>
    );
  };

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Tower of Hanoi</h2>

      <div className="mb-4 text-lg font-medium">{message}</div>
      <p className="mb-4">
        Moves: <span className="font-bold text-accent">{moves}</span>
      </p>

      <div className="flex gap-8 justify-center mb-6">
        {towers.map((peg, pegIndex) => (
          <div
            key={pegIndex}
            className="flex flex-col-reverse items-center w-32 h-48 border-b-2 cursor-pointer border-text-primary bg-bg-primary"
            onClick={() => handlePegClick(pegIndex)}
          >
            {peg.map(disk => renderDisk(disk))}
            <div className="w-1 h-full bg-text-primary"></div> {/* Peg pole */}
          </div>
        ))}
      </div>

      <button
        onClick={initializeGame}
        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Reset Game
      </button>
    </div>
  );
};

export default TowerOfHanoi;
