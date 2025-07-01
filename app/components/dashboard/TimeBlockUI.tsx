// app/components/time-block/TimeBlockUI.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { TimeBlock } from '@/types';
import { format, getHours, getMinutes, parse } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiClock, FiEdit, FiLoader, FiPlus, FiTrash2 } from 'react-icons/fi';
import TimeBlockModal from './TimeBlockModal'; // Import the modal

// Helper function to determine if a color is dark or light
const isColorDark = (hexColor: string) => {
  if (!hexColor) return false;
  const color = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp < 127.5;
};

const TimeBlockUI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockToEdit, setBlockToEdit] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);

  const { appState, addTimeBlock, deleteTimeBlock, updateTimeBlock } = useGoalStore();
  const showToast = useNotificationStore(state => state.showToast);
  const activeGoal = appState?.goals[appState.activeGoalId || ''];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const timeBlocks = useMemo(() => {
    if (!activeGoal?.timeBlocks) return [];
    return [...activeGoal.timeBlocks].sort((a, b) => {
      const timeA = parse(a.startTime, 'HH:mm', new Date());
      const timeB = parse(b.startTime, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [activeGoal?.timeBlocks]);

  const handleOpenModal = (block: TimeBlock | null) => {
    setBlockToEdit(block);
    setIsModalOpen(true);
  };

  const handleSaveBlock = async (
    data: { label: string; startTime: string; endTime: string; color: string },
    id: string | null
  ) => {
    const newStartMinutes =
      getHours(parse(data.startTime, 'HH:mm', new Date())) * 60 +
      getMinutes(parse(data.startTime, 'HH:mm', new Date()));
    const newEndMinutes =
      getHours(parse(data.endTime, 'HH:mm', new Date())) * 60 +
      getMinutes(parse(data.endTime, 'HH:mm', new Date()));

    const isOverlapping = timeBlocks.some(block => {
      if (id && block.id === id) return false; // Don't check against itself when editing
      const existingStart = parse(block.startTime, 'HH:mm', new Date());
      const existingEnd = parse(block.endTime, 'HH:mm', new Date());
      const existingStartMinutes = getHours(existingStart) * 60 + getMinutes(existingStart);
      const existingEndMinutes = getHours(existingEnd) * 60 + getMinutes(existingEnd);
      return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes;
    });

    if (isOverlapping) {
      showToast('This time block overlaps with an existing one.', 'error');
      return;
    }

    if (id) {
      // Editing existing block
      await updateTimeBlock(id, data);
      showToast('Time block updated!', 'success');
    } else {
      // Adding new block
      await addTimeBlock(data.label, data.startTime, data.endTime, data.color);
      showToast('Time block added!', 'success');
    }
  };

  const handleToggleComplete = async (block: TimeBlock) => {
    setUpdatingBlockId(block.id);
    try {
      await updateTimeBlock(block.id, {
        completed: !block.completed,
        completedAt: !block.completed ? Timestamp.now() : null,
      });
    } finally {
      setUpdatingBlockId(null);
    }
  };

  const calculateBlockPosition = (block: TimeBlock) => {
    const start = parse(block.startTime, 'HH:mm', new Date());
    const end = parse(block.endTime, 'HH:mm', new Date());
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    const endMinutes = getHours(end) * 60 + getMinutes(end);
    const duration = endMinutes - startMinutes;

    const top = (startMinutes / (24 * 60)) * 100;
    const height = (duration / (24 * 60)) * 100;

    return { top: `${top}%`, height: `${height}%` };
  };

  const currentTimePosition = () => {
    const now = currentTime;
    const totalMinutes = getHours(now) * 60 + getMinutes(now);
    return `${(totalMinutes / (24 * 60)) * 100}%`;
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="flex gap-3 items-center text-2xl font-bold text-white">
            <FiClock size={28} />
            Daily Timeline
          </h2>
          <button
            onClick={() => handleOpenModal(null)}
            className="flex justify-center items-center w-12 h-12 text-black bg-white rounded-full transition-all duration-200 hover:bg-white/90 hover:scale-110"
            aria-label="Add new time block"
            title="Add new time block"
          >
            <FiPlus size={24} />
          </button>
        </div>
        <div className="flex" style={{ height: '720px' }}>
          {/* Hour Labels */}
          <div className="flex flex-col pr-4 text-xs text-right text-white/50">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 -mt-2 h-10 first:mt-0">
                {`${i.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {/* Timeline */}
          <div className="relative flex-grow rounded-lg bg-black/20">
            {/* Hour Lines */}
            {Array.from({ length: 23 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-dashed border-white/20"
                style={{ top: `${((i + 1) / 24) * 100}%` }}
              ></div>
            ))}
            {/* Current Time Indicator */}
            <div
              className="absolute left-0 w-full h-0.5 bg-red-500 z-10"
              style={{ top: currentTimePosition() }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            {/* Scheduled Blocks */}
            {timeBlocks.map(block => {
              const isCompleted = block.completed;
              const isUpdating = updatingBlockId === block.id;
              const textColor = isCompleted
                ? 'text-green-200'
                : isColorDark(block.color)
                  ? 'text-white'
                  : 'text-black';
              const blockBgColor = isCompleted ? 'rgba(34, 197, 94, 0.2)' : block.color;
              const blockBorderStyle = isCompleted ? 'border-green-500' : 'border-transparent';

              return (
                <div
                  key={block.id}
                  className={`absolute left-0 p-2 w-full rounded-lg border-2 transition-all duration-300 group ${blockBorderStyle}`}
                  style={{
                    ...calculateBlockPosition(block),
                    backgroundColor: blockBgColor,
                  }}
                >
                  <div className={`flex relative justify-between items-start h-full ${textColor}`}>
                    <div
                      className={`text-xs font-bold truncate ${isCompleted ? 'line-through' : ''}`}
                    >
                      <p>{block.label}</p>
                      <p className="font-normal">
                        {format(parse(block.startTime, 'HH:mm', new Date()), 'h:mm a')} -{' '}
                        {format(parse(block.endTime, 'HH:mm', new Date()), 'h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-1 items-center opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleToggleComplete(block)}
                        disabled={isUpdating}
                        className={`p-1 rounded-full transition-colors ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isColorDark(block.color)
                              ? 'text-white/70 hover:bg-white/20'
                              : 'text-black/70 hover:bg-black/20'
                        } ${isUpdating ? 'cursor-not-allowed' : ''}`}
                      >
                        {isUpdating ? (
                          <FiLoader className="animate-spin" size={14} />
                        ) : isCompleted ? (
                          <FiCheck size={14} />
                        ) : (
                          <div className="w-3.5 h-3.5 border-2 rounded-full border-current"></div>
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(block)}
                        className={`p-1 rounded-full ${isColorDark(block.color) ? 'text-white/70 hover:bg-white/20' : 'text-black/70 hover:bg-black/20'}`}
                        disabled={isUpdating}
                      >
                        <FiEdit size={12} />
                      </button>
                      <button
                        onClick={() => deleteTimeBlock(block.id)}
                        className={`p-1 rounded-full ${isColorDark(block.color) ? 'text-white/50 hover:bg-white/20' : 'text-black/50 hover:bg-black/20'}`}
                        disabled={isUpdating}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TimeBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlock}
        blockToEdit={blockToEdit}
      />
    </div>
  );
};

export default TimeBlockUI;
