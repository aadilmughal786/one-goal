// app/components/todo/StickyNotes.tsx

'use client';

import ConfirmationModal from '@/components/common/ConfirmationModal'; // Assuming ConfirmationModal is available
import { firebaseService } from '@/services/firebaseService';
import { AppState, StickyNote, StickyNoteColor } from '@/types';
import { format as formatDate } from 'date-fns'; // Renamed to avoid conflict with `format` from `types` if present
import { User } from 'firebase/auth';
import Fuse from 'fuse.js'; // Import Fuse.js for search functionality
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCheck,
  FiEdit,
  FiGrid,
  FiInfo,
  FiList,
  FiLoader,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { MdColorLens, MdStickyNote2 } from 'react-icons/md'; // Specific icons for sticky notes and color

interface StickyNotesProps {
  currentUser: User | null;
  appState: AppState | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

/**
 * StickyNotes Component
 *
 * This component allows users to manage their sticky notes associated with the active goal.
 * It provides functionality for adding, editing, deleting, searching, and viewing notes in
 * either a list or grid layout.
 */
const StickyNotes: React.FC<StickyNotesProps> = ({
  currentUser,
  appState,
  showMessage,
  onAppStateUpdate,
}) => {
  // Derive the active goal ID from the appState.
  const activeGoalId = appState?.activeGoalId;
  // Get sticky notes for the currently active goal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentStickyNotes = appState?.goals[activeGoalId || '']?.stickyNotes || [];

  // State for the list of sticky notes displayed.
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  // State for the search query entered by the user.
  const [searchQuery, setSearchQuery] = useState('');
  // State for the current view mode: 'list' or 'grid'.
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); // Default to grid view

  // States for editing an existing sticky note.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null); // ID of the note being edited
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState<StickyNoteColor>(StickyNoteColor.YELLOW);

  // States for adding a new sticky note.
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<StickyNoteColor>(StickyNoteColor.YELLOW);

  // States for loading indicators during API calls.
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState<string | null>(null); // ID of the note being updated

  // States for the confirmation modal for deletion.
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<StickyNote | null>(null);

  // Refs for closing color picker dropdowns when clicking outside.
  const colorDropdownRef = useRef<HTMLDivElement>(null); // For edit mode color picker
  const newNoteColorDropdownRef = useRef<HTMLDivElement>(null); // For new note color picker
  const [isEditColorDropdownOpen, setIsEditColorDropdownOpen] = useState(false);
  const [isNewNoteColorDropdownOpen, setIsNewNoteColorDropdownOpen] = useState(false);

  // Sync `stickyNotes` state with `currentStickyNotes` from `appState` whenever it changes.
  useEffect(() => {
    setStickyNotes(currentStickyNotes);
  }, [currentStickyNotes]);

  // Fuse.js options for configuring the search behavior.
  const fuseOptions = useMemo(
    () => ({
      keys: ['title', 'content'], // Fields to search within
      threshold: 0.3, // Fuzziness: 0.0 means exact match, 1.0 means very loose match
    }),
    []
  );

  // Memoized list of sticky notes, filtered by search query.
  const filteredNotes = useMemo(() => {
    if (!searchQuery) {
      return stickyNotes; // If no search query, return all notes
    }
    const fuse = new Fuse(stickyNotes, fuseOptions); // Initialize Fuse with the notes and options
    return fuse.search(searchQuery).map(result => result.item); // Perform search and return matched items
  }, [stickyNotes, searchQuery, fuseOptions]); // Re-run when notes, query, or fuse options change

  // Memoized mapping from StickyNoteColor enum to Tailwind CSS background/text/border classes.
  const stickyNoteColorMap = useMemo(
    () => ({
      [StickyNoteColor.YELLOW]: 'bg-yellow-200 text-yellow-900 border-yellow-300',
      [StickyNoteColor.BLUE]: 'bg-blue-200 text-blue-900 border-blue-300',
      [StickyNoteColor.GREEN]: 'bg-green-200 text-green-900 border-green-300',
      [StickyNoteColor.PINK]: 'bg-pink-200 text-pink-900 border-pink-300',
      [StickyNoteColor.PURPLE]: 'bg-purple-200 text-purple-900 border-purple-300',
      [StickyNoteColor.ORANGE]: 'bg-orange-200 text-orange-900 border-orange-300',
      [StickyNoteColor.RED]: 'bg-red-200 text-red-900 border-red-300',
      [StickyNoteColor.GRAY]: 'bg-gray-200 text-gray-900 border-gray-300',
    }),
    []
  );

  // --- CRUD Operations ---

  /**
   * Handles adding a new sticky note to the active goal.
   */
  const handleAddNote = useCallback(async () => {
    // Validate inputs and user/goal presence
    if (!currentUser || !activeGoalId || !newNoteTitle.trim() || !newNoteContent.trim()) {
      showMessage('Title and content are required for a new sticky note.', 'error');
      return;
    }

    setIsAddingNote(true); // Set loading state for add operation
    try {
      // Call Firebase service to add the new sticky note
      await firebaseService.addStickyNote(
        activeGoalId,
        currentUser.uid,
        newNoteTitle.trim(),
        newNoteContent.trim(),
        newNoteColor
      );
      // Reset new note form fields
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteColor(StickyNoteColor.YELLOW); // Reset to default color
      // Re-fetch AppState to update local state and trigger UI re-render
      const updatedAppState = await firebaseService.getUserData(currentUser.uid);
      onAppStateUpdate(updatedAppState);
      showMessage('Sticky note added!', 'success');
    } catch (error) {
      console.error('Failed to add sticky note:', error);
      showMessage('Failed to add sticky note. Please try again.', 'error');
    } finally {
      setIsAddingNote(false); // Clear loading state
    }
  }, [
    currentUser,
    activeGoalId,
    newNoteTitle,
    newNoteContent,
    newNoteColor,
    showMessage,
    onAppStateUpdate,
  ]);

  /**
   * Initiates the editing mode for a specific sticky note.
   * Populates edit states with the note's current values.
   */
  const handleStartEditing = useCallback((note: StickyNote) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  }, []);

  /**
   * Saves the edits made to a sticky note.
   */
  const handleSaveEdit = useCallback(
    async (noteId: string) => {
      // Validate inputs and user/goal presence
      if (!currentUser || !activeGoalId || !editTitle.trim() || !editContent.trim()) {
        showMessage('Title and content cannot be empty.', 'error');
        return;
      }

      setIsUpdatingNote(noteId); // Set loading state for this specific note
      try {
        // Call Firebase service to update the sticky note
        await firebaseService.updateStickyNote(activeGoalId, currentUser.uid, noteId, {
          title: editTitle.trim(),
          content: editContent.trim(),
          color: editColor,
        });
        setEditingNoteId(null); // Exit editing mode
        // Re-fetch AppState to update local state and trigger UI re-render
        const updatedAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(updatedAppState);
        showMessage('Sticky note updated!', 'success');
      } catch (error) {
        console.error('Failed to update sticky note:', error);
        showMessage('Failed to update sticky note. Please try again.', 'error');
      } finally {
        setIsUpdatingNote(null); // Clear loading state
      }
    },
    [currentUser, activeGoalId, editTitle, editContent, editColor, showMessage, onAppStateUpdate]
  );

  /**
   * Cancels the current editing session and resets edit states.
   */
  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditColor(StickyNoteColor.YELLOW); // Reset to default color
  }, []);

  /**
   * Prepares for deleting a sticky note by opening the confirmation modal.
   */
  const handleDeleteConfirmation = useCallback((note: StickyNote) => {
    setNoteToDelete(note); // Store the note to be deleted
    setIsConfirmModalOpen(true); // Open the confirmation modal
  }, []);

  /**
   * Confirms and proceeds with deleting the sticky note.
   */
  const confirmDeleteNote = useCallback(async () => {
    if (!currentUser || !activeGoalId || !noteToDelete) return; // Validate necessary data

    setIsUpdatingNote(noteToDelete.id); // Set loading state for the note being deleted
    try {
      // Call Firebase service to delete the sticky note
      await firebaseService.deleteStickyNote(activeGoalId, currentUser.uid, noteToDelete.id);
      // Re-fetch AppState to update local state and trigger UI re-render
      const updatedAppState = await firebaseService.getUserData(currentUser.uid);
      onAppStateUpdate(updatedAppState);
      showMessage('Sticky note deleted!', 'info');
    } catch (error) {
      console.error('Failed to delete sticky note:', error);
      showMessage('Failed to delete sticky note. Please try again.', 'error');
    } finally {
      setIsConfirmModalOpen(false); // Close modal
      setNoteToDelete(null); // Clear note to delete
      setIsUpdatingNote(null); // Clear loading state
    }
  }, [currentUser, activeGoalId, noteToDelete, showMessage, onAppStateUpdate]);

  // Effect to close color dropdowns when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setIsEditColorDropdownOpen(false);
      }
      if (
        newNoteColorDropdownRef.current &&
        !newNoteColorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNewNoteColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Renders a single sticky note card, handling both display and edit modes.
   */
  const renderNoteCard = (note: StickyNote) => {
    const isEditing = editingNoteId === note.id;
    const isSaving = isUpdatingNote === note.id;
    // Get color classes based on the note's color, with a fallback
    const colorClasses =
      stickyNoteColorMap[note.color] || 'bg-gray-200 text-gray-900 border-gray-300';

    return (
      <div
        key={note.id}
        className={`relative p-4 rounded-lg shadow-md border ${colorClasses} ${isSaving ? 'opacity-70' : ''}`}
      >
        {/* Loader overlay when saving/deleting a specific note */}
        {isSaving && (
          <div className="flex absolute inset-0 z-10 justify-center items-center rounded-lg bg-black/50">
            <FiLoader className="text-3xl text-white animate-spin" />
          </div>
        )}
        {isEditing ? (
          <>
            {/* Edit mode inputs */}
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="mb-2 w-full text-lg font-semibold bg-transparent border-b border-gray-400 focus:outline-none"
              placeholder="Title"
              disabled={isSaving}
              aria-label="Edit note title"
            />
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="mb-4 w-full h-24 bg-transparent border-b border-gray-400 resize-y focus:outline-none"
              placeholder="Content"
              disabled={isSaving}
              aria-label="Edit note content"
            />
            {/* Color picker for edit mode */}
            <div className="inline-block relative" ref={colorDropdownRef}>
              <button
                type="button"
                onClick={() => setIsEditColorDropdownOpen(prev => !prev)}
                className={`flex items-center p-2 rounded-full border ${stickyNoteColorMap[editColor]}`}
                aria-label="Select note color"
              >
                <MdColorLens size={20} />
                <FiInfo size={16} className="ml-2" /> {/* Info icon or dropdown indicator */}
              </button>
              {isEditColorDropdownOpen && (
                <div className="grid absolute z-20 grid-cols-4 gap-2 p-2 mt-1 rounded-lg border shadow-lg bg-neutral-800 border-white/10">
                  {Object.keys(StickyNoteColor) // Iterate over keys
                    .filter(key => isNaN(Number(key))) // Filter out numeric keys to get only string names
                    .map(colorName => {
                      const colorEnum = StickyNoteColor[colorName as keyof typeof StickyNoteColor]; // Get the numeric enum value
                      return (
                        <button
                          key={colorName} // Use the string name as the key
                          onClick={() => {
                            setEditColor(colorEnum as StickyNoteColor); // Set the color using its numeric value
                            setIsEditColorDropdownOpen(false);
                          }}
                          className={`w-8 h-8 rounded-full border cursor-pointer ${stickyNoteColorMap[colorEnum as StickyNoteColor]}`}
                          aria-label={`Set color to ${colorName.toLowerCase()}`} // Use colorName.toLowerCase()
                        ></button>
                      );
                    })}
                </div>
              )}
            </div>
            {/* Action buttons for edit mode */}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-300"
                disabled={isSaving}
                aria-label="Cancel edit"
              >
                <FiX size={20} />
              </button>
              <button
                onClick={() => handleSaveEdit(note.id)}
                className="p-2 text-green-600 rounded-full hover:bg-green-300"
                disabled={isSaving || !editTitle.trim() || !editContent.trim()}
                aria-label="Save changes"
              >
                <FiCheck size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Display mode */}
            <h3 className="mb-2 text-lg font-semibold">{note.title}</h3>
            <p className="mb-4 text-sm text-gray-800 whitespace-pre-wrap break-words">
              {note.content}
            </p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-700">
              <span>{formatDate(note.createdAt.toDate(), 'MMM d,yyyy')}</span>{' '}
              {/* Format Timestamp */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartEditing(note)}
                  className="p-1 text-gray-600 rounded-full hover:bg-gray-300"
                  aria-label="Edit note"
                >
                  <FiEdit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteConfirmation(note)}
                  className="p-1 text-red-600 rounded-full hover:bg-red-300"
                  aria-label="Delete note"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render nothing if no active goal is selected.
  // This helps prevent errors when trying to access goal-specific data.
  if (!activeGoalId || !appState?.goals[activeGoalId]) {
    return (
      <div className="p-10 text-center text-white/60">
        <MdStickyNote2 className="mx-auto mb-4 text-4xl" />
        <p>Set an active goal to start managing your sticky notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      {/* Search Bar and View Mode Controls */}
      <div className="flex flex-col gap-4 items-center mb-6 sm:flex-row">
        <div className="relative flex-grow w-full sm:w-auto">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={20} />
          <input
            type="text"
            placeholder="Search sticky notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="py-3 pr-4 pl-10 w-full rounded-full border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search sticky notes"
          />
        </div>
        {/* View Mode Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            title="Grid View"
            aria-label="Switch to grid view"
          >
            <FiGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            title="List View"
            aria-label="Switch to list view"
          >
            <FiList size={20} />
          </button>
        </div>
      </div>

      {/* Add New Sticky Note Section */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl">
        <h2 className="flex gap-2 items-center mb-4 text-xl font-bold">
          <FiPlus /> Add New Sticky Note
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={newNoteTitle}
            onChange={e => setNewNoteTitle(e.target.value)}
            className="p-3 w-full rounded-md border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isAddingNote}
            aria-label="New note title"
          />
          <textarea
            placeholder="Content"
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            rows={4}
            className="p-3 w-full rounded-md border resize-y border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isAddingNote}
            aria-label="New note content"
          ></textarea>
          <div className="flex gap-4 items-center">
            <label className="text-white/70">Color:</label>
            {/* Color picker for new note */}
            <div className="relative" ref={newNoteColorDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNewNoteColorDropdownOpen(prev => !prev)}
                className={`flex justify-center items-center w-10 h-10 rounded-full border-2 ${stickyNoteColorMap[newNoteColor]} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                aria-label="Select new note color"
              >
                <MdColorLens
                  size={20}
                  className={
                    newNoteColor === StickyNoteColor.GRAY ? 'text-gray-700' : 'text-current'
                  }
                />
              </button>
              {isNewNoteColorDropdownOpen && (
                <div className="grid absolute z-20 grid-cols-4 gap-2 p-2 mt-1 rounded-lg border shadow-lg bg-neutral-800 border-white/10">
                  {Object.keys(StickyNoteColor) // Iterate over keys
                    .filter(key => isNaN(Number(key))) // Filter out numeric keys to get only string names
                    .map(colorName => {
                      const colorEnum = StickyNoteColor[colorName as keyof typeof StickyNoteColor]; // Get the numeric enum value
                      return (
                        <button
                          key={colorName} // Use the string name as the key
                          onClick={() => {
                            setNewNoteColor(colorEnum as StickyNoteColor); // Set the color using its numeric value
                            setIsNewNoteColorDropdownOpen(false);
                          }}
                          className={`w-8 h-8 rounded-full border cursor-pointer ${stickyNoteColorMap[colorEnum as StickyNoteColor]}`}
                          aria-label={`Set color to ${colorName.toLowerCase()}`} // Use colorName.toLowerCase()
                        ></button>
                      );
                    })}
                </div>
              )}
            </div>
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !newNoteTitle.trim() || !newNoteContent.trim()}
              className="flex flex-grow gap-2 justify-center items-center px-6 py-3 text-lg font-semibold text-black bg-white rounded-full transition-all hover:bg-white/90 disabled:opacity-50"
              aria-label="Add new note"
            >
              {isAddingNote ? <FiLoader className="animate-spin" /> : <FiPlus />}
              <span>Add Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Notes Display Area */}
      {filteredNotes.length === 0 && searchQuery ? (
        // Message when search yields no results
        <div className="py-10 text-center text-white/60">
          <FiInfo size={40} className="mx-auto mb-4" />
          <p>No sticky notes match your search query.</p>
        </div>
      ) : filteredNotes.length === 0 && !searchQuery ? (
        // Message when no notes exist at all
        <div className="py-10 text-center text-white/60">
          <MdStickyNote2 size={40} className="mx-auto mb-4" />
          <p>No sticky notes created yet. Add one above!</p>
        </div>
      ) : (
        // Render notes in either grid or list layout
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4' // List view uses vertical spacing
          }
        >
          {filteredNotes.map(renderNoteCard)}
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Sticky Note?"
        message={`Are you sure you want to delete the note "${noteToDelete?.title || ''}"? This action cannot be undone.`}
        confirmButton={{
          text: 'Delete',
          onClick: confirmDeleteNote,
          className: 'bg-red-600 text-white hover:bg-red-700',
          icon: <FiTrash2 />,
        }}
        cancelButton={{
          text: 'Cancel',
          onClick: () => setIsConfirmModalOpen(false),
          icon: <FiX />,
        }}
      />
    </div>
  );
};

export default StickyNotes;
