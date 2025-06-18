// app/(root)/dashboard/DashboardQuotes.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { AppState, Quote } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { quotes as allQuotes } from '@/data/quotes';
import { FiStar, FiRefreshCw, FiLoader } from 'react-icons/fi';

interface DashboardQuotesProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

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

  // Gets a random quote from the entire list with a delay for the loader
  const getNewRandomQuote = useCallback(() => {
    setIsFetchingNew(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setRandomQuote(allQuotes[randomIndex]);
      setIsFetchingNew(false);
    }, 300); // 300ms delay to make loader visible
  }, []);

  // Set initial quote on mount
  useEffect(() => {
    getNewRandomQuote();
  }, [getNewRandomQuote]);

  const isCurrentQuoteStarred = randomQuote
    ? appState?.starredQuotes.some(q => q.id === randomQuote.id)
    : false;

  const handleToggleStar = async () => {
    if (!currentUser || !appState || !randomQuote || isUpdating) return;

    setIsUpdating(true);
    const currentlyStarred = appState.starredQuotes.some(q => q.id === randomQuote.id);
    let newStarredQuotes: Quote[];

    if (currentlyStarred) {
      // Unstar the quote
      newStarredQuotes = appState.starredQuotes.filter(q => q.id !== randomQuote.id);
    } else {
      // Star the quote
      newStarredQuotes = [...appState.starredQuotes, randomQuote];
    }

    try {
      await firebaseService.updateStarredQuotes(currentUser.uid, newStarredQuotes);
      onAppStateUpdate({ ...appState, starredQuotes: newStarredQuotes });
      showMessage(
        currentlyStarred ? 'Quote unstarred.' : 'Quote starred!',
        currentlyStarred ? 'info' : 'success'
      );
    } catch {
      showMessage('Failed to update quote status.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnstarFromList = async (quoteId: number) => {
    if (!currentUser || !appState) return;

    setUpdatingId(quoteId);
    const newStarredQuotes = appState.starredQuotes.filter(q => q.id !== quoteId);
    try {
      await firebaseService.updateStarredQuotes(currentUser.uid, newStarredQuotes);
      onAppStateUpdate({ ...appState, starredQuotes: newStarredQuotes });
      showMessage('Quote unstarred.', 'info');
    } catch {
      showMessage('Failed to unstar quote.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Define dynamic classes and content for the star button
  const starButtonClasses = isCurrentQuoteStarred
    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
    : 'bg-white/10 text-white hover:bg-white/20';

  const starButtonIcon = isCurrentQuoteStarred ? <FiStar fill="currentColor" /> : <FiStar />;

  const starButtonText = isCurrentQuoteStarred ? 'Starred' : 'Star this Quote';

  return (
    <section className="space-y-12">
      {/* Random Quote Display */}
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
                {isFetchingNew ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiRefreshCw />}
                New Quote
              </button>
              <button
                onClick={handleToggleStar}
                disabled={isUpdating}
                className={`inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${starButtonClasses}`}
              >
                {isUpdating ? <FiLoader className="w-5 h-5 animate-spin" /> : starButtonIcon}
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

      {/* Starred Quotes Section */}
      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-center">Your Starred Quotes</h3>
        {appState?.starredQuotes && appState.starredQuotes.length > 0 ? (
          <ul className="space-y-4">
            {appState.starredQuotes.map(quote => (
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
                  aria-label="Unstar quote"
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
            Your favorite quotes will appear here once you star them.
          </p>
        )}
      </div>
    </section>
  );
};

export default DashboardQuotes;
