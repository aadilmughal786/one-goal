'use client';

import React, { useState } from 'react';
import { FaCoins } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

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
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Coin Flip</h2>

      <div className="mb-6">
        <div
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-5xl font-bold transition-all duration-500 ease-in-out
            ${isFlipping ? 'bg-gray-500 animate-spin-once' : 'text-white bg-accent'}`}
        >
          {isFlipping ? <FaCoins className="animate-spin" /> : result ? result.charAt(0) : '?'}
        </div>
      </div>

      <button
        onClick={flipCoin}
        disabled={isFlipping}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isFlipping ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Flipping...</span>
          </>
        ) : (
          <span>Flip Coin</span>
        )}
      </button>

      {result && !isFlipping && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">
            Result: <span className="font-bold text-accent">{result}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CoinFlip;
