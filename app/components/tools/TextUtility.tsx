'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  FaTextHeight,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaRedo,
  FaExchangeAlt,
} from 'react-icons/fa';

const TextUtility: React.FC = () => {
  const [text, setText] = useState<string>('');

  const charCount = useMemo(() => text.length, [text]);
  const wordCount = useMemo(() => text.split(/\s+/).filter(word => word !== '').length, [text]);
  const lineCount = useMemo(() => text.split(/\r\n|\r|\n/).length, [text]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
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
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Text Utility</h2>

      <div className="mb-4">
        <textarea
          className="w-full p-3 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[150px]"
          placeholder="Enter your text here..."
          value={text}
          onChange={handleTextChange}
        ></textarea>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-bg-primary rounded-md border border-border-primary text-center">
          <p className="text-sm text-text-muted">Characters:</p>
          <p className="text-xl font-bold text-accent">{charCount}</p>
        </div>
        <div className="p-3 bg-bg-primary rounded-md border border-border-primary text-center">
          <p className="text-sm text-text-muted">Words:</p>
          <p className="text-xl font-bold text-accent">{wordCount}</p>
        </div>
        <div className="p-3 bg-bg-primary rounded-md border border-border-primary text-center">
          <p className="text-sm text-text-muted">Lines:</p>
          <p className="text-xl font-bold text-accent">{lineCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={toUppercase}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <FaSortAlphaUp /> Uppercase
        </button>
        <button
          onClick={toLowercase}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <FaSortAlphaDown /> Lowercase
        </button>
        <button
          onClick={capitalizeWords}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <FaTextHeight /> Capitalize
        </button>
        <button
          onClick={reverseText}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <FaRedo /> Reverse
        </button>
        <button
          onClick={clearText}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <FaExchangeAlt /> Clear
        </button>
      </div>
    </div>
  );
};

export default TextUtility;
