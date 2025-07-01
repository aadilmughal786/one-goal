// app/components/common/ReminderModal.tsx
'use client';

import { useWellnessStore } from '@/store/useWellnessStore';
import { ReminderType } from '@/types';
import React from 'react';
import { FiArrowUpCircle, FiClock, FiDroplet, FiEye, FiRefreshCw, FiX } from 'react-icons/fi';

const reminderDetails: Record<
  ReminderType,
  { icon: React.ElementType; title: string; message: string }
> = {
  [ReminderType.WATER]: {
    icon: FiDroplet,
    title: 'Hydration Reminder',
    message: 'Time to drink a glass of water to stay hydrated and focused!',
  },
  [ReminderType.EYE_CARE]: {
    icon: FiEye,
    title: 'Eye Care Break',
    message:
      'Look away from your screen for 20 seconds at something 20 feet away. The 20-20-20 rule helps reduce eye strain.',
  },
  [ReminderType.STRETCH]: {
    icon: FiRefreshCw,
    title: 'Time to Stretch',
    message:
      'Stand up, stretch your arms, legs, and back. A quick stretch can boost your energy and improve posture.',
  },
  [ReminderType.BREAK]: {
    icon: FiClock,
    title: 'Take a Short Break',
    message:
      'Step away from your work for a few minutes. A quick break can refresh your mind and improve productivity.',
  },
  [ReminderType.POSTURE]: {
    icon: FiArrowUpCircle,
    title: 'Posture Check',
    message: 'Sit up straight! A good posture prevents back pain and improves focus.',
  },
};

const ReminderModal: React.FC = () => {
  const reminderQueue = useWellnessStore(state => state.reminderQueue);
  const dismissReminder = useWellnessStore(state => state.dismissReminder);

  // The active reminder is always the first one in the queue.
  const activeReminder = reminderQueue[0] || null;

  if (!activeReminder) {
    return null;
  }

  const { icon: Icon, title, message } = reminderDetails[activeReminder];

  return (
    <div
      className="flex fixed inset-0 z-[6000] justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={dismissReminder}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
    >
      <div
        className="relative p-8 w-full max-w-md text-center bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl animate-fade-in-down"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={dismissReminder}
          className="absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:bg-white/10"
          aria-label="Close reminder"
        >
          <FiX size={24} />
        </button>

        {/* Queue indicator shows if more than one reminder is pending */}
        {reminderQueue.length > 1 && (
          <div className="absolute top-4 left-4 px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
            {reminderQueue.length} Reminders Queued
          </div>
        )}

        <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 text-blue-400 rounded-full border bg-blue-500/10 border-blue-500/20">
          <Icon size={48} />
        </div>
        <h2 id="reminder-modal-title" className="mb-4 text-2xl font-bold text-white">
          {title}
        </h2>
        <p className="mb-8 text-white/80">{message}</p>
        <button
          onClick={dismissReminder}
          className="px-8 py-3 font-semibold text-black bg-white rounded-full transition-colors cursor-pointer hover:bg-white/90"
        >
          {/* Button text changes if more reminders are in the queue */}
          {reminderQueue.length > 1 ? 'Next Reminder' : 'Got it!'}
        </button>
      </div>
    </div>
  );
};

export default ReminderModal;
