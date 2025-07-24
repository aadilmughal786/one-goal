'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import CryptoJS from 'crypto-js';
import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { MdContentCopy } from 'react-icons/md';

const HashCalculator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputText, setInputText] = useState('');
  const [hashType, setHashType] = useState('MD5');
  const [hashOutput, setHashOutput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculateHash = () => {
    if (!inputText) {
      setHashOutput('');
      showToast('Please enter text to calculate hash.', 'error');
      return;
    }

    let hash;
    switch (hashType) {
      case 'MD5':
        hash = CryptoJS.MD5(inputText).toString();
        break;
      case 'SHA1':
        hash = CryptoJS.SHA1(inputText).toString();
        break;
      case 'SHA256':
        hash = CryptoJS.SHA256(inputText).toString();
        break;
      case 'SHA512':
        hash = CryptoJS.SHA512(inputText).toString();
        break;
      case 'RIPEMD160':
        hash = CryptoJS.RIPEMD160(inputText).toString();
        break;
      default:
        hash = '';
    }
    setHashOutput(hash);
  };

  const copyToClipboard = () => {
    if (hashOutput) {
      navigator.clipboard.writeText(hashOutput);
      showToast('Hash copied to clipboard!', 'success');
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Hash Calculator</h2>
      <div className="mb-4">
        <label htmlFor="hashType" className="block mb-2 text-sm font-bold text-text-secondary">
          Hash Type:
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            {hashType}
            <FiChevronDown
              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isDropdownOpen && (
            <div
              className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
              role="listbox"
            >
              {['MD5', 'SHA1', 'SHA256', 'SHA512', 'RIPEMD160'].map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setHashType(option);
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                  role="option"
                  aria-selected={hashType === option}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
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
          placeholder="Enter text to hash"
        ></textarea>
      </div>
      <button
        onClick={calculateHash}
        className="px-4 py-2 w-full text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Calculate Hash
      </button>
      {hashOutput && (
        <div className="flex justify-between items-center p-3 mt-4 rounded-md border bg-bg-secondary border-border-primary">
          <span className="font-mono break-all text-text-primary">{hashOutput}</span>
          <button
            onClick={copyToClipboard}
            className="p-2 ml-4 text-white bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Copy to clipboard"
          >
            <MdContentCopy />
          </button>
        </div>
      )}
    </div>
  );
};

export default HashCalculator;
