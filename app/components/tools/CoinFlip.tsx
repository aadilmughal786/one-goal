'use client';

import React, { useState } from 'react';
import { FaCoins } from 'react-icons/fa';

const CoinFlip: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  const flipCoin = () => {
    setIsFlipping(true);
    setResult(null);

    setTimeout(() => {
      const outcomes = ['Heads', 'Tails'];
      const randomIndex = Math.floor(Math.random() * outcomes.length);
      setResult(outcomes[randomIndex]);
      setIsFlipping(false);
    }, 1000); // Simulate flip duration
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary text-center">
      <h2 className="mb-4 text-2xl font-semibold">Coin Flip</h2>

      <div className="mb-6">
        <div
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-5xl font-bold transition-all duration-500 ease-in-out
            ${isFlipping ? 'bg-gray-500 animate-spin-once' : 'bg-accent text-white'}`}
        >
          {isFlipping ? <FaCoins className="animate-spin" /> : result ? result.charAt(0) : '?'}
        </div>
      </div>

      <button
        onClick={flipCoin}
        disabled={isFlipping}
        className="w-full px-4 py-2 text-white rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFlipping ? 'Flipping...' : 'Flip Coin'}
      </button>

      {result && !isFlipping && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
          <p className="text-lg font-medium">
            Result: <span className="font-bold text-accent">{result}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CoinFlip;
