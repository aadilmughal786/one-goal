// app/(root)/stop-watch/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import Stopwatch from '@/components/Stopwatch';
import { User } from 'firebase/auth';
import { AppState, StopwatchSession } from '@/types';
import { FiTrash2, FiX } from 'react-icons/fi';
import { Timestamp } from 'firebase/firestore';
import ToastMessage from '@/components/ToastMessage';
import ConfirmationModal from '@/components/ConfirmationModal';
import SessionLog from '@/components/stopwatch/SessionLog';

// Define a type for the session to be deleted, including its date key
interface SessionToDeleteInfo {
  dateKey: string;
  sessionStartTime: Timestamp;
}

const StopwatchPageSkeleton = () => (
  <div className="mx-auto w-full max-w-3xl animate-pulse">
    <div className="mb-12 text-center">
      <div className="mx-auto mb-4 w-3/4 h-8 rounded-lg bg-white/10"></div>
      <div className="mx-auto w-full h-5 rounded-lg bg-white/10"></div>
      <div className="mx-auto mt-2 w-5/6 h-5 rounded-lg bg-white/10"></div>
    </div>
    <div className="p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl">
      <div className="mx-auto w-3/4 h-16 rounded-lg sm:h-20 bg-white/10"></div>
      <div className="mx-auto mt-2 w-1/4 h-6 rounded-lg bg-white/10"></div>
      <div className="flex gap-4 justify-center mt-8 sm:mt-10">
        <div className="w-16 h-16 rounded-full sm:w-20 sm:h-20 bg-white/10"></div>
        <div className="w-16 h-16 rounded-full sm:w-20 sm:h-20 bg-white/10"></div>
      </div>
    </div>
    <div className="mt-12 p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl">
      <div className="mx-auto mb-6 w-1/2 h-8 rounded-lg bg-white/10"></div>
      <div className="space-y-4">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

export default function StopwatchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLabeling, setIsLabeling] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // Store info about the session to delete, not just its ID
  const [sessionToDeleteInfo, setSessionToDeleteInfo] = useState<SessionToDeleteInfo | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const showMessage = useCallback((text: string, _: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        firebaseService.getUserData(currentUser.uid).then(data => {
          setAppState(data);
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const updateTimer = useCallback(() => {
    if (isRunning) {
      setElapsedTime(Date.now() - startTimeRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [isRunning]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateTimer);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateTimer]);

  const handleStart = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedTime;
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    if (elapsedTime > 0 && !isLabeling) {
      setIsRunning(false);
      setIsLabeling(true);
    } else {
      setIsRunning(false);
      setElapsedTime(0);
      setIsLabeling(false);
      setSessionLabel('');
    }
  };

  const handleSaveSession = async () => {
    if (!currentUser || !sessionLabel.trim()) {
      showMessage('Please enter a label for your session.', 'error');
      return;
    }

    const newSession: StopwatchSession = {
      startTime: Timestamp.now(), // Automatically sets to current time
      label: sessionLabel.trim(),
      durationMs: elapsedTime,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      await firebaseService.addStopwatchSession(currentUser.uid, newSession);
      // After adding, refetch user data to ensure appState is fully synchronized
      // as addStopwatchSession modifies a nested map (dailyProgress)
      const updatedAppState = await firebaseService.getUserData(currentUser.uid);
      setAppState(updatedAppState);
      showMessage('Focus session saved!', 'success');
      handleReset(); // Reset stopwatch after successful save
    } catch (error) {
      console.error('Error saving session:', error);
      showMessage('Could not save session. Please try again.', 'error');
    }
  };

  // This function now receives dateKey and sessionStartTime directly from SessionLog
  const handleDeleteSession = useCallback(async (dateKey: string, sessionStartTime: Timestamp) => {
    // Made async
    setSessionToDeleteInfo({ dateKey, sessionStartTime });
    setIsConfirmModalOpen(true);
  }, []);

  const confirmDeleteSession = async () => {
    if (!currentUser || !sessionToDeleteInfo) return;

    try {
      await firebaseService.deleteStopwatchSession(
        currentUser.uid,
        sessionToDeleteInfo.dateKey,
        sessionToDeleteInfo.sessionStartTime
      );
      // After deletion, refetch user data to ensure appState is fully synchronized
      const updatedAppState = await firebaseService.getUserData(currentUser.uid);
      setAppState(updatedAppState);
      showMessage('Session deleted.', 'info');
    } catch (error) {
      console.error('Error deleting session:', error);
      showMessage('Failed to delete session.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setSessionToDeleteInfo(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <div className="container flex-grow justify-center items-center p-4 mx-auto max-w-4xl">
          <section className="py-8 w-full">
            <StopwatchPageSkeleton />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage
        message={toastMessage}
        type={toastMessage === 'Focus session saved!' ? 'success' : 'info'}
      />
      <div className="container flex-grow justify-center p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">The Focus Timer</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Deep work requires uninterrupted concentration. Use this timer to commit to a block of
              focused effort on your goal. Every second you track is a step forward.
            </p>
          </div>
          <Stopwatch
            isRunning={isRunning}
            elapsedTime={elapsedTime}
            isLabeling={isLabeling}
            sessionLabel={sessionLabel}
            setSessionLabel={setSessionLabel}
            handleStart={handleStart}
            handlePause={handlePause}
            handleReset={handleReset}
            handleSave={handleSaveSession}
          />

          <SessionLog appState={appState} onDeleteSession={handleDeleteSession} />
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
  );
}
