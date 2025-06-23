// app/components/dashboard/DashboardQuotes.tsx
'use client';

import { quotes as allQuotes } from '@/data/quotes';
import { AppState, Quote } from '@/types';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiLoader, FiRefreshCw, FiStar } from 'react-icons/fi';

// We now import specific functions from our new, focused service module.
import { addStarredQuote, removeStarredQuote } from '@/services/quoteService';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

// NEW: Import the common NoActiveGoalMessage component
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';

// The props interface remains the same as its parent (dashboard/page.tsx) is not yet refactored.
interface DashboardQuotesProps {
  currentUser: User | null;
  appState: AppState | null;
  onAppStateUpdate: (newAppState: AppState) => void;
}

/**
 * DashboardQuotes Component
 *
 * Displays a "Quote of the Moment" and a list of starred quotes.
 * It has been refactored to use the new dedicated quoteService for all data operations.
 */
const DashboardQuotes: React.FC<DashboardQuotesProps> = ({
  currentUser,
  appState,
  onAppStateUpdate,
}) => {
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const showToast = useNotificationStore(state => state.showToast);

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const getNewRandomQuote = useCallback(() => {
    setIsFetchingNew(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setRandomQuote(allQuotes[randomIndex]);
      setIsFetchingNew(false);
    }, 300);
  }, []);

  useEffect(() => {
    getNewRandomQuote();
  }, [getNewRandomQuote]);

  const isCurrentQuoteStarred =
    randomQuote && activeGoal ? activeGoal.starredQuotes.includes(randomQuote.id) : false;

  const handleToggleStar = async () => {
    if (!currentUser || !activeGoal || !randomQuote || isUpdating) return;

    setIsUpdating(true);
    const { id: goalId } = activeGoal;
    const { uid } = currentUser;
    const { id: quoteId } = randomQuote;

    try {
      let updatedStarredQuoteIds: number[];
      if (isCurrentQuoteStarred) {
        await removeStarredQuote(uid, goalId, quoteId);
        updatedStarredQuoteIds = activeGoal.starredQuotes.filter(qId => qId !== quoteId);
        showToast('Quote unstarred.', 'info');
      } else {
        await addStarredQuote(uid, goalId, quoteId);
        updatedStarredQuoteIds = [...activeGoal.starredQuotes, quoteId];
        showToast('Quote starred!', 'success');
      }

      const newAppState = {
        ...appState!,
        goals: {
          ...appState!.goals,
          [goalId]: { ...activeGoal, starredQuotes: updatedStarredQuoteIds },
        },
      };
      onAppStateUpdate(newAppState);
    } catch (error) {
      console.error('Failed to update quote status:', error);
      showToast('Failed to update quote status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnstarFromList = async (quoteId: number) => {
    if (!currentUser || !activeGoal) return;

    setUpdatingId(quoteId);
    const { id: goalId } = activeGoal;
    const { uid } = currentUser;

    try {
      await removeStarredQuote(uid, goalId, quoteId);
      const updatedStarredQuoteIds = activeGoal.starredQuotes.filter(qId => qId !== quoteId);

      const newAppState = {
        ...appState!,
        goals: {
          ...appState!.goals,
          [goalId]: { ...activeGoal, starredQuotes: updatedStarredQuoteIds },
        },
      };
      onAppStateUpdate(newAppState);
      showToast('Quote unstarred.', 'info');
    } catch (error) {
      console.error('Failed to unstar quote from list:', error);
      showToast('Failed to unstar quote.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const starButtonClasses = isCurrentQuoteStarred
    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
    : 'bg-white/10 text-white hover:bg-white/20';
  const starButtonIcon = isCurrentQuoteStarred ? <FiStar fill="currentColor" /> : <FiStar />;
  const starButtonText = isCurrentQuoteStarred ? 'Starred' : 'Star this Quote';

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <section className="space-y-12">
      <div className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-4 text-2xl font-bold">Quote of the Moment</h3>
        {randomQuote ? (
          <>
            <p className="mb-4 text-xl italic text-white/80">&quot;{randomQuote.text}&quot;</p>
            <p className="font-semibold text-white/60">- {randomQuote.author}</p>
            <div className="flex flex-col gap-4 justify-center mt-8 sm:flex-row">
              <button
                onClick={getNewRandomQuote}
                disabled={isFetchingNew}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-white/10 hover:bg-white/20 disabled:opacity-50"
              >
                {isFetchingNew ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiRefreshCw />}{' '}
                New Quote
              </button>
              <button
                onClick={handleToggleStar}
                disabled={isUpdating}
                className={`inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${starButtonClasses}`}
              >
                {isUpdating ? <FiLoader className="w-5 h-5 animate-spin" /> : starButtonIcon}{' '}
                <span>{starButtonText}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center py-10">
            <FiLoader className="w-8 h-8 animate-spin text-white/60" />
          </div>
        )}
      </div>

      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-center">Your Starred Quotes</h3>
        {activeGoal.starredQuotes && activeGoal.starredQuotes.length > 0 ? (
          <ul className="space-y-4">
            {allQuotes
              .filter(quote => activeGoal.starredQuotes.includes(quote.id))
              .map(quote => (
                <li
                  key={quote.id}
                  className="flex flex-col justify-between p-4 rounded-lg sm:flex-row sm:items-center bg-white/5"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="italic text-white/90">&quot;{quote.text}&quot;</p>
                    <p className="mt-1 text-sm font-medium text-white/60">- {quote.author}</p>
                  </div>
                  <button
                    onClick={() => handleUnstarFromList(quote.id)}
                    className="self-end p-2 text-yellow-400 rounded-full transition-colors sm:self-center hover:bg-yellow-500/10 disabled:opacity-50"
                    disabled={updatingId === quote.id}
                  >
                    {updatingId === quote.id ? (
                      <FiLoader className="w-5 h-5 animate-spin" />
                    ) : (
                      <FiStar fill="currentColor" />
                    )}
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-center text-white/60">
            Your favorite quotes will appear here once you star them for this goal.
          </p>
        )}
      </div>
    </section>
  );
};

export default DashboardQuotes;
