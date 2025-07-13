'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  FaExchangeAlt,
  FaRedo,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaTextHeight,
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const TextUtility: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const charCount = useMemo(() => text.length, [text]);
  const wordCount = useMemo(() => text.split(/\s+/).filter(word => word !== '').length, [text]);
  const lineCount = useMemo(() => text.split(/\r\n|\r|\n/).length, [text]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const performTextOperation = useCallback((operation: () => void) => {
    setIsLoading(true);
    setTimeout(() => {
      operation();
      setIsLoading(false);
    }, 500); // Fake delay
  }, []);

  const toUppercase = useCallback(() => {
    setText(text.toUpperCase());
  }, [text]);

  const toLowercase = useCallback(() => {
    setText(text.toLowerCase());
  }, [text]);

  const capitalizeWords = useCallback(() => {
    setText(text.replace(/\b\w/g, char => char.toUpperCase()));
  }, [text]);

  const reverseText = useCallback(() => {
    setText(text.split('').reverse().join(''));
  }, [text]);

  const clearText = useCallback(() => {
    setText('');
  }, []);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Text Utility</h2>

      <div className="mb-4">
        <textarea
          className="w-full p-3 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[150px]"
          placeholder="Enter your text here..."
          value={text}
          onChange={handleTextChange}
          disabled={isLoading}
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        <div className="p-3 text-center rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Characters:</p>
          <p className="text-xl font-bold text-accent">{charCount}</p>
        </div>
        <div className="p-3 text-center rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Words:</p>
          <p className="text-xl font-bold text-accent">{wordCount}</p>
        </div>
        <div className="p-3 text-center rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Lines:</p>
          <p className="text-xl font-bold text-accent">{lineCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          onClick={() => performTextOperation(toUppercase)}
          disabled={isLoading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          <FaSortAlphaUp /> Uppercase
        </button>
        <button
          onClick={() => performTextOperation(toLowercase)}
          disabled={isLoading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          <FaSortAlphaDown /> Lowercase
        </button>
        <button
          onClick={() => performTextOperation(capitalizeWords)}
          disabled={isLoading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          <FaTextHeight /> Capitalize
        </button>
        <button
          onClick={() => performTextOperation(reverseText)}
          disabled={isLoading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          <FaRedo /> Reverse
        </button>
        <button
          onClick={() => performTextOperation(clearText)}
          disabled={isLoading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-white bg-red-500 rounded-lg transition-all duration-200 cursor-pointer hover:bg-red-600 disabled:opacity-60"
        >
          <FaExchangeAlt /> Clear
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center mt-6">
          <FiLoader className="w-8 h-8 animate-spin text-text-secondary" />
        </div>
      )}
    </div>
  );
};

export default TextUtility;
