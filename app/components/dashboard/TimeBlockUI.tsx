// app/components/dashboard/TimeBlockUI.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRoutineStore } from '@/store/useRoutineStore';
import { useTimeBlockStore } from '@/store/useTimeBlockStore';
import { ScheduledRoutineBase, TimeBlock, UserRoutineSettings } from '@/types';
import {
  addMinutes,
  format,
  getHours,
  getMinutes,
  isAfter,
  isWithinInterval,
  parse,
} from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { FaTeeth, FaTooth } from 'react-icons/fa6';
import {
  FiCheck,
  FiClock,
  FiEdit,
  FiLoader,
  FiMoon,
  FiPlus,
  FiTrash2,
  FiZap,
} from 'react-icons/fi';
import {
  MdOutlineAccessTime,
  MdOutlineCake,
  MdOutlineCleaningServices,
  MdOutlineCookie,
  MdOutlineDirectionsBike,
  MdOutlineDirectionsRun,
  MdOutlineFastfood,
  MdOutlineFitnessCenter,
  MdOutlineHealthAndSafety,
  MdOutlineHotTub,
  MdOutlineIcecream,
  MdOutlineKebabDining,
  MdOutlineLiquor,
  MdOutlineLocalBar,
  MdOutlineLocalCafe,
  MdOutlineLocalDining,
  MdOutlineLocalPizza,
  MdOutlineNightlight,
  MdOutlinePool,
  MdOutlineRamenDining,
  MdOutlineRestaurantMenu,
  MdOutlineSentimentSatisfied,
  MdOutlineSetMeal,
  MdOutlineShower,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
  MdOutlineWash,
  MdOutlineWbSunny,
} from 'react-icons/md';
import TimeBlockModal from './TimeBlockModal';

const isColorDark = (hexColor: string) => {
  if (!hexColor) return false;
  const color = hexColor.startsWith('#') ? hexColor.substring(1) : hexColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp < 127.5;
};

const routineIconMap: { [key: string]: React.ElementType } = {
  MdOutlineDirectionsRun,
  MdOutlineFitnessCenter,
  MdOutlineSportsHandball,
  MdOutlineSportsSoccer,
  MdOutlineDirectionsBike,
  MdOutlineShower,
  MdOutlineHotTub,
  MdOutlinePool,
  MdOutlineWash,
  MdOutlineLocalCafe,
  MdOutlineFastfood,
  MdOutlineLocalPizza,
  MdOutlineIcecream,
  MdOutlineCake,
  MdOutlineRestaurantMenu,
  MdOutlineRamenDining,
  MdOutlineKebabDining,
  MdOutlineLiquor,
  MdOutlineCookie,
  MdOutlineLocalDining,
  MdOutlineSetMeal,
  MdOutlineLocalBar,
  MdOutlineSentimentSatisfied,
  MdOutlineCleaningServices,
  MdOutlineHealthAndSafety,
  FaTeeth,
  FaTooth,
  MdOutlineAccessTime,
  MdOutlineWbSunny,
  MdOutlineNightlight,
};

// Color mapping for different routine types
const routineTypeColors: { [key: string]: { border: string; icon: string; bg: string } } = {
  bath: { border: 'border-cyan-500/70', icon: 'text-cyan-300', bg: 'bg-cyan-900/50' },
  exercise: { border: 'border-orange-500/70', icon: 'text-orange-300', bg: 'bg-orange-900/50' },
  meal: { border: 'border-lime-500/70', icon: 'text-lime-300', bg: 'bg-lime-900/50' },
  teeth: { border: 'border-sky-500/70', icon: 'text-sky-300', bg: 'bg-sky-900/50' },
  'sleep.naps': { border: 'border-indigo-500/70', icon: 'text-indigo-300', bg: 'bg-indigo-900/50' },
  default: { border: 'border-gray-500/70', icon: 'text-gray-300', bg: 'bg-gray-800/50' },
};

type RoutineWithType = ScheduledRoutineBase & { type: keyof UserRoutineSettings | 'sleep.naps' };

const TimeBlockUI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockToEdit, setBlockToEdit] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [updatingBlockId, setUpdatingBlockId] = useState<string | null>(null);
  const [updatingRoutineId, setUpdatingRoutineId] = useState<string | null>(null);

  const { appState } = useGoalStore();
  const { addTimeBlock, deleteTimeBlock, updateTimeBlock } = useTimeBlockStore();
  const { updateRoutineSettings } = useRoutineStore();
  const { showToast, showConfirmation } = useNotificationStore();

  const activeGoal = appState?.goals[appState.activeGoalId || ''];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sortedTimeBlocks = useMemo(() => {
    if (!activeGoal?.timeBlocks) return [];
    return [...activeGoal.timeBlocks].sort((a, b) => {
      const timeA = parse(a.startTime, 'HH:mm', new Date());
      const timeB = parse(b.startTime, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [activeGoal?.timeBlocks]);

  const sortedRoutines: RoutineWithType[] = useMemo(() => {
    if (!activeGoal?.routineSettings) return [];
    const allRoutines: RoutineWithType[] = [];
    const { bath, exercise, meal, teeth, sleep } = activeGoal.routineSettings;

    (bath || []).forEach(r => allRoutines.push({ ...r, type: 'bath' }));
    (exercise || []).forEach(r => allRoutines.push({ ...r, type: 'exercise' }));
    (meal || []).forEach(r => allRoutines.push({ ...r, type: 'meal' }));
    (teeth || []).forEach(r => allRoutines.push({ ...r, type: 'teeth' }));
    (sleep?.naps || []).forEach(r => allRoutines.push({ ...r, type: 'sleep.naps' }));

    return allRoutines.sort((a, b) => {
      const timeA = parse(a.time, 'HH:mm', new Date());
      const timeB = parse(b.time, 'HH:mm', new Date());
      return timeA.getTime() - timeB.getTime();
    });
  }, [activeGoal?.routineSettings]);

  const sleepScheduleBlock = useMemo(() => {
    if (!activeGoal?.routineSettings?.sleep) return null;
    const { sleepTime, wakeTime } = activeGoal.routineSettings.sleep;
    const sleepDate = parse(sleepTime, 'HH:mm', new Date());
    const wakeDate = parse(wakeTime, 'HH:mm', new Date());

    if (isAfter(sleepDate, wakeDate)) {
      return {
        part1: { startTime: '00:00', endTime: wakeTime },
        part2: { startTime: sleepTime, endTime: '23:59' },
      };
    }
    return { part1: { startTime: sleepTime, endTime: wakeTime }, part2: null };
  }, [activeGoal?.routineSettings?.sleep]);

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

    const isOverlapping = sortedTimeBlocks.some(block => {
      if (id && block.id === id) return false;
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
      await updateTimeBlock(id, data);
      showToast('Time block updated!', 'success');
    } else {
      await addTimeBlock(data.label, data.startTime, data.endTime, data.color);
      showToast('Time block added!', 'success');
    }
    setIsModalOpen(false);
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

  const handleDeleteBlock = (block: TimeBlock) => {
    showConfirmation({
      title: 'Delete Time Block?',
      message: `Are you sure you want to delete the time block "${block.label}"? This action cannot be undone.`,
      action: async () => {
        setUpdatingBlockId(block.id);
        try {
          await deleteTimeBlock(block.id);
          showToast('Time block deleted.', 'info');
        } catch {
          showToast('Failed to delete time block.', 'error');
        } finally {
          setUpdatingBlockId(null);
        }
      },
    });
  };

  const handleToggleRoutineComplete = async (routine: RoutineWithType) => {
    if (!activeGoal?.routineSettings) return;
    setUpdatingRoutineId(routine.id);

    const newSettings: UserRoutineSettings = {
      ...activeGoal.routineSettings,
      bath: [...(activeGoal.routineSettings.bath || [])],
      exercise: [...(activeGoal.routineSettings.exercise || [])],
      meal: [...(activeGoal.routineSettings.meal || [])],
      teeth: [...(activeGoal.routineSettings.teeth || [])],
      sleep: activeGoal.routineSettings.sleep
        ? {
            ...activeGoal.routineSettings.sleep,
            naps: [...(activeGoal.routineSettings.sleep.naps || [])],
          }
        : null,
    };

    const routineType = routine.type;

    const toggle = (r: ScheduledRoutineBase): ScheduledRoutineBase => ({
      ...r,
      completed: !r.completed,
      completedAt: !r.completed ? Timestamp.now() : null,
      updatedAt: Timestamp.now(),
    });

    if (routineType === 'sleep.naps') {
      if (newSettings.sleep) {
        newSettings.sleep.naps = newSettings.sleep.naps.map(r =>
          r.id === routine.id ? toggle(r) : r
        );
      }
    } else {
      const key = routineType as keyof Omit<
        UserRoutineSettings,
        'sleep' | 'water' | 'lastRoutineResetDate'
      >;
      if (newSettings[key]) {
        (newSettings[key] as ScheduledRoutineBase[]) = (
          newSettings[key] as ScheduledRoutineBase[]
        ).map((r: ScheduledRoutineBase) => (r.id === routine.id ? toggle(r) : r));
      }
    }

    try {
      await updateRoutineSettings(newSettings);
    } catch {
      showToast('Failed to update routine status.', 'error');
    } finally {
      setUpdatingRoutineId(null);
    }
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const startMinutes = getHours(start) * 60 + getMinutes(start);
    let endMinutes = getHours(end) * 60 + getMinutes(end);
    if (endMinutes === 0 && endTime === '23:59') endMinutes = 24 * 60 - 1;
    else if (endMinutes === 0) endMinutes = 24 * 60;

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

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border shadow-2xl bg-bg-secondary border-border-primary">
        <div className="flex justify-between items-center p-6 border-b border-border-primary">
          <h2 className="flex gap-3 items-center text-xl font-bold text-text-primary">
            <FiClock size={24} />
            Daily Timeline
          </h2>
          <button
            onClick={() => handleOpenModal(null)}
            className="flex justify-center items-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
            aria-label="Add new time block"
            title="Add new time block"
          >
            <FiPlus size={20} />
          </button>
        </div>
        <div className="p-6 pl-12">
          <div className="flex" style={{ height: '2880px' }}>
            <div className="relative pr-4 text-xs text-right text-text-muted">
              {Array.from({ length: 25 }).map((_, hour) => (
                <div
                  key={`hour-label-${hour}`}
                  className="absolute right-4 font-bold transform -translate-y-1/2 text-text-tertiary"
                  style={{ top: `${(hour / 24) * 100}%` }}
                >
                  {hour === 24 ? '' : `${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
            <div className="grid relative flex-grow grid-cols-2 gap-2 rounded-lg bg-bg-tertiary">
              <div className="relative h-full">
                {Array.from({ length: 143 }).map((_, i) => (
                  <div
                    key={`line-block-${i}`}
                    className={`absolute w-full border-t ${
                      (i + 1) % 6 === 0
                        ? 'border-border-primary'
                        : 'border-dashed border-border-primary/50'
                    }`}
                    style={{ top: `${((i + 1) / 144) * 100}%` }}
                  ></div>
                ))}
                {sortedTimeBlocks.map(block => {
                  const isCompleted = block.completed;
                  const isUpdating = updatingBlockId === block.id;
                  const start = parse(block.startTime, 'HH:mm', new Date());
                  const end = parse(block.endTime, 'HH:mm', new Date());
                  const isActive = !isCompleted && isWithinInterval(currentTime, { start, end });

                  const textColor = isCompleted
                    ? 'text-green-800 dark:text-green-200'
                    : isColorDark(block.color)
                      ? 'text-white'
                      : 'text-black';
                  const blockBgColor = isCompleted ? 'rgba(34, 197, 94, 0.2)' : block.color;
                  let blockBorderStyle = isCompleted ? 'border-green-500' : 'border-transparent';
                  if (isActive)
                    blockBorderStyle += ' ring-2 ring-yellow-400 ring-offset-bg-tertiary';

                  return (
                    <div
                      key={block.id}
                      className={`absolute left-0 w-full p-2 rounded-lg transition-all duration-300 border-2 group ${blockBorderStyle} ${
                        isActive ? 'animate-pulse' : ''
                      }`}
                      style={{
                        ...calculatePosition(block.startTime, block.endTime),
                        backgroundColor: blockBgColor,
                      }}
                    >
                      <div
                        className={`flex relative justify-between items-start h-full ${textColor}`}
                      >
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
                            className={`p-1 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isColorDark(block.color)
                                  ? 'text-white/70 hover:bg-white/20'
                                  : 'text-black/70 hover:bg-black/20'
                            }`}
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
                            className={`p-1 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                              isColorDark(block.color)
                                ? 'text-white/70 hover:bg-white/20'
                                : 'text-black/70 hover:bg-black/20'
                            }`}
                            disabled={isUpdating}
                          >
                            <FiEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block)}
                            className={`p-1 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                              isColorDark(block.color)
                                ? 'text-white/50 hover:bg-white/20'
                                : 'text-black/50 hover:bg-black/20'
                            }`}
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
              <div className="relative h-full">
                {sleepScheduleBlock?.part1 && (
                  <div
                    className="absolute left-0 p-2 w-full rounded-lg border-2 bg-indigo-900/50 border-indigo-500/50"
                    style={{
                      ...calculatePosition(
                        sleepScheduleBlock.part1.startTime,
                        sleepScheduleBlock.part1.endTime
                      ),
                    }}
                  >
                    <div className="flex justify-center items-center h-full text-indigo-300">
                      <FiMoon size={18} />
                    </div>
                  </div>
                )}
                {sleepScheduleBlock?.part2 && (
                  <div
                    className="absolute left-0 p-2 w-full rounded-lg border-2 bg-indigo-900/50 border-indigo-500/50"
                    style={{
                      ...calculatePosition(
                        sleepScheduleBlock.part2.startTime,
                        sleepScheduleBlock.part2.endTime
                      ),
                    }}
                  >
                    <div className="flex justify-center items-center h-full text-indigo-300">
                      <FiMoon size={18} />
                    </div>
                  </div>
                )}
                {sortedRoutines.map(routine => {
                  const RoutineIcon = routineIconMap[routine.icon] || FiZap;
                  const routineStartTime = parse(routine.time, 'HH:mm', new Date());
                  const routineEndTimeDate = addMinutes(routineStartTime, routine.duration);
                  const routineEndTime = format(routineEndTimeDate, 'HH:mm');
                  const isActive =
                    !routine.completed &&
                    isWithinInterval(currentTime, {
                      start: routineStartTime,
                      end: routineEndTimeDate,
                    });
                  const isUpdating = updatingRoutineId === routine.id;

                  const colorConfig = routineTypeColors[routine.type] || routineTypeColors.default;

                  let routineBorderStyle = routine.completed
                    ? 'border-green-500/70 bg-green-900/50'
                    : `${colorConfig.border} ${colorConfig.bg}`;
                  if (isActive)
                    routineBorderStyle += ' ring-2 ring-yellow-400 ring-offset-bg-tertiary';

                  return (
                    <div
                      key={routine.id}
                      className={`absolute left-0 w-full p-2 rounded-lg transition-all duration-300 border-2 group backdrop-blur-sm ${routineBorderStyle} ${
                        isActive ? 'animate-pulse' : ''
                      }`}
                      style={{ ...calculatePosition(routine.time, routineEndTime) }}
                    >
                      <div
                        className={`flex justify-between items-center h-full text-xs truncate ${
                          routine.completed ? 'text-green-300 line-through' : 'text-gray-300'
                        }`}
                      >
                        <div className="flex gap-2 items-center">
                          <RoutineIcon
                            size={16}
                            className={routine.completed ? 'text-green-300' : colorConfig.icon}
                          />
                          <span>{`${routine.label} (${routine.duration} min) - ${routine.time}`}</span>
                        </div>
                        <div className="flex gap-1 items-center opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleToggleRoutineComplete(routine)}
                            disabled={isUpdating}
                            className={`p-1 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                              routine.completed
                                ? 'bg-green-500 text-white'
                                : 'text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            {isUpdating ? (
                              <FiLoader className="animate-spin" size={14} />
                            ) : routine.completed ? (
                              <FiCheck size={14} />
                            ) : (
                              <div className="w-3.5 h-3.5 border-2 rounded-full border-current"></div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="absolute left-0 w-full h-0.5 bg-red-500 z-10"
                style={{ top: currentTimePosition() }}
              >
                <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
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
