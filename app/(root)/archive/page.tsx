// app/(root)/archive/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { firebaseService } from '@/services/firebaseService';
import { Goal, GoalStatus } from '@/types'; // Import Goal and GoalStatus
import { format, differenceInDays } from 'date-fns';
import { FiSearch, FiCalendar, FiClock, FiStar, FiCheckSquare } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { MdStickyNote2 } from 'react-icons/md'; // Import for Sticky Notes icon
import Fuse from 'fuse.js';
import GoalSummaryModal from '@/components/archive/GoalSummaryModal'; // Renamed import

/**
 * GoalSummaryCard Component
 * Displays a summary card for a single completed goal.
 */
const GoalSummaryCard = ({
  goal, // Now directly accepts a Goal object
  onCardClick,
}: {
  goal: Goal; // Type is Goal
  onCardClick: () => void;
}) => {
  // Destructure properties directly from the Goal object
  const {
    name,
    description,
    startDate,
    endDate,
    dailyProgress,
    toDoList,
    notToDoList,
    stickyNotes,
    status,
  } = goal;

  // Memoized statistics calculation for performance.
  const stats = useMemo(() => {
    const start = startDate.toDate();
    const end = endDate.toDate();
    const totalDays = Math.max(1, differenceInDays(end, start) + 1); // Ensure at least 1 day

    const progressEntries = Object.values(dailyProgress || {}); // Ensure it's an array

    // Calculate total time spent from StopwatchSession durations
    const totalTimeSpentHours =
      progressEntries.reduce((daySum, entry) => {
        // Sum durations (in milliseconds) from all sessions for each day
        const sessionDurationMs = (entry.sessions || []).reduce(
          (sessionSum, session) => sessionSum + session.duration, // Use 'duration' property
          0
        );
        return daySum + sessionDurationMs;
      }, 0) /
      (1000 * 60 * 60); // Convert total milliseconds to hours

    // Calculate average satisfaction from 'satisfaction' property
    const avgSatisfaction =
      progressEntries.length > 0
        ? progressEntries.reduce((sum, p) => sum + p.satisfaction, 0) / progressEntries.length
        : 0;

    const completedTasks = toDoList.filter(t => t.completed).length;

    return {
      totalDays,
      totalTimeSpentHours,
      avgSatisfaction,
      completedTasks,
      totalTasks: toDoList.length,
      notToDoCount: notToDoList.length,
      notesCount: stickyNotes.length, // Use stickyNotes.length for notes count
    };
  }, [startDate, endDate, dailyProgress, toDoList, notToDoList, stickyNotes]); // Dependencies

  return (
    <button
      onClick={onCardClick}
      className="w-full text-left p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg transition-all hover:border-white/20 hover:bg-white/[0.04]"
      aria-label={`View summary for goal: ${name}`}
    >
      <div className="pb-4 mb-4 border-b border-white/10">
        <h3 className="text-xl font-bold text-white">{name}</h3>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div className="flex gap-2 items-center">
          <FiCalendar className="text-blue-400" />
          <span>
            {format(startDate.toDate(), 'd MMM yy')} - {format(endDate.toDate(), 'd MMM yy')}
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
          <MdStickyNote2 className="text-cyan-400" /> {/* Changed icon for notes */}
          <span>{stats.notesCount} notes</span>
        </div>
      </div>
      <div className="pt-4 mt-4 text-xs text-center border-t border-white/10 text-white/50">
        {status === GoalStatus.COMPLETED // Display "Completed on" if status is COMPLETED
          ? `Completed on ${format(endDate.toDate(), 'd MMMM,yyyy')}`
          : `Ended on ${format(endDate.toDate(), 'd MMMM,yyyy')}`}{' '}
        {/* For goals that simply ended */}
      </div>
    </button>
  );
};

/**
 * ArchivePage Component
 * Displays a list of completed goals, allowing search and detailed summary viewing.
 */
const ArchivePage = () => {
  const router = useRouter();
  const [, setCurrentUser] = useState<User | null>(null); // State for current user
  const [isLoading, setIsLoading] = useState(true); // Loading state for the page
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]); // Renamed from goalArchive to completedGoals
  const [searchQuery, setSearchQuery] = useState(''); // Search input query
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]); // Renamed from filteredArchives
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null); // Renamed from selectedArchive

  // Fuse.js instance for fuzzy searching completed goals by name and description.
  const fuse = useMemo(
    () =>
      new Fuse(completedGoals, {
        // Use completedGoals for Fuse source
        keys: ['name', 'description'], // Search directly in Goal properties
        threshold: 0.4, // Adjust fuzziness as needed
      }),
    [completedGoals] // Re-initialize Fuse when completedGoals change
  );

  // Effect to handle user authentication and fetch completed goals.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        // Fetch all user data
        firebaseService
          .getUserData(user.uid)
          .then(appState => {
            // Filter goals by COMPLETED status
            const goals = Object.values(appState.goals || {});
            const sortedCompletedGoals = goals
              .filter(goal => goal.status === GoalStatus.COMPLETED)
              .sort((a, b) => b.endDate.toMillis() - a.endDate.toMillis()); // Sort by end date descending

            setCompletedGoals(sortedCompletedGoals);
            setFilteredGoals(sortedCompletedGoals); // Initialize filtered list with all completed goals
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Failed to load archived goals:', error);
            setIsLoading(false); // Ensure loading state is cleared
          });
      } else {
        router.push('/login'); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribe(); // Cleanup auth listener
  }, [router]); // Dependency on router

  // Effect to filter goals based on search query.
  useEffect(() => {
    if (!searchQuery) {
      setFilteredGoals(completedGoals); // If no search, show all completed goals
      return;
    }
    const results = fuse.search(searchQuery);
    setFilteredGoals(results.map(result => result.item)); // Update filtered list with search results
  }, [searchQuery, completedGoals, fuse]); // Dependencies for search filtering

  // Display loading message while data is being fetched.
  if (isLoading) {
    return <div className="p-10 text-center text-white/70">Loading your completed goals...</div>;
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <div className="container p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Your Completed Goals</h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              A legacy of your focus and dedication. Review your past achievements and the journeys
              you took.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              size={20}
            />
            <input
              type="text"
              placeholder="Search completed goals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-3 pl-12 w-full text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search completed goals"
            />
          </div>

          {/* Display Filtered Completed Goals */}
          <div className="space-y-6">
            {filteredGoals.length > 0 ? (
              filteredGoals.map(goal => (
                <GoalSummaryCard // Use GoalSummaryCard
                  key={goal.id} // Use goal.id as the key
                  goal={goal} // Pass the Goal object
                  onCardClick={() => setSelectedGoal(goal)} // Set selectedGoal for modal
                />
              ))
            ) : (
              <div className="p-10 text-center text-white/50">
                {searchQuery
                  ? 'No results found for your search.'
                  : 'You have no completed goals yet. Once you complete a goal, it will appear here!'}
              </div>
            )}
          </div>
        </section>
      </div>
      {/* Goal Summary Modal */}
      <GoalSummaryModal // Use GoalSummaryModal
        isOpen={!!selectedGoal}
        onClose={() => setSelectedGoal(null)}
        goal={selectedGoal} // Pass the selectedGoal
      />
    </main>
  );
};

export default ArchivePage;
