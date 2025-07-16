'use client';

import React, { useState, useEffect } from 'react';

interface WeatherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit: { name: string } | null;
  onSave: (oldName: string, newName: string) => void;
}

const WeatherEditModal: React.FC<WeatherEditModalProps> = ({
  isOpen,
  onClose,
  locationToEdit,
  onSave,
}) => {
  const [editedName, setEditedName] = useState<string>('');

  useEffect(() => {
    if (isOpen && locationToEdit) {
      setEditedName(locationToEdit.name);
    } else {
      setEditedName('');
    }
  }, [isOpen, locationToEdit]);

  const handleSave = () => {
    if (locationToEdit && editedName.trim() !== '') {
      onSave(locationToEdit.name, editedName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg w-full max-w-md text-text-primary">
        <h2 className="text-xl font-semibold mb-4">Edit Location</h2>
        <label htmlFor="editLocationName" className="block text-sm font-medium mb-2">
          Location Name
        </label>
        <input
          id="editLocationName"
          type="text"
          value={editedName}
          onChange={e => setEditedName(e.target.value)}
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-text-secondary hover:bg-bg-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherEditModal;
