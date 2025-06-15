// app/components/todo/TodoEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSave, FiCalendar, FiLoader, FiTrash2 } from 'react-icons/fi'; // Added FiTrash2 for clear button
import { TodoItem } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface TodoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoItem: TodoItem | null; // The item to edit
  onSave: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const TodoEditModal: React.FC<TodoEditModalProps> = ({
  isOpen,
  onClose,
  todoItem,
  onSave,
  showMessage,
}) => {
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState(''); // State for description
  const [editDeadline, setEditDeadline] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  // Populate form fields when modal opens or todoItem changes
  useEffect(() => {
    if (isOpen && todoItem) {
      setEditText(todoItem.text);
      setEditDescription(todoItem.description || ''); // Populate description
      setEditDeadline(
        todoItem.deadline ? todoItem.deadline.toDate().toISOString().slice(0, 16) : ''
      );
      setIsSaving(false); // Reset saving state
    }
  }, [isOpen, todoItem]);

  // Prevent scrolling body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleClearDeadline = useCallback(() => {
    setEditDeadline('');
  }, []);

  const handleSubmit = async () => {
    if (!todoItem) return;
    if (!editText.trim()) {
      showMessage('Task description cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    const updates: Partial<TodoItem> = { text: editText.trim() };

    // Handle description update: if empty string, set to null
    updates.description = editDescription.trim() === '' ? null : editDescription.trim();

    // Handle deadline update
    if (editDeadline) {
      const newDeadlineDate = new Date(editDeadline);
      if (isNaN(newDeadlineDate.getTime())) {
        showMessage('Invalid deadline date. Please check the format.', 'error');
        setIsSaving(false);
        return;
      }
      updates.deadline = Timestamp.fromDate(newDeadlineDate);
    } else {
      updates.deadline = undefined; // Set to undefined to signal null in FirebaseService
    }

    try {
      await onSave(todoItem.id, updates);
      showMessage('Task updated successfully!', 'success');
      onClose();
    } catch (error) {
      showMessage('Failed to save task updates.', 'error');
      console.error('Error saving todo item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !todoItem) return null;

  return (
    <>
      {/* Inline style to make datetime-local calendar icon white */}
      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }
      `}</style>
      <div
        className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
        onClick={onClose}
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Edit Task</h2>
            <button
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="task-description"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Task Description
              </label>
              <input
                id="task-description"
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="p-3 w-full text-base text-white rounded-md border border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="task-long-description"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Detailed Notes (Optional)
              </label>
              <textarea
                id="task-long-description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Add more details about this task..."
                className="p-3 w-full text-base text-white rounded-md border resize-none border-white/10 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block mb-2 text-sm font-medium text-white/70">
                <FiCalendar className="inline -mt-0.5 mr-1" /> Deadline (Optional)
              </label>
              <div className="flex gap-2 items-center">
                {' '}
                {/* Flex container for input and clear button */}
                <input
                  id="deadline"
                  type="datetime-local"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="flex-1 p-3 text-base text-white rounded-md border cursor-pointer border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-white/30 accent-white"
                />
                {editDeadline && ( // Show clear button only if deadline is set
                  <button
                    onClick={handleClearDeadline}
                    className="p-3 rounded-md transition-colors cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Clear deadline"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TodoEditModal;
