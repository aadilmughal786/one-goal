'use client';

import React, { useState, useCallback } from 'react';
import { FaCopy, FaSyncAlt } from 'react-icons/fa';

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [length, setLength] = useState<number>(12);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);

  const generatePassword = useCallback(() => {
    let characters = '';
    if (includeUppercase) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) characters += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) characters += '0123456789';
    if (includeSymbols) characters += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (characters.length === 0) {
      setPassword('Select at least one option');
      return;
    }

    let generatedPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      generatedPassword += characters[randomIndex];
    }
    setPassword(generatedPassword);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
  }, [password]);

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Password Generator</h2>

      <div className="mb-4">
        <label htmlFor="length" className="block mb-2 text-sm font-medium">
          Password Length: {length}
        </label>
        <input
          type="range"
          id="length"
          min="6"
          max="32"
          value={length}
          onChange={e => setLength(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-bg-primary accent-accent"
        />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="uppercase"
            checked={includeUppercase}
            onChange={e => setIncludeUppercase(e.target.checked)}
            className="w-4 h-4 rounded accent-accent focus:ring-accent"
          />
          <label htmlFor="uppercase" className="ml-2 text-sm font-medium">
            Include Uppercase Letters (A-Z)
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="lowercase"
            checked={includeLowercase}
            onChange={e => setIncludeLowercase(e.target.checked)}
            className="w-4 h-4 rounded accent-accent focus:ring-accent"
          />
          <label htmlFor="lowercase" className="ml-2 text-sm font-medium">
            Include Lowercase Letters (a-z)
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="numbers"
            checked={includeNumbers}
            onChange={e => setIncludeNumbers(e.target.checked)}
            className="w-4 h-4 rounded accent-accent focus:ring-accent"
          />
          <label htmlFor="numbers" className="ml-2 text-sm font-medium">
            Include Numbers (0-9)
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="symbols"
            checked={includeSymbols}
            onChange={e => setIncludeSymbols(e.target.checked)}
            className="w-4 h-4 rounded accent-accent focus:ring-accent"
          />
          <label htmlFor="symbols" className="ml-2 text-sm font-medium">
            Include Symbols (!@#$%...)
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={generatePassword}
          className="flex-1 px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-center gap-2"
        >
          <FaSyncAlt /> Generate Password
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 text-white rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
          disabled={!password || password === 'Select at least one option'}
        >
          <FaCopy /> Copy
        </button>
      </div>

      {password && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary break-all">
          <p className="text-lg font-medium">Generated Password:</p>
          <p className="text-xl font-bold text-accent">{password}</p>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
