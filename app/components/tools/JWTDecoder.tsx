'use client';

import React, { useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw } from 'react-icons/fi';

const JWTDecoder: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [jwtToken, setJwtToken] = useState<string>('');
  const [decodedHeader, setDecodedHeader] = useState<string | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decodeJwt = () => {
    setError(null);
    setDecodedHeader(null);
    setDecodedPayload(null);

    if (!jwtToken) {
      showToast('Please enter a JWT token.', 'error');
      return;
    }

    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. A JWT must have 3 parts separated by dots.');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      setDecodedHeader(JSON.stringify(header, null, 2));
      setDecodedPayload(JSON.stringify(payload, null, 2));
    } catch (e: unknown) {
      setError(`Error decoding JWT: ${(e as Error).message}`);
      showToast(`Error decoding JWT: ${(e as Error).message}`, 'error');
    }
  };

  const clearFields = () => {
    setJwtToken('');
    setDecodedHeader(null);
    setDecodedPayload(null);
    setError(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">JWT Decoder</h2>

      <div className="mb-4">
        <label htmlFor="jwtToken" className="block text-text-secondary text-sm font-bold mb-2">
          JWT Token:
        </label>
        <textarea
          id="jwtToken"
          rows={6}
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={jwtToken}
          onChange={e => setJwtToken(e.target.value)}
          placeholder="Paste your JWT token here..."
        ></textarea>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={decodeJwt}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Decode JWT
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 rounded-md border border-red-500/30 text-red-400">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {decodedHeader && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-md border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Header:</h3>
          <pre className="whitespace-pre-wrap break-all text-text-primary text-sm bg-bg-tertiary p-2 rounded-md overflow-auto">
            {decodedHeader}
          </pre>
        </div>
      )}

      {decodedPayload && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-md border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Payload:</h3>
          <pre className="whitespace-pre-wrap break-all text-text-primary text-sm bg-bg-tertiary p-2 rounded-md overflow-auto">
            {decodedPayload}
          </pre>
        </div>
      )}
    </div>
  );
};

export default JWTDecoder;
