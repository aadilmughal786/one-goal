// app/(root)/archive/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import { ArchivedGoal } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { FiSearch, FiCalendar, FiClock, FiStar, FiList, FiCheckSquare } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import Fuse from 'fuse.js';
import ArchivedGoalModal from '@/components/archive/ArchivedGoalModal';

const ArchiveCard = ({
  archivedGoal,
  onCardClick,
}: {
  archivedGoal: ArchivedGoal;
  onCardClick: () => void;
}) => {
  const { goal, dailyProgress, toDoList, notToDoList, contextList, archivedAt } = archivedGoal;

  const stats = useMemo(() => {
    if (!goal) {
      return {
        totalDays: 0,
        totalTimeSpentHours: 0,
        avgSatisfaction: 0,
        completedTasks: 0,
        totalTasks: 0,
        notToDoCount: 0,
        notesCount: 0,
      };
    }
    const startDate = goal.startDate.toDate();
    const endDate = goal.endDate.toDate();
    const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const progressEntries = Object.values(dailyProgress);
    const totalTimeSpentHours =
      progressEntries.reduce((sum, entry) => sum + (entry.effortTimeMinutes || 0), 0) / 60;
    const avgSatisfaction =
      progressEntries.length > 0
        ? progressEntries.reduce((sum, p) => sum + p.satisfactionLevel, 0) / progressEntries.length
        : 0;
    const completedTasks = toDoList.filter(t => t.completed).length;

    return {
      totalDays,
      totalTimeSpentHours,
      avgSatisfaction,
      completedTasks,
      totalTasks: toDoList.length,
      notToDoCount: notToDoList.length,
      notesCount: contextList.length,
    };
  }, [goal, dailyProgress, toDoList, notToDoList, contextList]);

  if (!goal) return null;

  return (
    <button
      onClick={onCardClick}
      className="w-full text-left p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg transition-all hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="pb-4 mb-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">{goal.name}</h3>
        <p className="mt-1 text-sm text-white/60">{goal.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div className="flex gap-2 items-center">
          <FiCalendar className="text-blue-400" />
          <span>
            {format(goal.startDate.toDate(), 'd MMM yy')} -{' '}
            {format(goal.endDate.toDate(), 'd MMM yy')}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <FiClock className="text-purple-400" />
          <span>{stats.totalTimeSpentHours.toFixed(1)} hrs logged</span>
        </div>
        <div className="flex gap-2 items-center">
          <FiStar className="text-yellow-400" />
          <span>{stats.avgSatisfaction.toFixed(1)}/5 avg satisfaction</span>
        </div>
        <div className="flex gap-2 items-center">
          <FiCheckSquare className="text-green-400" />
          <span>
            {stats.completedTasks}/{stats.totalTasks} tasks done
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <RiAlarmWarningLine className="text-red-400" />
          <span>{stats.notToDoCount} distractions</span>
        </div>
        <div className="flex gap-2 items-center">
          <FiList className="text-cyan-400" />
          <span>{stats.notesCount} notes</span>
        </div>
      </div>
      <div className="pt-4 mt-4 text-xs text-center border-t border-white/10 text-white/50">
        Archived on {format(archivedAt.toDate(), 'd MMMM, yyyy')}
      </div>
    </button>
  );
};

const ArchivePage = () => {
  const router = useRouter();
  const [, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [goalArchive, setGoalArchive] = useState<ArchivedGoal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArchives, setFilteredArchives] = useState<ArchivedGoal[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchivedGoal | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(goalArchive, {
        keys: ['goal.name', 'goal.description'],
        threshold: 0.4,
      }),
    [goalArchive]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService.getUserData(user.uid).then(data => {
          const sortedArchive = (data.goalArchive || []).sort(
            (a, b) => b.archivedAt.toMillis() - a.archivedAt.toMillis()
          );
          setGoalArchive(sortedArchive);
          setFilteredArchives(sortedArchive);
          setIsLoading(false);
        });
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredArchives(goalArchive);
      return;
    }
    const results = fuse.search(searchQuery);
    setFilteredArchives(results.map(result => result.item));
  }, [searchQuery, goalArchive, fuse]);

  if (isLoading) {
    return <div className="p-10 text-center">Loading archive...</div>;
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <div className="container p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Goal Archive</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              A legacy of your focus and dedication. Review your past achievements and the journeys
              you took.
            </p>
          </div>

          <div className="relative mb-8">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search archived goals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-3 pl-12 w-full text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-6">
            {filteredArchives.length > 0 ? (
              filteredArchives.map(archive => (
                <ArchiveCard
                  key={archive.archivedAt.toMillis()}
                  archivedGoal={archive}
                  onCardClick={() => setSelectedArchive(archive)}
                />
              ))
            ) : (
              <div className="p-10 text-center text-white/50">
                {searchQuery
                  ? 'No results found for your search.'
                  : 'Your archive is empty. Once you complete and archive a goal, it will appear here.'}
              </div>
            )}
          </div>
        </section>
      </div>
      <ArchivedGoalModal
        isOpen={!!selectedArchive}
        onClose={() => setSelectedArchive(null)}
        archivedGoal={selectedArchive}
      />
    </main>
  );
};

export default ArchivePage;
