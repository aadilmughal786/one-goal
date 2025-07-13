'use client';

import React, { useCallback, useMemo, useState } from 'react';

const BinaryConverter: React.FC = () => {
  const [binary, setBinary] = useState<number[]>(Array(8).fill(0)); // 8 bits, initialized to 0

  const handleBitFlip = useCallback((index: number) => {
    setBinary(prevBinary => {
      const newBinary = [...prevBinary];
      newBinary[index] = newBinary[index] === 0 ? 1 : 0;
      return newBinary;
    });
  }, []);

  const decimalValue = useMemo(() => {
    return parseInt(binary.join(''), 2);
  }, [binary]);

  const hexValue = useMemo(() => {
    return decimalValue.toString(16).toUpperCase();
  }, [decimalValue]);

  const octalValue = useMemo(() => {
    return decimalValue.toString(8);
  }, [decimalValue]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Binary Converter</h2>

      <div className="mb-6">
        <p className="mb-2 text-lg font-medium">Binary (8-bit):</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {binary.map((bit, index) => (
            <button
              key={index}
              onClick={() => handleBitFlip(index)}
              className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded-md transition-colors duration-200
                ${bit === 1 ? 'bg-accent text-white' : 'bg-bg-primary text-text-primary border border-border-primary'}
                hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent`}
              aria-label={`Toggle bit ${index + 1}`}
            >
              {bit}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
        <div className="p-4 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Decimal:</p>
          <p className="text-2xl font-bold text-accent">{decimalValue}</p>
        </div>
        <div className="p-4 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Hexadecimal:</p>
          <p className="text-2xl font-bold text-accent">{hexValue}</p>
        </div>
        <div className="p-4 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Octal:</p>
          <p className="text-2xl font-bold text-accent">{octalValue}</p>
        </div>
      </div>
    </div>
  );
};

export default BinaryConverter;
