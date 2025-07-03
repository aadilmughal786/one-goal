// app/components/common/FilterDropdown.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export interface FilterOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const SelectedIcon = selectedOption?.icon;

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex justify-between items-center py-3 pr-3 pl-4 w-full rounded-full border cursor-pointer text-text-primary sm:w-40 border-border-primary bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-border-accent"
      >
        <span className="flex gap-2 items-center">
          {SelectedIcon && <SelectedIcon className="text-text-secondary" />}
          <span>{selectedOption?.label}</span>
        </span>
        <FiChevronDown
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full z-10 p-2 mb-2 w-48 rounded-lg border shadow-lg bg-bg-tertiary border-border-primary animate-fade-in-up">
          {options.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full gap-3 px-3 py-2 text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary ${
                  selectedValue === option.value ? 'bg-blue-500/50' : ''
                }`}
              >
                <Icon />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
