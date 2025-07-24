'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  FaAngleDoubleUp,
  FaArrowsAltV,
  FaExchangeAlt,
  FaRedo,
  FaSmileBeam,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaTextHeight,
} from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const TextUtility: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  const charCount = useMemo(() => text.length, [text]);
  const wordCount = useMemo(() => text.split(/\s+/).filter(word => word !== '').length, [text]);
  const lineCount = useMemo(() => text.split(/\r\n|\r|\n/).length, [text]);
  const emojiCount = useMemo(() => {
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  }, [text]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const performTextOperation = useCallback((operationName: string, operation: () => void) => {
    setCurrentOperation(operationName);
    setTimeout(() => {
      operation();
      setCurrentOperation(null);
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

  const removeEmojis = useCallback(() => {
    // Regex to match most common emojis
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    setText(text.replace(emojiRegex, ''));
  }, [text]);

  const removeDuplicateLinesAndSpaces = useCallback(() => {
    const lines = text.split(/\r\n|\r|\n/);
    const uniqueLines = Array.from(new Set(lines.map(line => line.trim()))).filter(
      line => line !== ''
    );
    setText(uniqueLines.join('\n'));
  }, [text]);

  const upsideDownText = useCallback(() => {
    const normalChars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!\'"()[]{}<>/\\_-';
    const upsideDownChars =
      "ɐqɔpǝɟƃɥıɾʞlɯuodbɹsʇnʌʍxʎz∀QƆԀƎℲפHIſʞ˥WNOԀQᴚS⊥∩ΛMX⅄Z0ƖᄅƐㄣϛ9ㄥ86˙''¿¡'\"()[]{}<>/\_-";
    const mapping: { [key: string]: string } = {};
    for (let i = 0; i < normalChars.length; i++) {
      mapping[normalChars[i]] = upsideDownChars[i];
      mapping[upsideDownChars[i]] = normalChars[i]; // For reversing back if needed, though not used here
    }

    let result = '';
    for (let i = text.length - 1; i >= 0; i--) {
      const char = text[i];
      result += mapping[char] || char; // Use mapped char or original if not found
    }
    setText(result);
  }, [text]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Text Utility</h2>

      <div className="mb-4">
        <textarea
          className="w-full p-3 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[150px]"
          placeholder="Enter your text here..."
          value={text}
          onChange={handleTextChange}
          disabled={!!currentOperation}
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
        <div className="p-3 text-center rounded-md border bg-bg-primary border-border-primary">
          <p className="text-sm text-text-muted">Emojis:</p>
          <p className="text-xl font-bold text-accent">{emojiCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          onClick={() => performTextOperation('uppercase', toUppercase)}
          disabled={currentOperation === 'uppercase'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'uppercase' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaSortAlphaUp />
          )}{' '}
          Uppercase
        </button>
        <button
          onClick={() => performTextOperation('lowercase', toLowercase)}
          disabled={currentOperation === 'lowercase'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'lowercase' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaSortAlphaDown />
          )}{' '}
          Lowercase
        </button>
        <button
          onClick={() => performTextOperation('capitalize', capitalizeWords)}
          disabled={currentOperation === 'capitalize'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'capitalize' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaTextHeight />
          )}{' '}
          Capitalize
        </button>
        <button
          onClick={() => performTextOperation('reverse', reverseText)}
          disabled={currentOperation === 'reverse'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'reverse' ? <FiLoader className="animate-spin" /> : <FaRedo />}{' '}
          Reverse
        </button>
        <button
          onClick={() => performTextOperation('removeEmojis', removeEmojis)}
          disabled={currentOperation === 'removeEmojis'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'removeEmojis' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaSmileBeam />
          )}{' '}
          Remove Emojis
        </button>
        <button
          onClick={() => performTextOperation('cleanLines', removeDuplicateLinesAndSpaces)}
          disabled={currentOperation === 'cleanLines'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'cleanLines' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaArrowsAltV />
          )}{' '}
          Clean Lines
        </button>
        <button
          onClick={() => performTextOperation('upsideDown', upsideDownText)}
          disabled={currentOperation === 'upsideDown'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {currentOperation === 'upsideDown' ? (
            <FiLoader className="animate-spin" />
          ) : (
            <FaAngleDoubleUp />
          )}{' '}
          Upside Down
        </button>
        <button
          onClick={() => performTextOperation('clear', clearText)}
          disabled={currentOperation === 'clear'}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-white bg-red-500 rounded-lg transition-all duration-200 cursor-pointer hover:bg-red-600 disabled:opacity-60"
        >
          {currentOperation === 'clear' ? <FiLoader className="animate-spin" /> : <FaExchangeAlt />}{' '}
          Clear
        </button>
      </div>

      {currentOperation && (
        <div className="flex justify-center items-center mt-6">
          <p className="text-text-secondary">Performing {currentOperation} operation...</p>
        </div>
      )}
    </div>
  );
};

export default TextUtility;
