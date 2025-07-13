'use client';

import React, { useState, useCallback } from 'react';
import { FaDice } from 'react-icons/fa';

const RandomNumberGenerator: React.FC = () => {
  const [min, setMin] = useState<string>('0');
  const [max, setMax] = useState<string>('100');
  const [randomNumber, setRandomNumber] = useState<number | null>(null);

  const generateNumber = useCallback(() => {
    const parsedMin = parseInt(min);
    const parsedMax = parseInt(max);

    if (isNaN(parsedMin) || isNaN(parsedMax)) {
      setRandomNumber(NaN); // Indicate error
      return;
    }

    if (parsedMin > parsedMax) {
      setRandomNumber(NaN); // Indicate error
      return;
    }

    const num = Math.floor(Math.random() * (parsedMax - parsedMin + 1)) + parsedMin;
    setRandomNumber(num);
  }, [min, max]);

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Random Number Generator</h2>

      <div className="mb-4">
        <label htmlFor="min" className="block mb-2 text-sm font-medium">
          Minimum Value:
        </label>
        <input
          type="number"
          id="min"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={min}
          onChange={e => setMin(e.target.value)}
          placeholder="e.g., 0"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="max" className="block mb-2 text-sm font-medium">
          Maximum Value:
        </label>
        <input
          type="number"
          id="max"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={max}
          onChange={e => setMax(e.target.value)}
          placeholder="e.g., 100"
        />
      </div>

      <button
        onClick={generateNumber}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-center gap-2"
      >
        <FaDice /> Generate Number
      </button>

      {randomNumber !== null && !isNaN(randomNumber) && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary text-center">
          <p className="text-lg font-medium">Generated Number:</p>
          <p className="text-3xl font-bold text-accent">{randomNumber}</p>
        </div>
      )}
      {isNaN(randomNumber as number) && randomNumber !== null && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary text-center text-red-500">
          <p className="text-lg font-medium">Invalid input. Please enter valid numbers.</p>
        </div>
      )}
    </div>
  );
};

export default RandomNumberGenerator;
