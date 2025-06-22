// app/components/stop-watch/Stopwatch.tsx
'use client';

// Removed useContext and TimerContext as we are now using Zustand store
import React, { useEffect, useRef, useState } from 'react';
import {
  FiLoader,
  FiMaximize,
  FiMinimize,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi'; // Updated icon import
// Import the useTimerStore from our Zustand store
import { useTimerStore } from '@/store/useTimerStore';

/**
 * Stopwatch Component
 *
 * This component provides the main user interface for the stopwatch functionality.
 * It integrates with the useTimerStore to manage the stopwatch's state (running, elapsed time, labeling, saving).
 * Features include:
 * - Start, pause, and reset controls for the stopwatch.
 * - Input for labeling a completed session before saving.
 * - Fullscreen mode for an immersive timing experience.
 * - Visual indicators for stopwatch state (running, saving).
 */
const Stopwatch: React.FC = () => {
  // Access the stopwatch state and actions directly from the useTimerStore
  const {
    isRunning: stopwatchIsRunning,
    elapsedTime: stopwatchElapsedTime,
    isLabeling: stopwatchIsLabeling,
    sessionLabel: stopwatchSessionLabel,
    isSaving: isSavingStopwatch,
    setSessionLabel: setStopwatchSessionLabel,
    start: handleStopwatchStart,
    pause: handleStopwatchPause,
    reset: handleStopwatchReset,
    save: handleStopwatchSave,
  } = useTimerStore(state => ({
    isRunning: state.isRunning,
    elapsedTime: state.elapsedTime,
    isLabeling: state.isLabeling,
    sessionLabel: state.sessionLabel,
    isSaving: state.isSaving,
    setSessionLabel: state.setSessionLabel,
    start: state.start,
    pause: state.pause,
    reset: state.reset,
    save: state.save,
  }));

  // State to manage the fullscreen mode of the stopwatch container.
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Ref to the div element that will enter fullscreen mode.
  const fullScreenRef = useRef<HTMLDivElement>(null);

  /**
   * Formats milliseconds into an object containing hours, minutes, and seconds as padded strings.
   * Ensures fixed-width display for time.
   * @param ms The elapsed time in milliseconds.
   * @returns An object { hours, minutes, seconds }.
   */
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return { hours, minutes, seconds };
  };

  // Get the formatted time parts for display.
  const { hours, minutes, seconds } = formatTime(stopwatchElapsedTime);

  /**
   * Toggles the fullscreen mode for the stopwatch container.
   * Uses the Web Fullscreen API.
   */
  const toggleFullScreen = () => {
    if (!fullScreenRef.current) return; // Ensure ref is attached to an element
    if (!document.fullscreenElement) {
      // If not currently in fullscreen, request fullscreen.
      fullScreenRef.current.requestFullscreen();
    } else {
      // If in fullscreen, exit fullscreen.
      document.exitFullscreen();
    }
  };

  // Effect to listen for fullscreen change events and update the `isFullScreen` state.
  useEffect(() => {
    const handleFullScreenChange = () => {
      // Update state based on whether any element is currently in fullscreen mode.
      setIsFullScreen(!!document.fullscreenElement);
    };
    // Add event listener when component mounts.
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    // Remove event listener when component unmounts to prevent memory leaks.
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount.

  return (
    <div
      ref={fullScreenRef} // Attach ref for fullscreen control
      className={`flex flex-col justify-center items-center p-4 w-full text-white transition-colors duration-500
        ${isFullScreen ? 'h-screen bg-black' : 'bg-transparent'}
      `}
    >
      <div
        className={`w-full max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all duration-300
          ${isFullScreen ? 'bg-black border-black' : 'bg-white/[0.02] border-white/10'}
        `}
      >
        {/* Conditional rendering based on whether the session is in labeling mode */}
        {stopwatchIsLabeling ? (
          <div className="w-full text-center">
            <p className="mb-2 text-white/70">Session Complete! What did you work on?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={stopwatchSessionLabel}
                onChange={e => setStopwatchSessionLabel(e.target.value)}
                placeholder="e.g., Drafted project proposal..."
                autoFocus // Automatically focus the input field
                className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                onKeyPress={e => e.key === 'Enter' && handleStopwatchSave()} // Save on Enter key press
                disabled={isSavingStopwatch} // Disable input while saving
                aria-label="Enter session label"
              />
              <button
                onClick={handleStopwatchSave}
                disabled={isSavingStopwatch || !stopwatchSessionLabel.trim()} // Disable save if empty or saving
                className="p-3 font-semibold text-white bg-green-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-green-500 hover:scale-105 active:scale-95 disabled:opacity-60"
                aria-label="Save session"
              >
                {isSavingStopwatch ? (
                  <FiLoader size={24} className="animate-spin" /> // Loader icon when saving
                ) : (
                  <FiSave size={24} /> // Save icon
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stopwatch time display */}
            <div
              className="flex justify-center items-center w-full font-mono text-5xl font-bold tracking-wider text-white sm:text-7xl"
              style={{ fontVariantNumeric: 'tabular-nums' }} // Ensures numbers align vertically
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
            {/* Centiseconds display */}
            <div
              className="mt-2 font-mono text-lg text-center sm:text-xl text-white/50" // Centered text for centiseconds
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              Centiseconds:{' '}
              {String(Math.floor((stopwatchElapsedTime % 1000) / 10)).padStart(2, '0')}
            </div>
          </>
        )}

        {/* Control buttons */}
        <div className="flex gap-4 justify-center items-center mt-8 sm:mt-10">
          {/* Reset Button */}
          <button
            onClick={handleStopwatchReset}
            // Disabled if stopwatch is at zero and not running, and not in labeling mode
            disabled={stopwatchElapsedTime === 0 && !stopwatchIsRunning && !stopwatchIsLabeling}
            className="flex justify-center items-center w-16 h-16 rounded-full transition-all duration-300 cursor-pointer text-white/70 sm:w-20 sm:h-20 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
            aria-label="Reset stopwatch"
          >
            <FiRefreshCw size={24} /> {/* Updated icon */}
          </button>

          {/* Play/Pause Button (only visible when not labeling) */}
          {!stopwatchIsLabeling && (
            <button
              onClick={stopwatchIsRunning ? handleStopwatchPause : handleStopwatchStart}
              className="flex justify-center items-center w-16 h-16 text-white bg-blue-600 rounded-full transition-all duration-300 cursor-pointer sm:w-20 sm:h-20 hover:bg-blue-500 hover:scale-105 active:scale-95"
              aria-label={stopwatchIsRunning ? 'Pause stopwatch' : 'Start stopwatch'}
            >
              {stopwatchIsRunning ? <FiPause size={32} /> : <FiPlay size={32} className="ml-1" />}
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullScreen}
            className="flex justify-center items-center w-16 h-16 rounded-full transition-all duration-300 cursor-pointer text-white/70 sm:w-20 sm:h-20 hover:bg-white/10 hover:text-white active:scale-95"
            aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullScreen ? <FiMinimize size={24} /> : <FiMaximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
