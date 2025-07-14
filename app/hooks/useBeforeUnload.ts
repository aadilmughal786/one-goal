// app/hooks/useBeforeUnload.ts
import { useStopwatchStore } from '@/store/useStopwatchStore';
import { useEffect } from 'react';

export const useBeforeUnload = () => {
  const isRunning = useStopwatchStore(state => state.isRunning);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = 'A timer is currently running. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning]);
};
