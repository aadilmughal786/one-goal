'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw, FiChevronDown } from 'react-icons/fi';
import { FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

const NumberSorter: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputText, setInputText] = useState('');
  const [sortedNumbers, setSortedNumbers] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const handleSort = () => {
    if (!inputText.trim()) {
      showToast('Please enter data to sort.', 'error');
      setSortedNumbers('');
      return;
    }

    const items = inputText
      .split(/[,\s]+/)
      .map(str => str.trim())
      .filter(str => str !== '');

    if (items.length === 0) {
      showToast('No valid data found in input.', 'error');
      setSortedNumbers('');
      return;
    }

    items.sort((a, b) => {
      const strA = String(a).toLowerCase();
      const strB = String(b).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    setSortedNumbers(items.join(', '));
  };

  const clearFields = () => {
    setInputText('');
    setSortedNumbers('');
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Data Sorter</h2>

      <div className="mb-4">
        <label htmlFor="inputText" className="block text-text-secondary text-sm font-bold mb-2">
          Enter Data (comma or space separated):
        </label>
        <textarea
          id="inputText"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={5}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="e.g., apple, banana, cherry, 1, 2, 3"
        ></textarea>
      </div>

      <div className="mb-4">
        <label htmlFor="dataType" className="block text-text-secondary text-sm font-bold mb-2">
          Data Type:
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            <FiChevronDown
              className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isDropdownOpen && (
            <div
              className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
              role="listbox"
            >
              {[
                { order: 'asc', label: 'Ascending' },
                { order: 'desc', label: 'Descending' },
              ].map(option => (
                <button
                  key={option.order}
                  type="button"
                  onClick={() => {
                    setSortOrder(option.order as 'asc' | 'desc');
                    setIsDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                  role="option"
                  aria-selected={sortOrder === option.order}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleSort}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {sortOrder === 'asc' ? (
            <FaSortAlphaUp className="inline mr-2" />
          ) : (
            <FaSortAlphaDown className="inline mr-2" />
          )}{' '}
          Sort Data
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {sortedNumbers && (
        <div className="mt-4">
          <label
            htmlFor="sortedOutput"
            className="block text-text-secondary text-sm font-bold mb-2"
          >
            Sorted Data:
          </label>
          <textarea
            id="sortedOutput"
            className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            value={sortedNumbers}
            readOnly
          ></textarea>
        </div>
      )}
    </div>
  );
};

export default NumberSorter;
