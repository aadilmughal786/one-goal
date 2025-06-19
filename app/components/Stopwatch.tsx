// app/components/Stopwatch.tsx
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { FiPlay, FiPause, FiSave, FiLoader, FiMaximize, FiMinimize } from 'react-icons/fi';
import { GrPowerReset } from 'react-icons/gr';
import { TimerContext } from '@/contexts/TimerContext';

const Stopwatch: React.FC = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('Stopwatch must be used within a TimerProvider');
  }

  const {
    stopwatchIsRunning,
    stopwatchElapsedTime,
    stopwatchIsLabeling,
    stopwatchSessionLabel,
    setStopwatchSessionLabel,
    handleStopwatchStart,
    handleStopwatchPause,
    handleStopwatchReset,
    handleStopwatchSave,
    isSavingStopwatch,
  } = context;

  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(stopwatchElapsedTime);

  const toggleFullScreen = () => {
    if (!fullScreenRef.current) return;
    if (!document.fullscreenElement) {
      fullScreenRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  return (
    <div
      ref={fullScreenRef}
      className="flex flex-col justify-center items-center p-4 w-full text-white bg-black transition-colors duration-500"
    >
      <div
        className={`w-full max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all duration-300 ${isFullScreen ? 'bg-black border-black' : 'bg-white/[0.02] border-white/10'}`}
      >
        {stopwatchIsLabeling ? (
          <div className="w-full text-center">
            <p className="mb-2 text-white/70">Session Complete! What did you work on?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={stopwatchSessionLabel}
                onChange={e => setStopwatchSessionLabel(e.target.value)}
                placeholder="e.g., Drafted project proposal..."
                autoFocus
                className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                onKeyPress={e => e.key === 'Enter' && handleStopwatchSave()}
                disabled={isSavingStopwatch}
              />
              <button
                onClick={handleStopwatchSave}
                disabled={isSavingStopwatch}
                className="p-3 font-semibold text-white bg-green-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-green-500 hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {isSavingStopwatch ? (
                  <FiLoader size={24} className="animate-spin" />
                ) : (
                  <FiSave size={24} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex justify-center items-center w-full font-mono text-5xl font-bold tracking-wider text-white sm:text-7xl"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              <span>{hours}</span>
              <span
                className={`px-2 transition-opacity duration-500 ${stopwatchIsRunning ? 'animate-pulse' : 'opacity-50'}`}
              >
                :
              </span>
              <span>{minutes}</span>
              <span
                className={`px-2 transition-opacity duration-500 ${stopwatchIsRunning ? 'animate-pulse' : 'opacity-50'}`}
              >
                :
              </span>
              <span>{seconds}</span>
            </div>
            <div
              className="mt-2 font-mono text-lg sm:text-xl text-white/50"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              Centiseconds:{' '}
              {String(Math.floor((stopwatchElapsedTime % 1000) / 10)).padStart(2, '0')}
            </div>
          </>
        )}

        <div className="flex gap-4 justify-center items-center mt-8 sm:mt-10">
          <button
            onClick={handleStopwatchReset}
            disabled={stopwatchElapsedTime === 0 && !stopwatchIsRunning && !stopwatchIsLabeling}
            className="flex justify-center items-center w-16 h-16 rounded-full transition-all duration-300 cursor-pointer text-white/70 sm:w-20 sm:h-20 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
          >
            <GrPowerReset size={24} />
          </button>
          {!stopwatchIsLabeling && (
            <button
              onClick={stopwatchIsRunning ? handleStopwatchPause : handleStopwatchStart}
              className="flex justify-center items-center w-16 h-16 text-white bg-blue-600 rounded-full transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 hover:bg-blue-500 hover:scale-105 active:scale-95"
            >
              {stopwatchIsRunning ? <FiPause size={32} /> : <FiPlay size={32} className="ml-1" />}
            </button>
          )}
          <button
            onClick={toggleFullScreen}
            className="flex justify-center items-center w-16 h-16 rounded-full transition-all duration-300 cursor-pointer text-white/70 sm:w-20 sm:h-20 hover:bg-white/10 hover:text-white active:scale-95"
          >
            {isFullScreen ? <FiMinimize size={24} /> : <FiMaximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
