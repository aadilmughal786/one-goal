// app/components/dashboard/DashboardQuotes.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { quotes as allQuotes } from '@/data/quotes';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Quote } from '@/types';
import React, { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiCopy, FiLoader, FiRefreshCw, FiStar } from 'react-icons/fi';

/**
 * DashboardQuotes Component
 * Displays a "Quote of the Moment" and a list of starred quotes.
 * It has been refactored to use the new dedicated quoteService for all data operations.
 */
const DashboardQuotes: React.FC = () => {
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false); // For quote of the moment animation
  const [copiedId, setCopiedId] = useState<number | null>(null); // To show feedback on copy button

  const showToast = useNotificationStore(state => state.showToast);

  // FIX: Select each piece of state individually to prevent infinite loops.
  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );
  const addStarredQuote = useGoalStore(state => state.addStarredQuote);
  const removeStarredQuote = useGoalStore(state => state.removeStarredQuote);

  /**
   * Copies the provided quote text and author to the clipboard.
   * Uses a temporary textarea to ensure compatibility across browsers and iframes.
   * @param quote The quote object to copy.
   */
  const handleCopy = (quote: Quote) => {
    const textToCopy = `"${quote.text}" - ${quote.author}`;
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    // Make the textarea non-editable and invisible
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Quote copied to clipboard!', 'success');
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
    } catch (err) {
      showToast('Failed to copy quote.', 'error');
    }
    document.body.removeChild(textArea);
  };

  /**
   * Fetches a new random quote with a fade animation.
   */
  const getNewRandomQuote = useCallback(() => {
    setIsFetchingNew(true);
    setIsFading(true); // Start fade out
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setRandomQuote(allQuotes[randomIndex]);
      setIsFetchingNew(false);
      setIsFading(false); // Start fade in
    }, 300); // Duration must match the CSS transition duration
  }, []);

  useEffect(() => {
    getNewRandomQuote();
  }, [getNewRandomQuote]);

  const isCurrentQuoteStarred =
    randomQuote && activeGoal ? activeGoal.starredQuotes.includes(randomQuote.id) : false;

  const handleToggleStar = async () => {
    if (!activeGoal || !randomQuote || isUpdating) return;

    setIsUpdating(true);
    const { id: quoteId } = randomQuote;

    try {
      if (isCurrentQuoteStarred) {
        await removeStarredQuote(quoteId);
        showToast('Quote unstarred.', 'info');
      } else {
        await addStarredQuote(quoteId);
        showToast('Quote starred!', 'success');
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to update quote status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnstarFromList = async (quoteId: number) => {
    if (!activeGoal) return;
    setUpdatingId(quoteId);
    try {
      await removeStarredQuote(quoteId);
      showToast('Quote unstarred.', 'info');
    } catch (error) {
      console.error('Failed to unstar quote from list:', error);
    } finally {
      // The item will be removed from the list by the store update,
      // so we only need to reset the loader state if the operation fails and the item remains.
      // However, for simplicity and robustness, we reset it anyway.
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
        <div className="min-h-[120px] flex flex-col justify-center">
          {randomQuote ? (
            <div
              className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            >
              <p className="mb-4 text-xl italic text-white/80">&quot;{randomQuote.text}&quot;</p>
              <p className="font-semibold text-white/60">- {randomQuote.author}</p>
            </div>
          ) : (
            <div className="flex justify-center items-center py-10">
              <FiLoader className="w-8 h-8 animate-spin text-white/60" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 justify-center mt-8 sm:flex-row">
          <button
            onClick={getNewRandomQuote}
            disabled={isFetchingNew}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors cursor-pointer bg-white/10 hover:bg-white/20"
          >
            {isFetchingNew ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiRefreshCw />} New
            Quote
          </button>
          {randomQuote && (
            <>
              <button
                onClick={handleToggleStar}
                disabled={isUpdating}
                className={`inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors cursor-pointer ${starButtonClasses}`}
              >
                {isUpdating ? <FiLoader className="w-5 h-5 animate-spin" /> : starButtonIcon}{' '}
                <span>{starButtonText}</span>
              </button>
              <button
                onClick={() => handleCopy(randomQuote)}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors cursor-pointer bg-white/10 hover:bg-white/20"
                aria-label="Copy quote"
              >
                {copiedId === randomQuote.id ? <FiCheck /> : <FiCopy />}
                <span>{copiedId === randomQuote.id ? 'Copied!' : 'Copy'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-center">Your Starred Quotes</h3>
        {activeGoal.starredQuotes && activeGoal.starredQuotes.length > 0 ? (
          <div className="gap-6 columns-1 sm:columns-2 lg:columns-3">
            {allQuotes
              .filter(
                quote => activeGoal.starredQuotes.includes(quote.id) || updatingId === quote.id
              )
              .map(quote => (
                <div
                  key={quote.id}
                  className={`p-4 mb-6 rounded-lg bg-white/5 break-inside-avoid transition-opacity duration-300 ${updatingId === quote.id ? 'opacity-50' : 'opacity-100'}`}
                >
                  <p className="italic text-white/90">&quot;{quote.text}&quot;</p>
                  <p className="mt-2 text-sm font-medium text-right text-white/60">
                    - {quote.author}
                  </p>
                  <div className="flex gap-2 justify-end pt-3 mt-3 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(quote)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/70 hover:bg-white/10"
                      aria-label="Copy quote"
                      title="Copy"
                    >
                      {copiedId === quote.id ? <FiCheck className="text-green-400" /> : <FiCopy />}
                    </button>
                    <button
                      onClick={() => handleUnstarFromList(quote.id)}
                      className="p-2 text-yellow-400 rounded-full transition-colors cursor-pointer hover:bg-yellow-500/10"
                      disabled={updatingId === quote.id}
                      aria-label="Unstar quote"
                      title="Unstar"
                    >
                      {updatingId === quote.id ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiStar fill="currentColor" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
          </div>
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
