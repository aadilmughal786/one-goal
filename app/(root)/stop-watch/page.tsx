// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import Stopwatch from '@/components/Stopwatch';
import { User } from 'firebase/auth';
import { AppState, StopwatchSession } from '@/types';
import { FiTrash2, FiX, FiCalendar } from 'react-icons/fi';
import { GoStopwatch } from 'react-icons/go';
import { CgScreen } from 'react-icons/cg';
import { Timestamp } from 'firebase/firestore';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import SessionLog from '@/components/stopwatch/SessionLog';
import PomodoroTimer from '@/components/stopwatch/PomodoroTimer';
import type { TimerMode } from '@/components/stopwatch/PomodoroTimer';
import { IconType } from 'react-icons';
import * as Tone from 'tone';
import { TimerContext } from '@/contexts/TimerContext';

interface SessionToDeleteInfo {
  dateKey: string;
  sessionStartTime: Timestamp;
}

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
}

const timeSettings: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const StopwatchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- GLOBAL TIMER STATE ---
  // Stopwatch State
  const [stopwatchIsRunning, setStopwatchIsRunning] = useState(false);
  const [stopwatchElapsedTime, setStopwatchElapsedTime] = useState(0);
  const [stopwatchIsLabeling, setStopwatchIsLabeling] = useState(false);
  const [stopwatchSessionLabel, setStopwatchSessionLabel] = useState('');
  const [isSavingStopwatch, setIsSavingStopwatch] = useState(false);

  // Pomodoro State
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>('pomodoro');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(timeSettings.pomodoro);
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Refs for timers
  const stopwatchStartTimeRef = useRef<number>(0);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopwatchFrameRef = useRef<number | null>(null);

  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth on client side
    synth.current = new Tone.Synth().toDestination();
  }, []);

  // --- TABS & GENERIC LOGIC ---
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || 'stopwatch';
  });

  const showMessage = useCallback((text: string, _: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
      } catch {
        showMessage('Failed to load user data.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid);
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchUserData]);

  // --- STOPWATCH LOGIC ---
  const updateStopwatchTimer = useCallback(() => {
    if (stopwatchIsRunning) {
      setStopwatchElapsedTime(Date.now() - stopwatchStartTimeRef.current);
    }
    stopwatchFrameRef.current = requestAnimationFrame(updateStopwatchTimer);
  }, [stopwatchIsRunning]);

  useEffect(() => {
    stopwatchFrameRef.current = requestAnimationFrame(updateStopwatchTimer);
    return () => {
      if (stopwatchFrameRef.current) {
        cancelAnimationFrame(stopwatchFrameRef.current);
      }
    };
  }, [updateStopwatchTimer]);

  const handleStopwatchStart = () => {
    setStopwatchIsRunning(true);
    stopwatchStartTimeRef.current = Date.now() - stopwatchElapsedTime;
  };

  const handleStopwatchPause = () => {
    setStopwatchIsRunning(false);
  };

  const handleStopwatchReset = () => {
    if (stopwatchElapsedTime > 0 && !stopwatchIsLabeling) {
      setStopwatchIsRunning(false);
      setStopwatchIsLabeling(true);
    } else {
      setStopwatchIsRunning(false);
      setStopwatchElapsedTime(0);
      setStopwatchIsLabeling(false);
      setStopwatchSessionLabel('');
    }
  };

  const handleStopwatchSave = async () => {
    if (!currentUser || !stopwatchSessionLabel.trim()) {
      showMessage('Please enter a label for your session.', 'error');
      return;
    }
    setIsSavingStopwatch(true);
    const newSession: Omit<StopwatchSession, 'startTime'> = {
      label: stopwatchSessionLabel.trim(),
      durationMs: stopwatchElapsedTime,
    };
    try {
      await firebaseService.addStopwatchSession(currentUser.uid, newSession);
      await fetchUserData(currentUser.uid);
      showMessage('Focus session saved!', 'success');
      handleStopwatchReset();
    } catch {
      showMessage('Could not save session. Please try again.', 'error');
    } finally {
      setIsSavingStopwatch(false);
    }
  };

  // --- POMODORO LOGIC ---
  const playSound = useCallback(() => {
    Tone.start();
    synth.current?.triggerAttackRelease('C5', '0.5');
  }, []);

  const handlePomodoroSwitchMode = useCallback((newMode: TimerMode) => {
    setPomodoroIsActive(false);
    setPomodoroMode(newMode);
    setPomodoroTimeLeft(timeSettings[newMode]);
  }, []);

  useEffect(() => {
    if (pomodoroIsActive && pomodoroTimeLeft > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTimeLeft === 0) {
      playSound();
      if (pomodoroMode === 'pomodoro') {
        const newPomodoroCount = pomodoroCount + 1;
        setPomodoroCount(newPomodoroCount);
        handlePomodoroSwitchMode(newPomodoroCount % 4 === 0 ? 'longBreak' : 'shortBreak');
      } else {
        handlePomodoroSwitchMode('pomodoro');
      }
    }
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [
    pomodoroIsActive,
    pomodoroTimeLeft,
    pomodoroMode,
    pomodoroCount,
    handlePomodoroSwitchMode,
    playSound,
  ]);

  const handlePomodoroToggle = () => {
    setPomodoroIsActive(!pomodoroIsActive);
  };

  const handlePomodoroReset = () => {
    setPomodoroIsActive(false);
    setPomodoroTimeLeft(timeSettings[pomodoroMode]);
  };

  // --- SESSION LOG LOGIC ---
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [sessionToDeleteInfo, setSessionToDeleteInfo] = useState<SessionToDeleteInfo | null>(null);

  const handleDeleteSession = useCallback(async (dateKey: string, sessionStartTime: Timestamp) => {
    setSessionToDeleteInfo({ dateKey, sessionStartTime });
    setIsConfirmModalOpen(true);
  }, []);

  const handleUpdateSession = useCallback(
    async (dateKey: string, sessionStartTime: Timestamp, newLabel: string) => {
      if (!currentUser) return;
      setIsUpdatingId(sessionStartTime.toMillis().toString());
      try {
        await firebaseService.updateStopwatchSession(
          currentUser.uid,
          dateKey,
          sessionStartTime,
          newLabel
        );
        await fetchUserData(currentUser.uid);
        showMessage('Session updated!', 'success');
      } catch {
        showMessage('Failed to update session.', 'error');
      } finally {
        setIsUpdatingId(null);
      }
    },
    [currentUser, fetchUserData, showMessage]
  );

  const confirmDeleteSession = async () => {
    if (!currentUser || !sessionToDeleteInfo) return;
    try {
      await firebaseService.deleteStopwatchSession(
        currentUser.uid,
        sessionToDeleteInfo.dateKey,
        sessionToDeleteInfo.sessionStartTime
      );
      await fetchUserData(currentUser.uid);
      showMessage('Session deleted.', 'info');
    } catch {
      showMessage('Failed to delete session.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setSessionToDeleteInfo(null);
    }
  };

  // --- TABS & RENDER LOGIC ---
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const tabItems: TabItem[] = [
    { id: 'stopwatch', label: 'Stopwatch', icon: GoStopwatch },
    { id: 'pomodoro', label: 'Pomodoro', icon: CgScreen },
    { id: 'log', label: 'Session Log', icon: FiCalendar },
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'stopwatch':
        return <Stopwatch />;
      case 'pomodoro':
        return <PomodoroTimer />;
      case 'log':
        return (
          <SessionLog
            appState={appState}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            isUpdatingId={isUpdatingId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TimerContext.Provider
      value={{
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
        pomodoroMode,
        pomodoroTimeLeft,
        pomodoroIsActive,
        pomodoroCount,
        handlePomodoroToggle,
        handlePomodoroReset,
        handlePomodoroSwitchMode,
      }}
    >
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <ToastMessage
          message={toastMessage}
          type={
            toastMessage?.includes('saved') || toastMessage?.includes('updated')
              ? 'success'
              : 'info'
          }
        />

        <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
          <div className="flex space-x-2">
            {tabItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                            ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                  aria-label={item.label}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <section className="py-8 w-full">
            {isLoading ? <div>Loading...</div> : renderActiveComponent()}
          </section>
        </div>

        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Delete Session?"
          message="Are you sure you want to permanently delete this logged session? This action cannot be undone."
          confirmButton={{
            text: 'Delete',
            onClick: confirmDeleteSession,
            className: 'bg-red-600 text-white hover:bg-red-700',
            icon: <FiTrash2 />,
          }}
          cancelButton={{
            text: 'Cancel',
            onClick: () => setIsConfirmModalOpen(false),
            icon: <FiX />,
          }}
        />
      </main>
    </TimerContext.Provider>
  );
};

export default function StopwatchPage() {
  return (
    <Suspense fallback={<div>Loading Focus Timers...</div>}>
      <StopwatchPageContent />
    </Suspense>
  );
}
