'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useState } from 'react';
import { FiRefreshCcw } from 'react-icons/fi';

const GUIDGenerator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [guid, setGuid] = useState<string | null>(null);

  const generateGuid = () => {
    // Generate a UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    setGuid(uuid);
  };

  const clearGuid = () => {
    setGuid(null);
    showToast('GUID cleared.', 'info');
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">GUID Generator</h2>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={generateGuid}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Generate New GUID
        </button>
        <button
          onClick={clearGuid}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear GUID"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {guid && (
        <div className="p-3 mt-4 rounded-md border bg-bg-secondary border-border-primary">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Generated GUID:</h3>
          <p className="text-lg font-bold break-all text-text-primary">{guid}</p>
        </div>
      )}
    </div>
  );
};

export default GUIDGenerator;
