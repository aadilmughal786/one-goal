// app/components/dashboard/DashboardQuotes.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { AppState, Quote } from '@/types'; // Import AppState and Quote from global types
import { firebaseService } from '@/services/firebaseService';
import { quotes as allQuotes } from '@/data/quotes'; // Assuming quotes data is correctly imported
import { FiStar, FiRefreshCw, FiLoader } from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md'; // Import for "Set Goal" icon
import Link from 'next/link'; // Import Link for navigation to dashboard

interface DashboardQuotesProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

/**
 * DashboardQuotes Component
 *
 * Displays a "Quote of the Moment" with options to get a new random quote
 * and star/unstar it. It also shows a list of all user's starred quotes
 * for the currently active goal. Integrates with Firebase to persist starred quotes.
 */
const DashboardQuotes: React.FC<DashboardQuotesProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false); // For the main star/unstar button
  const [isFetchingNew, setIsFetchingNew] = useState(false); // For the "New Quote" button
  const [updatingId, setUpdatingId] = useState<number | null>(null); // For unstarring from the list

  // Get the currently active goal from appState
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  // Gets a random quote from the entire list with a delay for the loader
  const getNewRandomQuote = useCallback(() => {
    setIsFetchingNew(true); // Activate fetching loader
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setRandomQuote(allQuotes[randomIndex]); // Set a new random quote
      setIsFetchingNew(false); // Deactivate fetching loader
    }, 300); // 300ms delay to make loader visible for better UX
  }, []); // No dependencies, runs once on mount

  // Set initial random quote when the component mounts.
  useEffect(() => {
    getNewRandomQuote();
  }, [getNewRandomQuote]); // Dependency array to ensure it runs only when getNewRandomQuote is stable.

  // Determine if the currently displayed random quote is starred by the user for the active goal.
  const isCurrentQuoteStarred =
    randomQuote && activeGoal
      ? activeGoal.starredQuotes.some(qId => qId === randomQuote.id)
      : false;

  /**
   * Handles starring or unstarring the currently displayed random quote for the active goal.
   * Updates Firebase and local AppState using `addStarredQuote` or `removeStarredQuote`.
   */
  const handleToggleStar = async () => {
    // Prevent action if conditions are not met
    if (!currentUser) {
      showMessage('You must be logged in to star quotes.', 'error');
      return;
    }
    if (!activeGoal) {
      showMessage('Please select an active goal to star quotes.', 'error');
      return;
    }
    if (!randomQuote || isUpdating) {
      // If randomQuote is null or already updating, do nothing
      return;
    }

    setIsUpdating(true); // Activate updating loader for the main button
    const currentlyStarred = activeGoal.starredQuotes.some(qId => qId === randomQuote.id);
    let updatedStarredQuoteIds: number[]; // Will hold the new array of IDs

    try {
      if (currentlyStarred) {
        // If currently starred, call removeStarredQuote
        await firebaseService.removeStarredQuote(activeGoal.id, currentUser.uid, randomQuote.id);
        updatedStarredQuoteIds = activeGoal.starredQuotes.filter(qId => qId !== randomQuote.id);
      } else {
        // If not starred, call addStarredQuote
        await firebaseService.addStarredQuote(activeGoal.id, currentUser.uid, randomQuote.id);
        updatedStarredQuoteIds = [...activeGoal.starredQuotes, randomQuote.id];
      }

      // Construct the new AppState with the updated starredQuotes for the active goal
      const newAppState = {
        ...appState!, // Assuming appState is not null here due to preceding checks
        goals: {
          ...appState!.goals,
          [activeGoal.id]: {
            ...activeGoal,
            starredQuotes: updatedStarredQuoteIds,
          },
        },
      };

      // Update the parent's AppState for immediate UI reflection
      onAppStateUpdate(newAppState);

      // Show appropriate toast message
      showMessage(
        currentlyStarred ? 'Quote unstarred.' : 'Quote starred!',
        currentlyStarred ? 'info' : 'success'
      );
    } catch (error) {
      console.error('Failed to update quote status:', error);
      showMessage('Failed to update quote status.', 'error');
    } finally {
      setIsUpdating(false); // Deactivate updating loader
    }
  };

  /**
   * Handles unstarring a quote directly from the "Your Starred Quotes" list for the active goal.
   * Uses `removeStarredQuote` from Firebase service.
   * @param quoteId The ID of the quote to unstar.
   */
  const handleUnstarFromList = async (quoteId: number) => {
    // Prevent action if conditions are not met
    if (!currentUser) {
      showMessage('You must be logged in to unstar quotes.', 'error');
      return;
    }
    if (!activeGoal) {
      showMessage('Please select an active goal to unstar quotes.', 'error');
      return;
    }

    setUpdatingId(quoteId); // Set updating ID for the specific list item's loader
    let updatedStarredQuoteIds: number[];

    try {
      // Call Firebase service to remove the starred quote ID
      await firebaseService.removeStarredQuote(activeGoal.id, currentUser.uid, quoteId);
      updatedStarredQuoteIds = activeGoal.starredQuotes.filter(qId => qId !== quoteId);

      // Construct the new AppState with the updated starredQuotes for the active goal
      const newAppState = {
        ...appState!,
        goals: {
          ...appState!.goals,
          [activeGoal.id]: {
            ...activeGoal,
            starredQuotes: updatedStarredQuoteIds,
          },
        },
      };

      // Update the parent's AppState for immediate UI reflection
      onAppStateUpdate(newAppState);

      showMessage('Quote unstarred.', 'info');
    } catch (error) {
      console.error('Failed to unstar quote from list:', error);
      showMessage('Failed to unstar quote.', 'error');
    } finally {
      setUpdatingId(null); // Deactivate updating loader for the list item
    }
  };

  // Dynamic classes for the main star button based on its starred status
  const starButtonClasses = isCurrentQuoteStarred
    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
    : 'bg-white/10 text-white hover:bg-white/20';

  // Dynamic icon for the main star button (filled if starred, outlined if not)
  const starButtonIcon = isCurrentQuoteStarred ? <FiStar fill="currentColor" /> : <FiStar />;

  // Dynamic text for the main star button
  const starButtonText = isCurrentQuoteStarred ? 'Starred' : 'Star this Quote';

  // If no active goal is selected, display a message guiding the user.
  if (!activeGoal) {
    return (
      <div className="p-10 text-center text-white/60 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <MdRocketLaunch className="mx-auto mb-4 text-4xl" />
        <p>Please select an active goal from your Dashboard to manage your starred quotes.</p>
        {/* Link to dashboard for user guidance */}
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 mt-4 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-12">
      {/* Random Quote Display Section */}
      <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-4 text-2xl font-bold">Quote of the Moment</h3>
        {randomQuote ? (
          <>
            <p className="mb-4 text-xl italic text-white/80">&quot;{randomQuote.text}&quot;</p>
            <p className="font-semibold text-white/60">- {randomQuote.author}</p>

            <div className="flex flex-col gap-4 justify-center mt-8 sm:flex-row">
              {/* New Quote Button */}
              <button
                onClick={getNewRandomQuote}
                disabled={isFetchingNew}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20 disabled:opacity-50"
                aria-label="Get a new random quote"
              >
                {isFetchingNew ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiRefreshCw />}
                New Quote
              </button>
              {/* Star/Unstar Quote Button */}
              <button
                onClick={handleToggleStar}
                disabled={isUpdating}
                className={`inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${starButtonClasses}`}
                aria-label={isCurrentQuoteStarred ? 'Unstar this quote' : 'Star this quote'}
              >
                {isUpdating ? <FiLoader className="w-5 h-5 animate-spin" /> : starButtonIcon}
                <span>{starButtonText}</span>
              </button>
            </div>
          </>
        ) : (
          // Skeleton loader when a random quote is being fetched
          <div className="flex justify-center items-center py-10">
            <FiLoader className="w-8 h-8 animate-spin text-white/60" />
          </div>
        )}
      </div>

      {/* Starred Quotes Section */}
      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-center">Your Starred Quotes</h3>
        {/* Only render the list if activeGoal.starredQuotes exists and has length > 0 */}
        {activeGoal.starredQuotes && activeGoal.starredQuotes.length > 0 ? (
          <ul className="space-y-4">
            {/* Filter allQuotes by IDs stored in activeGoal.starredQuotes.
                This is how we retrieve the full Quote objects based on their IDs. */}
            {allQuotes
              .filter(quote => activeGoal.starredQuotes.includes(quote.id))
              .map(quote => (
                <li
                  key={quote.id} // Unique key for list items
                  className="flex flex-col justify-between p-4 rounded-lg sm:flex-row sm:items-center bg-white/5"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="italic text-white/90">&quot;{quote.text}&quot;</p>
                    <p className="mt-1 text-sm font-medium text-white/60">- {quote.author}</p>
                  </div>
                  <button
                    onClick={() => handleUnstarFromList(quote.id)}
                    className="self-end p-2 text-yellow-400 rounded-full transition-colors sm:self-center hover:bg-yellow-500/10 disabled:opacity-50"
                    aria-label="Unstar quote"
                    disabled={updatingId === quote.id} // Disable button if this specific quote is updating
                  >
                    {updatingId === quote.id ? (
                      <FiLoader className="w-5 h-5 animate-spin" />
                    ) : (
                      <FiStar fill="currentColor" /> // Filled star icon for starred quotes in the list
                    )}
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          // Message when no quotes are starred for the active goal
          <p className="text-center text-white/60">
            Your favorite quotes will appear here once you star them for this goal.
          </p>
        )}
      </div>
    </section>
  );
};

export default DashboardQuotes;
