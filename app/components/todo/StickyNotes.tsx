// app/components/todo/StickyNotes.tsx
'use client';

import { StickyNote, StickyNoteColor } from '@/types';
import { format as formatDate } from 'date-fns';
import Fuse from 'fuse.js';
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
import { MdColorLens, MdStickyNote2 } from 'react-icons/md';
import NoActiveGoalMessage from '../common/NoActiveGoalMessage';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const StickyNotes: React.FC = () => {
  // FIX: Select each piece of state and action individually.
  const appState = useGoalStore(state => state.appState);
  const addStickyNote = useGoalStore(state => state.addStickyNote);
  const updateStickyNote = useGoalStore(state => state.updateStickyNote);
  const deleteStickyNote = useGoalStore(state => state.deleteStickyNote);

  // FIX: Select each action individually from the notification store as well.
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const activeGoal = appState?.goals[appState?.activeGoalId || ''];

  const stickyNotes = useMemo(() => activeGoal?.stickyNotes || [], [activeGoal]);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState<StickyNoteColor>(StickyNoteColor.YELLOW);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState<string | null>(null);
  const [isEditColorDropdownOpen, setEditColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  const fuseOptions = useMemo(() => ({ keys: ['title', 'content'], threshold: 0.3 }), []);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return stickyNotes;
    const fuse = new Fuse(stickyNotes, fuseOptions);
    return fuse.search(searchQuery).map(result => result.item);
  }, [stickyNotes, searchQuery, fuseOptions]);

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

  const handleCreateDefaultNote = useCallback(async () => {
    setIsAddingNote(true);
    await addStickyNote('New Sticky Note', 'Start writing...', StickyNoteColor.YELLOW);
    setIsAddingNote(false);
  }, [addStickyNote]);

  const handleStartEditing = useCallback((note: StickyNote) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
  }, []);

  const handleSaveEdit = useCallback(
    async (noteId: string) => {
      if (!editTitle.trim() || !editContent.trim()) {
        showToast('Title and content cannot be empty.', 'error');
        return;
      }
      setIsUpdatingNote(noteId);
      await updateStickyNote(noteId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        color: editColor,
      });
      setEditingNoteId(null);
      setIsUpdatingNote(null);
    },
    [editTitle, editContent, editColor, showToast, updateStickyNote]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditColor(StickyNoteColor.YELLOW);
  }, []);

  const handleDeleteConfirmation = useCallback(
    (note: StickyNote) => {
      showConfirmation({
        title: 'Delete Sticky Note?',
        message: `Are you sure you want to delete the note "${note.title || ''}"? This action cannot be undone.`,
        action: async () => {
          setIsUpdatingNote(note.id);
          await deleteStickyNote(note.id);
          setIsUpdatingNote(null);
        },
      });
    },
    [showConfirmation, deleteStickyNote]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setEditColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderNoteCard = (note: StickyNote) => {
    const isEditing = editingNoteId === note.id;
    const isSaving = isUpdatingNote === note.id;
    const colorClasses =
      stickyNoteColorMap[note.color] || 'bg-gray-200 text-gray-900 border-gray-300';

    return (
      <div
        key={note.id}
        className={`relative p-4 rounded-lg shadow-md border ${colorClasses} ${isSaving ? 'opacity-70' : ''}`}
      >
        {isSaving && (
          <div className="flex absolute inset-0 z-10 justify-center items-center rounded-lg bg-black/50">
            <FiLoader className="text-3xl text-white animate-spin" />
          </div>
        )}
        {isEditing ? (
          <>
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
            <div className="inline-block relative" ref={colorDropdownRef}>
              <button
                type="button"
                onClick={() => setEditColorDropdownOpen(prev => !prev)}
                className={`flex items-center p-2 rounded-full border ${stickyNoteColorMap[editColor]}`}
                aria-label="Select note color"
              >
                <MdColorLens size={20} />
                <FiInfo size={16} className="ml-2" />
              </button>
              {isEditColorDropdownOpen && (
                <div className="grid absolute z-20 grid-cols-4 gap-2 p-2 mt-1 rounded-lg border shadow-lg bg-neutral-800 border-white/10">
                  {Object.keys(StickyNoteColor)
                    .filter(key => isNaN(Number(key)))
                    .map(colorName => {
                      const colorEnum = StickyNoteColor[colorName as keyof typeof StickyNoteColor];
                      return (
                        <button
                          key={colorName}
                          onClick={() => {
                            setEditColor(colorEnum);
                            setEditColorDropdownOpen(false);
                          }}
                          className={`w-8 h-8 rounded-full border cursor-pointer ${stickyNoteColorMap[colorEnum]}`}
                          aria-label={`Set color to ${colorName.toLowerCase()}`}
                        ></button>
                      );
                    })}
                </div>
              )}
            </div>
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
            <h3 className="mb-2 text-lg font-semibold">{note.title}</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{note.content}</p>
          </>
        )}
        <div className="flex justify-between items-center pt-4 mt-4 text-xs text-gray-700 border-t border-gray-300/30">
          <span>{formatDate(note.createdAt.toDate(), 'MMM d,yyyy')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleStartEditing(note)}
              className="p-1 text-gray-600 rounded-full hover:bg-gray-300"
              aria-label="Edit note"
              disabled={isEditing || isSaving || !!editingNoteId}
            >
              <FiEdit size={16} />
            </button>
            <button
              onClick={() => handleDeleteConfirmation(note)}
              className="p-1 text-red-600 rounded-full hover:bg-red-300"
              aria-label="Delete note"
              disabled={isEditing || isSaving || !!editingNoteId}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!activeGoal) {
    return <NoActiveGoalMessage />;
  }

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col gap-4 justify-between items-center mb-6 sm:flex-row">
        <button
          onClick={handleCreateDefaultNote}
          disabled={isAddingNote}
          className="flex flex-shrink-0 justify-center items-center w-12 h-12 text-black bg-white rounded-full transition-all hover:bg-white/90 disabled:opacity-50"
          aria-label="Create new sticky note"
        >
          {isAddingNote ? (
            <FiLoader className="w-6 h-6 animate-spin" />
          ) : (
            <FiPlus className="w-6 h-6" />
          )}
        </button>
        <div className="relative flex-grow w-full max-w-xl sm:w-auto">
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
        <div className="flex flex-shrink-0 gap-2">
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

      {filteredNotes.length === 0 && searchQuery ? (
        <div className="py-10 text-center text-white/60">
          <FiInfo size={40} className="mx-auto mb-4" />
          <p>No sticky notes match your search query.</p>
        </div>
      ) : filteredNotes.length === 0 && !searchQuery ? (
        <div className="py-10 text-center text-white/60">
          <MdStickyNote2 size={40} className="mx-auto mb-4" />
          <p>No sticky notes created yet. Click the + button above to get started!</p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredNotes.map(renderNoteCard)}
        </div>
      )}
    </div>
  );
};

export default StickyNotes;
