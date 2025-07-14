// app/components/tools/BinaryConverter.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';

const BinaryConverter: React.FC = () => {
  const [bitLength, setBitLength] = useState<number>(8); // Default to 8 bits
  const [binary, setBinary] = useState<number[]>(Array(bitLength).fill(0)); // Initialized based on bitLength

  // Reset binary array when bitLength changes
  React.useEffect(() => {
    setBinary(Array(bitLength).fill(0));
  }, [bitLength]);

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
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-medium">Binary ({bitLength}-bit):</p>
          <div className="flex space-x-2">
            {[8, 16, 32].map(len => (
              <button
                key={len}
                onClick={() => setBitLength(len)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer
                  ${bitLength === len ? 'bg-accent text-black bg-white' : 'bg-bg-primary text-text-primary border border-border-primary'}
                  hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent`}
              >
                {len}-bit
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 rounded-md border border-border-primary bg-bg-primary">
          {Array.from({ length: bitLength / 8 }).map((_, byteIndex) => (
            <div key={byteIndex} className="flex flex-wrap gap-2 justify-center">
              {binary.slice(byteIndex * 8, (byteIndex + 1) * 8).map((bit, indexInByte) => {
                const originalIndex = byteIndex * 8 + indexInByte;
                return (
                  <button
                    key={originalIndex}
                    onClick={() => handleBitFlip(originalIndex)}
                    className={`w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-md transition-colors duration-200 border cursor-pointer
                      ${bit === 1 ? 'bg-green-300 dark:bg-green-400/60 text-white' : 'bg-bg-primary text-text-primary border-border-primary'}
                      hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent`}
                    aria-label={`Toggle bit ${originalIndex + 1}`}
                  >
                    {bit}
                  </button>
                );
              })}
            </div>
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
