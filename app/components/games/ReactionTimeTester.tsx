'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const ReactionTimeTester: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'ready' | 'testing' | 'result'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startWaitingPhase = useCallback(() => {
    setPhase('waiting');
    setReactionTime(null);
    const randomDelay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      setStartTime(performance.now());
    }, randomDelay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === 'idle' || phase === 'result') {
      startWaitingPhase();
    } else if (phase === 'waiting') {
      // Too soon
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('result');
      setReactionTime(0); // Indicate too soon
    } else if (phase === 'ready') {
      // Valid click
      const endTime = performance.now();
      setReactionTime(Math.round(endTime - startTime));
      setPhase('result');
    }
  }, [phase, startTime, startWaitingPhase]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getBackgroundColor = () => {
    switch (phase) {
      case 'waiting':
        return 'bg-red-500';
      case 'ready':
        return 'bg-green-500';
      case 'testing':
        return 'bg-blue-500';
      case 'result':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMessage = () => {
    switch (phase) {
      case 'idle':
        return 'Click anywhere to start';
      case 'waiting':
        return 'Wait for green...';
      case 'ready':
        return 'Click NOW!';
      case 'result':
        if (reactionTime === 0) return 'Too soon! Click to try again.';
        return `Your reaction time: ${reactionTime} ms. Click to try again.`;
      default:
        return '';
    }
  };

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Reaction Time Tester</h2>

      <div
        className={`flex justify-center items-center w-full h-64 rounded-lg transition-colors duration-300 cursor-pointer ${getBackgroundColor()}`}
        onClick={handleClick}
      >
        <p className="text-xl font-bold text-white">{getMessage()}</p>
      </div>

      {phase === 'result' && reactionTime !== null && reactionTime !== 0 && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">
            Your Reaction Time: <span className="font-bold text-accent">{reactionTime} ms</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReactionTimeTester;
