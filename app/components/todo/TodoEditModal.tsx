// app/components/todo/TodoEditModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiSave, FiCalendar, FiLoader, FiTrash2, FiEdit } from 'react-icons/fi';
import { TodoItem } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/common/DateTimePicker'; // Import the component

interface TodoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoItem: TodoItem | null;
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
  const [editDescription, setEditDescription] = useState('');
  // State now holds a Date object or null
  const [editDeadline, setEditDeadline] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false); // State for picker visibility

  useEffect(() => {
    if (isOpen && todoItem) {
      setEditText(todoItem.text);
      setEditDescription(todoItem.description || '');
      // Convert Timestamp to Date for the picker
      setEditDeadline(todoItem.deadline ? todoItem.deadline.toDate() : null);
    }
  }, [isOpen, todoItem]);

  // Close the modal on 'Escape' key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleClearDeadline = useCallback(() => {
    setEditDeadline(null);
  }, []);

  const handleSubmit = async () => {
    if (!todoItem) return;
    if (!editText.trim()) {
      showMessage('Task text cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    const updates: Partial<TodoItem> = {
      text: editText.trim(),
      description: editDescription.trim() ? editDescription.trim() : null,
      // Convert Date back to Timestamp before saving
      deadline: editDeadline ? Timestamp.fromDate(editDeadline) : null,
    };

    try {
      await onSave(todoItem.id, updates);
      showMessage('Task updated successfully!', 'success');
      onClose();
    } catch {
      showMessage('Failed to save task updates.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="flex fixed inset-0 z-40 justify-center items-center p-4 backdrop-blur-sm bg-black/60"
        onClick={onClose}
      >
        <div
          className="bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex gap-3 items-center">
              <FiEdit className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Edit Task</h2>
            </div>
            <button
              className="p-1.5 text-white/60 rounded-full hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="task-text" className="block mb-2 text-sm font-medium text-white/70">
                Task <span className="text-red-400">*</span>
              </label>
              <input
                id="task-text"
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="p-3 w-full text-base text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="task-description"
                className="block mb-2 text-sm font-medium text-white/70"
              >
                Notes (Optional)
              </label>
              <textarea
                id="task-description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Add more details..."
                className="p-3 w-full text-base text-white rounded-md border resize-none bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block mb-2 text-sm font-medium text-white/70">
                <FiCalendar className="inline mr-1 -mt-0.5" /> Deadline (Optional)
              </label>
              <div className="flex relative gap-2 items-center">
                {/* Button to open the custom picker */}
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="p-3 w-full text-base text-left text-white rounded-md border bg-black/20 border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {editDeadline ? (
                    format(editDeadline, "MMMM d,yyyy 'at' h:mm a")
                  ) : (
                    <span className="text-white/50">Set a deadline</span>
                  )}
                </button>
                {/* Clear deadline button */}
                {editDeadline && (
                  <button
                    onClick={handleClearDeadline}
                    className="p-3 rounded-md text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
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
              className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
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

      {/* The custom DateTimePicker component, now rendered as a modal */}
      <DateTimePicker
        isOpen={isPickerOpen}
        value={editDeadline}
        onChange={setEditDeadline}
        onClose={() => setIsPickerOpen(false)}
        mode="datetime"
      />
    </>
  );
};

export default TodoEditModal;
