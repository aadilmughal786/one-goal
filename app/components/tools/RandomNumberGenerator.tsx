'use client';

import React, { useCallback, useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const RandomNumberGenerator: React.FC = () => {
  const [min, setMin] = useState<string>('0');
  const [max, setMax] = useState<string>('100');
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateNumber = useCallback(() => {
    setIsLoading(true);
    setRandomNumber(null);

    setTimeout(() => {
      const parsedMin = parseInt(min);
      const parsedMax = parseInt(max);

      if (isNaN(parsedMin) || isNaN(parsedMax)) {
        setRandomNumber(NaN); // Indicate error
        setIsLoading(false);
        return;
      }

      if (parsedMin > parsedMax) {
        setRandomNumber(NaN); // Indicate error
        setIsLoading(false);
        return;
      }

      const num = Math.floor(Math.random() * (parsedMax - parsedMin + 1)) + parsedMin;
      setRandomNumber(num);
      setIsLoading(false);
    }, 1000); // 1 second fake delay
  }, [min, max]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Random Number Generator</h2>

      <div className="mb-4">
        <label htmlFor="min" className="block mb-2 text-sm font-medium">
          Minimum Value:
        </label>
        <input
          type="number"
          id="min"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={max}
          onChange={e => setMax(e.target.value)}
          placeholder="e.g., 100"
        />
      </div>

      <button
        onClick={generateNumber}
        disabled={isLoading}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FaDice /> Generate Number
          </>
        )}
      </button>

      {randomNumber !== null && !isNaN(randomNumber) && (
        <div className="p-4 mt-6 text-center rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">Generated Number:</p>
          <p className="text-3xl font-bold text-accent">{randomNumber}</p>
        </div>
      )}
      {isNaN(randomNumber as number) && randomNumber !== null && (
        <div className="p-4 mt-6 text-center text-red-500 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">Invalid input. Please enter valid numbers.</p>
        </div>
      )}
    </div>
  );
};

export default RandomNumberGenerator;
