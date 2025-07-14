// app/components/tools/VisionTest.tsx
'use client';

import React, { useState, useCallback } from 'react';

const SNELLEN_CHART_LINES = [
  ['E'],
  ['F', 'P'],
  ['T', 'O', 'Z'],
  ['L', 'P', 'E', 'D'],
  ['P', 'E', 'C', 'F', 'D'],
  ['E', 'D', 'F', 'C', 'Z', 'P'],
  ['F', 'E', 'L', 'O', 'P', 'Z', 'D'],
  ['D', 'E', 'F', 'P', 'O', 'T', 'E', 'C'],
  ['L', 'E', 'F', 'O', 'D', 'P', 'C', 'T'],
];

const FONT_SIZES = [
  'text-9xl', // E
  'text-8xl', // FP
  'text-7xl', // TOZ
  'text-6xl', // LPED
  'text-5xl', // PECFD
  'text-4xl', // EDFCZP
  'text-3xl', // FELOPZD
  'text-2xl', // DEFPOTEC
  'text-xl', // LEFODPCT
];

const VisionTest: React.FC = () => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [smallestLineRead, setSmallestLineRead] = useState<number | null>(null);

  const handleYes = useCallback(() => {
    if (currentLineIndex < SNELLEN_CHART_LINES.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setSmallestLineRead(currentLineIndex + 1); // User successfully read this line
    } else {
      setTestCompleted(true);
      setSmallestLineRead(SNELLEN_CHART_LINES.length); // User read the smallest line
    }
  }, [currentLineIndex]);

  const handleNo = useCallback(() => {
    setTestCompleted(true);
    // smallestLineRead is already set to the last successfully read line
  }, []);

  const handleReset = useCallback(() => {
    setCurrentLineIndex(0);
    setTestCompleted(false);
    setSmallestLineRead(null);
  }, []);

  const currentLine = SNELLEN_CHART_LINES[currentLineIndex];
  const currentFontSize = FONT_SIZES[currentLineIndex];

  return (
    <div className="p-6 mx-auto max-w-2xl rounded-lg shadow-lg bg-bg-secondary text-text-primary text-center">
      <h2 className="mb-6 text-2xl font-semibold">Vision Test (Snellen Chart)</h2>

      {!testCompleted ? (
        <div className="space-y-8">
          <p className="text-lg text-text-muted">
            Stand approximately 10 feet (3 meters) away from your screen.
          </p>
          <p className="text-xl font-medium">Can you read the following line?</p>

          <div className="flex justify-center items-center h-48 border border-border-primary rounded-md bg-bg-primary">
            <span className={`font-bold ${currentFontSize}`}>{currentLine.join(' ')}</span>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleYes}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
            >
              Yes, I can read it
            </button>
            <button
              onClick={handleNo}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-text-primary bg-bg-primary border border-border-primary rounded-lg transition-all duration-200 cursor-pointer hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-primary"
            >
              No, I can&apos;t
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Test Completed!</h3>
          {smallestLineRead !== null && smallestLineRead > 0 ? (
            <p className="text-lg">
              You were able to read up to line{' '}
              <span className="font-bold text-accent">{smallestLineRead}</span> of the chart.
            </p>
          ) : (
            <p className="text-lg">You were unable to read any lines clearly.&apos;</p>
          )}
          <button
            onClick={handleReset}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
          >
            Retake Test
          </button>
        </div>
      )}
    </div>
  );
};

export default VisionTest;
