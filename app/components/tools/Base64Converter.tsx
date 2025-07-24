'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useState } from 'react';
import { FiRefreshCcw } from 'react-icons/fi';
import { MdContentCopy } from 'react-icons/md';

const Base64Converter: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const encodeBase64 = () => {
    if (!inputText) {
      showToast('Please enter text to encode.', 'error');
      return;
    }
    try {
      setOutputText(btoa(inputText));
    } catch {
      showToast('Failed to encode: Invalid characters.', 'error');
    }
  };

  const decodeBase64 = () => {
    if (!inputText) {
      showToast('Please enter text to decode.', 'error');
      return;
    }
    try {
      setOutputText(atob(inputText));
    } catch {
      showToast('Failed to decode: Invalid Base64 string.', 'error');
    }
  };

  const clearFields = () => {
    setInputText('');
    setOutputText('');
    showToast('Fields cleared.', 'info');
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Base64 Encoder/Decoder</h2>

      <div className="mb-4">
        <label htmlFor="inputText" className="block mb-2 text-sm font-bold text-text-secondary">
          Input Text:
        </label>
        <textarea
          id="inputText"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={5}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text to encode or decode"
        ></textarea>
      </div>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={encodeBase64}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Encode
        </button>
        <button
          onClick={decodeBase64}
          className="flex-1 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Decode
        </button>
        <button
          onClick={clearFields}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {outputText && (
        <div className="mt-4">
          <label htmlFor="outputText" className="block mb-2 text-sm font-bold text-text-secondary">
            Output:
          </label>
          <div className="relative">
            <textarea
              id="outputText"
              className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={outputText}
              readOnly
            ></textarea>
            <button
              onClick={() => copyToClipboard(outputText)}
              className="absolute top-2 right-2 p-2 text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Copy to clipboard"
            >
              <MdContentCopy />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 mt-8 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">How Base64 Works:</h3>
        <p className="mb-2 text-sm text-text-secondary">
          Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string
          format. It is commonly used to transmit data over mediums that are not designed to handle
          binary data directly, such as email or URLs.
        </p>
        <p className="mb-2 text-sm text-text-secondary">
          The process involves taking 3 bytes of binary data (24 bits) and representing them as 4
          Base64 characters. Each Base64 character represents 6 bits of data. This means the encoded
          output is approximately 33% larger than the original data.
        </p>
        <p className="text-sm text-text-secondary">
          It&apos;s important to note that Base64 is an encoding, not an encryption. It does not
          provide any security or confidentiality for the data; it merely transforms its
          representation.
        </p>
      </div>
    </div>
  );
};

export default Base64Converter;
