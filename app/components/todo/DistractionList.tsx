// app/components/todo/DistractionList.tsx
'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import React, { useCallback, useState } from 'react';
import { FiClock, FiEdit, FiLoader, FiMinus, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { RiAlarmWarningLine } from 'react-icons/ri';

// Re-import DistractionItem from your types, ensuring it aligns with global definition
import { DistractionItem } from '@/types';
// NEW: Import useNotificationStore to use showToast
import { useNotificationStore } from '@/store/useNotificationStore';

interface DistractionListComponentProps {
  // Renamed interface to be more specific
  list: DistractionItem[]; // List now explicitly contains only DistractionItem
  addToList: (title: string) => void; // AddToList now specifically takes a title
  removeFromList: (id: string) => void;
  updateItem: (id: string, updates: Partial<DistractionItem>) => void; // UpdateItem specifically for DistractionItem
  placeholder: string; // Placeholder for the input (e.g., "Add a distraction")
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  isAdding: boolean; // Indicates if an item is currently being added
  isUpdatingId: string | null; // ID of the item currently being updated (for loading state)
  // REMOVED: showToast prop is no longer needed
  // showToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * DistractionListComponent: A component specifically for displaying and managing a list of Distraction Items.
 * It provides functionality to add, edit, delete, and increment/decrement the count of distractions.
 */
const DistractionListComponent: React.FC<DistractionListComponentProps> = ({
  // Renamed component for clarity
  list,
  addToList,
  removeFromList,
  updateItem,
  placeholder,
  editingItemId,
  setEditingItemId,
  editText,
  setEditText,
  isAdding,
  isUpdatingId,
  // REMOVED: showToast from destructuring
}) => {
  // NEW: Access showToast and showConfirmation from the global notification store
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const [inputValue, setInputValue] = useState(''); // State for the new item input field

  /**
   * Handles adding a new item (distraction) to the list.
   * Calls the `addToList` prop with the current input value as the title.
   */
  const handleAddItem = useCallback(() => {
    if (isAdding || !inputValue.trim()) {
      if (!inputValue.trim()) {
        showToast('Distraction title cannot be empty.', 'error'); // Use global showToast
      }
      return; // Prevent adding if already adding or input is empty
    }
    addToList(inputValue.trim()); // Trim whitespace before adding
    setInputValue(''); // Clear the input field after adding
  }, [inputValue, addToList, isAdding, showToast]); // Dependency on global showToast

  /**
   * Formats a Firebase Timestamp object into a human-readable date string.
   * @param timestamp The Firebase Timestamp to format.
   * @returns A formatted date string or '...' if timestamp is null/undefined.
   */
  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return '...'; // Handle cases where timestamp might be missing
    return format(timestamp.toDate(), 'MMM d,yyyy'); // Use 'yyyy' for full year
  };

  /**
   * Initiates the editing state for a specific distraction item.
   * Sets `editingItemId` and populates `editText` with the item's current title.
   * @param item The DistractionItem to edit.
   */
  const handleStartEditing = (item: DistractionItem) => {
    setEditingItemId(item.id);
    setEditText(item.title); // DistractionItem uses 'title'
  };

  /**
   * Saves the updated title for a distraction item.
   * Calls the `updateItem` prop with the new title.
   * @param id The ID of the item to update.
   */
  const handleUpdateItem = (id: string) => {
    if (!editText.trim()) {
      showToast('Distraction title cannot be empty.', 'error'); // Use global showToast
      return;
    }
    updateItem(id, { title: editText.trim() }); // Update 'title' for DistractionItem
    setEditingItemId(null); // Exit editing mode
    setEditText(''); // Clear edit text
  };

  /**
   * Handles updating the 'count' property for DistractionItems.
   * Ensures count doesn't go below zero.
   * @param id The ID of the DistractionItem to update.
   * @param currentCount The current count of the item.
   * @param change The amount to change the count by (+1 or -1).
   */
  const handleUpdateCount = (id: string, currentCount: number, change: 1 | -1) => {
    const newCount = Math.max(0, currentCount + change); // Ensure count is not negative
    updateItem(id, { count: newCount }); // Update the count property
  };

  const handleDeleteConfirmation = (id: string, title: string) => {
    showConfirmation({
      // Use global showConfirmation
      title: 'Delete Distraction?',
      message: `Are you sure you want to permanently delete "${title}" from your "What Not To Do" list? This action cannot be undone.`,
      action: () => removeFromList(id),
      actionDelayMs: 3000,
    });
  };

  // Fixed theme configuration for Distraction Items (red theme implicitly)
  const currentTheme = {
    bg: 'bg-red-500/10',
    border: 'border-red-400/20',
    hoverBg: 'hover:bg-red-500/20',
    icon: <RiAlarmWarningLine size={40} className="text-white/40" />, // Specific icon for distractions
    emptyText: 'No distractions defined yet.', // Specific empty message
  };

  return (
    <>
      {/* Input field and Add button for new items */}
      <div className="flex flex-col gap-2 mb-6 sm:flex-row">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddItem()}
          placeholder={placeholder}
          className="flex-1 p-3 text-lg text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          disabled={isAdding} // Disable input while adding
          aria-label={`Add new ${placeholder.toLowerCase()}`}
        />
        <button
          onClick={handleAddItem}
          disabled={isAdding || !inputValue.trim()} // Disable if adding or input is empty
          className="inline-flex gap-2 justify-center items-center px-6 py-3 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/90 hover:scale-105 active:scale-95 disabled:opacity-60"
          aria-label="Add item"
        >
          {isAdding ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <FiPlus />
              <span>Add</span>
            </>
          )}
        </button>
      </div>

      {/* List of items */}
      <ul className="space-y-3">
        {list.length === 0 ? (
          // Message displayed when the list is empty
          <li className="p-8 text-center rounded-md text-white/40">
            <div className="flex flex-col gap-3 justify-center items-center">
              {currentTheme.icon} {/* Theme-specific empty list icon */}
              <p className="text-lg">{currentTheme.emptyText}</p> {/* Theme-specific empty text */}
              <p>Add an item above to get started!</p>
            </div>
          </li>
        ) : (
          // Map through the list items and render each one
          list.map(item => {
            const isUpdating = isUpdatingId === item.id;
            // Check if this item's count is being updated (only applicable for distractions)
            const isThisItemBeingCounted = isUpdating && 'count' in item;

            return (
              <li
                key={item.id} // Unique key for list items
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border transition-all duration-200 ${currentTheme.bg} ${currentTheme.border}`}
              >
                <div className="flex-grow mb-3 sm:mb-0">
                  {/* Conditional rendering for editing mode vs. display mode */}
                  {editingItemId === item.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleUpdateItem(item.id)}
                      autoFocus
                      disabled={isUpdating}
                      className="w-full text-lg text-white bg-transparent border-b-2 outline-none border-white/20 focus:border-blue-400 disabled:opacity-50"
                      aria-label="Edit item text"
                    />
                  ) : (
                    <>
                      {/* Display item's title (always title for DistractionItem) */}
                      <span className="text-lg text-white/90">{item.title}</span>
                      {/* Display creation timestamp */}
                      <div className="flex gap-1 items-center mt-1 text-xs text-white/50">
                        <FiClock size={12} />
                        <span>Created: {formatDate(item.createdAt)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 items-center self-end sm:self-center">
                  {/* Counter UI for Distractions (always visible for this component) */}
                  <div className="flex gap-1 items-center p-1 rounded-full bg-black/20">
                    <button
                      onClick={() => handleUpdateCount(item.id, item.count, -1)}
                      className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                      disabled={isUpdating}
                      aria-label="Decrease count"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="w-8 font-mono text-lg font-semibold text-center text-red-400">
                      {/* Show loader if this specific item's count is updating */}
                      {isThisItemBeingCounted ? (
                        <FiLoader className="inline-block animate-spin" />
                      ) : (
                        item.count
                      )}
                    </span>
                    <button
                      onClick={() => handleUpdateCount(item.id, item.count, 1)}
                      className="p-1.5 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-50"
                      disabled={isUpdating}
                      aria-label="Increase count"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>

                  {/* Save or Edit button */}
                  {editingItemId === item.id ? (
                    <button
                      onClick={() => handleUpdateItem(item.id)}
                      disabled={isUpdating || !editText.trim()} // Disable if updating or edit text is empty
                      className="p-2 text-green-400 rounded-full transition-colors cursor-pointer hover:bg-green-500/10 disabled:opacity-50"
                      aria-label="Save changes"
                    >
                      {/* Show loader only if general update is happening but not specifically count */}
                      {isUpdating && !isThisItemBeingCounted ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiSave />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEditing(item)}
                      className="p-2 rounded-full transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Edit item"
                      disabled={isUpdating} // Disable edit while another item is updating
                    >
                      <FiEdit />
                    </button>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteConfirmation(item.id, item.title)} // Use the new confirmation handler
                    className="p-2 rounded-full transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Delete item"
                    disabled={isUpdating} // Disable delete while another item is updating
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
};

export default DistractionListComponent; // Export renamed component
