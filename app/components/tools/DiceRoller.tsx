'use client';

import React, { useState } from 'react';
import { FaDiceFive } from 'react-icons/fa'; // Using FaDiceFive as a generic dice icon

const DiceRoller: React.FC = () => {
  const [numDice, setNumDice] = useState<number>(1);
  const [sides, setSides] = useState<number>(6);
  const [results, setResults] = useState<number[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const rollDice = () => {
    setIsRolling(true);
    setResults([]);
    setTotal(null);

    setTimeout(() => {
      const newResults: number[] = [];
      let newTotal = 0;
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        newResults.push(roll);
        newTotal += roll;
      }
      setResults(newResults);
      setTotal(newTotal);
      setIsRolling(false);
    }, 1000); // Simulate rolling duration
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Dice Roller</h2>

      <div className="mb-4">
        <label htmlFor="numDice" className="block mb-2 text-sm font-medium">
          Number of Dice:
        </label>
        <input
          type="number"
          id="numDice"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={numDice}
          onChange={e => setNumDice(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="sides" className="block mb-2 text-sm font-medium">
          Sides per Die:
        </label>
        <input
          type="number"
          id="sides"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={sides}
          onChange={e => setSides(Math.max(2, parseInt(e.target.value) || 6))}
          min="2"
        />
      </div>

      <button
        onClick={rollDice}
        disabled={isRolling}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isRolling ? (
          'Rolling...'
        ) : (
          <>
            <FaDiceFive /> Roll Dice
          </>
        )}
      </button>

      {results.length > 0 && !isRolling && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
          <p className="text-lg font-medium">
            Results: <span className="font-bold text-accent">{results.join(', ')}</span>
          </p>
          {total !== null && (
            <p className="text-lg font-medium">
              Total: <span className="font-bold text-accent">{total}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
