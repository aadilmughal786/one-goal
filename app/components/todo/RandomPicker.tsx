// app/components/todo/RandomPicker.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRandomPickerStore } from '@/store/useRandomPickerStore';
import React, { useEffect, useState } from 'react';
import { FiLoader, FiPlus, FiShuffle, FiTrash2 } from 'react-icons/fi';

// --- Sub-component for the Picker Modal ---
const PickerModal = ({
  isOpen,
  items,
  onClose,
}: {
  isOpen: boolean;
  items: string[];
  onClose: () => void;
}) => {
  const [isPicking, setIsPicking] = useState(true);
  const [currentItem, setCurrentItem] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setIsPicking(true);
    let shuffleCount = 0;
    const maxShuffles = 20 + Math.floor(Math.random() * 15);

    const shuffleInterval = setInterval(() => {
      shuffleCount++;
      const randomIndex = Math.floor(Math.random() * items.length);
      setCurrentItem(items[randomIndex]);

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        setIsPicking(false);
      }
    }, 100);

    return () => clearInterval(shuffleInterval);
  }, [isOpen, items]);

  if (!isOpen) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative p-8 w-full max-w-md text-center rounded-3xl border shadow-2xl backdrop-blur-md bg-bg-secondary border-border-primary"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-text-primary">
          {isPicking ? 'Picking a Topic...' : 'Your Topic Is...'}
        </h2>
        <div className="flex justify-center items-center my-8 min-h-[80px]">
          <p className="text-4xl font-bold transition-all duration-100 text-text-accent">
            {currentItem}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-8 py-3 font-semibold rounded-full transition-colors cursor-pointer text-bg-primary bg-text-primary hover:opacity-90"
        >
          {isPicking ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
const RandomPicker: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const { showConfirmation, showToast } = useNotificationStore();

  const { appState } = useGoalStore();
  const { updateRandomPickerItems } = useRandomPickerStore();
  const activeGoal = appState?.goals[appState.activeGoalId || ''];
  const items = activeGoal?.randomPickerItems || [];

  const handleAddItem = async () => {
    if (inputValue.trim() === '' || isUpdatingList) return;
    if (items.includes(inputValue.trim())) {
      showToast('This item is already in the list.', 'error');
      return;
    }

    setIsUpdatingList(true);
    try {
      await updateRandomPickerItems([...items, inputValue.trim()]);
      setInputValue('');
    } finally {
      setIsUpdatingList(false);
    }
  };

  const handleDeleteItem = (indexToDelete: number, itemText: string) => {
    showConfirmation({
      title: 'Delete Item?',
      message: `Are you sure you want to delete "${itemText}" from your list?`,
      action: async () => {
        if (isUpdatingList) return;
        setIsUpdatingList(true);
        try {
          const newItems = items.filter((_, index) => index !== indexToDelete);
          await updateRandomPickerItems(newItems);
          showToast('Item deleted.', 'info');
        } finally {
          setIsUpdatingList(false);
        }
      },
    });
  };

  const handleClearAll = () => {
    showConfirmation({
      title: 'Clear All Items?',
      message: 'Are you sure you want to delete all items from your list? This cannot be undone.',
      action: async () => {
        if (isUpdatingList) return;
        setIsUpdatingList(true);
        try {
          await updateRandomPickerItems([]);
          showToast('List cleared.', 'info');
        } finally {
          setIsUpdatingList(false);
        }
      },
    });
  };

  const handleOpenPicker = () => {
    if (items.length < 2) {
      showToast('Please add at least two items to the list.', 'info');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="mx-auto space-y-8 w-full max-w-4xl">
        <div className="text-center">
          <button
            onClick={handleOpenPicker}
            disabled={items.length < 2 || isUpdatingList}
            className="inline-flex gap-3 items-center px-8 py-4 font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary group hover:opacity-90 hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            <FiShuffle />
            <span>Pick a Topic</span>
          </button>
        </div>

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-text-primary">Reduces Decision Fatigue</h2>
          <p className="mx-auto max-w-2xl text-text-secondary">
            Add items to the list and let fate decide. Perfect for study topics, choosing tasks, or
            making decisions.
          </p>
        </div>

        <div className="rounded-2xl border bg-bg-secondary border-border-primary">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddItem()}
                placeholder="Add a new item or topic..."
                disabled={isUpdatingList}
                className="flex-grow p-3 rounded-md border text-text-primary border-border-primary bg-bg-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent disabled:opacity-50"
              />
              <button
                onClick={handleAddItem}
                disabled={isUpdatingList || !inputValue.trim()}
                className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold rounded-lg transition-colors cursor-pointer text-text-primary bg-bg-tertiary hover:bg-border-primary disabled:opacity-50"
              >
                {isUpdatingList ? <FiLoader className="animate-spin" /> : <FiPlus />}
                Add Item
              </button>
            </div>
          </div>

          <div className="border-t border-border-primary"></div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text-primary">Your List ({items.length})</h3>
              <button
                onClick={handleClearAll}
                disabled={items.length === 0 || isUpdatingList}
                className="flex gap-2 items-center px-3 py-1 text-sm text-red-400 rounded-md transition-colors cursor-pointer hover:bg-red-500/20 disabled:opacity-50"
              >
                {isUpdatingList ? <FiLoader className="animate-spin" /> : <FiTrash2 />}
                Clear All
              </button>
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-center p-3 rounded-lg animate-fade-in-down bg-bg-tertiary"
                  >
                    <span className="flex-grow break-all text-text-primary">{item}</span>
                    <button
                      onClick={() => handleDeleteItem(index, item)}
                      disabled={isUpdatingList}
                      className="p-2 text-red-400 rounded-full transition-colors cursor-pointer hover:bg-red-500/20 disabled:opacity-50"
                      aria-label={`Delete ${item}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted">
                <FiShuffle size={32} className="mx-auto mb-4" />
                <p>Your list is empty. Add an item to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <PickerModal isOpen={isModalOpen} items={items} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default RandomPicker;
