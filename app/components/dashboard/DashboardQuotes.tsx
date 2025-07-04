// app/components/dashboard/DashboardQuotes.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { quotes as allQuotes } from '@/data/quotes';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useQuoteStore } from '@/store/useQuoteStore';
import { Quote } from '@/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiCopy, FiLoader, FiRefreshCw, FiStar } from 'react-icons/fi';

/**
 * DashboardQuotes Component
 * Displays a "Quote of the Moment" and a list of starred quotes.
 */
const DashboardQuotes: React.FC = () => {
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const showToast = useNotificationStore(state => state.showToast);

  const { appState } = useGoalStore();
  const { addStarredQuote, removeStarredQuote } = useQuoteStore();

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const handleCopy = (quote: Quote) => {
    const textToCopy = `"${quote.text}" - ${quote.author}`;
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Quote copied to clipboard!', 'success');
      setCopiedId(quote.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy quote.', 'error');
    }
    document.body.removeChild(textArea);
  };

  const getNewRandomQuote = useCallback(() => {
    setIsFetchingNew(true);
    setIsFading(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      setRandomQuote(allQuotes[randomIndex]);
      setIsFetchingNew(false);
      setIsFading(false);
    }, 300);
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
      setUpdatingId(null);
    }
  };

  const starButtonClasses = isCurrentQuoteStarred
    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
    : 'bg-bg-tertiary text-text-primary hover:bg-border-primary';
  const starButtonIcon = isCurrentQuoteStarred ? <FiStar fill="currentColor" /> : <FiStar />;
  const starButtonText = isCurrentQuoteStarred ? 'Starred' : 'Star this Quote';

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <section className="space-y-12">
      <div className="text-center card">
        <h3 className="mb-4 text-2xl font-bold">Quote of the Moment</h3>
        <div className="min-h-[120px] flex flex-col justify-center">
          {randomQuote ? (
            <div
              className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            >
              <p className="mb-4 text-xl italic text-text-secondary">
                &quot;{randomQuote.text}&quot;
              </p>
              <p className="font-semibold text-text-tertiary">- {randomQuote.author}</p>
            </div>
          ) : (
            <div className="flex justify-center items-center py-10">
              <FiLoader className="w-8 h-8 animate-spin text-text-muted" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 justify-center mt-8 sm:flex-row">
          <button
            onClick={getNewRandomQuote}
            disabled={isFetchingNew}
            className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors cursor-pointer bg-bg-tertiary text-text-primary hover:bg-border-primary"
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
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors cursor-pointer bg-bg-tertiary text-text-primary hover:bg-border-primary"
                aria-label="Copy quote"
              >
                {copiedId === randomQuote.id ? <FiCheck /> : <FiCopy />}
                <span>{copiedId === randomQuote.id ? 'Copied!' : 'Copy'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
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
                  className={`mb-6 rounded-lg bg-bg-tertiary break-inside-avoid transition-opacity duration-300 ${updatingId === quote.id ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div className="p-4">
                    <p className="italic text-text-primary">&quot;{quote.text}&quot;</p>
                    <p className="mt-2 text-sm font-medium text-right text-text-tertiary">
                      - {quote.author}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end p-2 border-t border-border-primary">
                    <button
                      onClick={() => handleCopy(quote)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-text-secondary hover:bg-border-primary"
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
          <p className="text-center text-text-muted">
            Your favorite quotes will appear here once you star them for this goal.
          </p>
        )}
      </div>
    </section>
  );
};

export default DashboardQuotes;
