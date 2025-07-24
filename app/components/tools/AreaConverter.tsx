'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useState, useRef, useEffect } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';
import { FiChevronDown, FiRefreshCcw } from 'react-icons/fi';

interface Unit {
  value: string;
  label: string;
  category: string;
  description: string;
}

const units: Unit[] = [
  {
    value: 'sq_meter',
    label: 'Square Meter (m²)',
    category: 'Metric',
    description: 'The base unit of area in the International System of Units (SI).',
  },
  {
    value: 'sq_kilometer',
    label: 'Square Kilometer (km²)',
    category: 'Metric',
    description: 'A unit of area equal to 1,000,000 square meters.',
  },
  {
    value: 'hectare',
    label: 'Hectare (ha)',
    category: 'Metric',
    description:
      'A metric unit of area equal to 10,000 square meters, commonly used for land measurement.',
  },
  {
    value: 'sq_foot',
    label: 'Square Foot (ft²)',
    category: 'Imperial',
    description:
      'A unit of area used in the imperial and US customary systems, equal to 0.092903 square meters.',
  },
  {
    value: 'sq_yard',
    label: 'Square Yard (yd²)',
    category: 'Imperial',
    description: 'A unit of area equal to 9 square feet or 0.836127 square meters.',
  },
  {
    value: 'acre',
    label: 'Acre (ac)',
    category: 'Imperial',
    description:
      'A unit of land area used in the imperial and US customary systems, equal to 4,046.86 square meters.',
  },
  {
    value: 'sq_mile',
    label: 'Square Mile (mi²)',
    category: 'Imperial',
    description: 'A unit of area equal to 640 acres or 2.58999 square kilometers.',
  },
  {
    value: 'guntha',
    label: 'Guntha (गुंठा)',
    category: 'Indian',
    description:
      'A traditional Indian unit of land area, varying by region. Commonly 1 Guntha = 1089 square feet (approx. 101.17 m²).',
  },
  {
    value: 'bigha',
    label: 'Bigha (बीघा)',
    category: 'Indian',
    description:
      'A traditional Indian unit of land area, highly variable by region. Typically ranges from 1/4 to 1 acre.',
  },
  {
    value: 'biswa',
    label: 'Biswa (बिस्वा)',
    category: 'Indian',
    description:
      'A traditional Indian unit of land area, usually 1/20th of a Bigha, and thus also highly variable.',
  },
  {
    value: 'katha',
    label: 'Katha (कठा)',
    category: 'Indian',
    description:
      'A traditional Indian unit of land area, varying significantly by region. Often used in Eastern India.',
  },
  {
    value: 'kanal',
    label: 'Kanal (कनाल)',
    category: 'Indian',
    description:
      'A traditional unit of land area used in Northern India and Pakistan, typically 1/8th of an acre (approx. 505.85 m²).',
  },
];

// Conversion factors to Square Meters (m²)
const conversionFactors: { [key: string]: number } = {
  sq_meter: 1,
  sq_kilometer: 1_000_000,
  hectare: 10_000,
  sq_foot: 0.092903,
  sq_yard: 0.836127,
  acre: 4046.86,
  sq_mile: 2_589_990,
  guntha: 101.17,
  bigha: 1672.26, // Average value, highly variable
  biswa: 83.61, // Average value, highly variable (1/20th of average Bigha)
  katha: 66.89, // Average value, highly variable
  kanal: 505.85,
};

const AreaConverter: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputValue, setInputValue] = useState<number | string>('');
  const [fromUnit, setFromUnit] = useState<string>('sq_meter');
  const [toUnit, setToUnit] = useState<string>('sq_foot');
  const [outputValue, setOutputValue] = useState<string>('');

  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setIsFromDropdownOpen(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setIsToDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConvert = () => {
    const numValue = parseFloat(inputValue as string);
    if (isNaN(numValue)) {
      showToast('Please enter a valid number.', 'error');
      setOutputValue('');
      return;
    }

    if (!conversionFactors[fromUnit] || !conversionFactors[toUnit]) {
      showToast('Invalid unit selected.', 'error');
      setOutputValue('');
      return;
    }

    const valueInSqMeters = numValue * conversionFactors[fromUnit];
    const convertedValue = valueInSqMeters / conversionFactors[toUnit];
    setOutputValue(convertedValue.toFixed(6)); // To 6 decimal places for precision
  };

  const clearFields = () => {
    setInputValue('');
    setOutputValue('');
    setFromUnit('sq_meter');
    setToUnit('sq_foot');
    showToast('Fields cleared.', 'info');
  };

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    // Re-convert with swapped units if there's an input value
    if (inputValue) {
      handleConvert();
    }
    showToast('Units swapped!', 'info');
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Area Converter</h2>

      <div className="mb-4">
        <label htmlFor="inputValue" className="block mb-2 text-sm font-bold text-text-secondary">
          Value:
        </label>
        <input
          id="inputValue"
          type="number"
          step="any"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Enter value to convert"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 items-center mb-4 md:grid-cols-3">
        <div>
          <label htmlFor="fromUnit" className="block mb-2 text-sm font-bold text-text-secondary">
            From Unit:
          </label>
          <div className="relative" ref={fromDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
              className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="listbox"
              aria-expanded={isFromDropdownOpen}
            >
              {units.find(unit => unit.value === fromUnit)?.label}
              <FiChevronDown
                className={`transition-transform duration-200 ${isFromDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isFromDropdownOpen && (
              <div
                className="overflow-y-auto absolute z-10 p-2 mt-2 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                role="listbox"
              >
                {units.map(unit => (
                  <button
                    key={unit.value}
                    type="button"
                    onClick={() => {
                      setFromUnit(unit.value);
                      setIsFromDropdownOpen(false);
                    }}
                    className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                    role="option"
                    aria-selected={fromUnit === unit.value}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center h-full">
          <button
            onClick={swapUnits}
            className="p-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            title="Swap Units"
          >
            <FaExchangeAlt />
          </button>
        </div>

        <div>
          <label htmlFor="toUnit" className="block mb-2 text-sm font-bold text-text-secondary">
            To Unit:
          </label>
          <div className="relative" ref={toDropdownRef}>
            <button
              type="button"
              onClick={() => setIsToDropdownOpen(!isToDropdownOpen)}
              className="flex justify-between items-center px-4 py-3 w-full text-lg text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="listbox"
              aria-expanded={isToDropdownOpen}
            >
              {units.find(unit => unit.value === toUnit)?.label}
              <FiChevronDown
                className={`transition-transform duration-200 ${isToDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isToDropdownOpen && (
              <div
                className="overflow-y-auto absolute z-10 p-2 mt-2 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                role="listbox"
              >
                {units.map(unit => (
                  <button
                    key={unit.value}
                    type="button"
                    onClick={() => {
                      setToUnit(unit.value);
                      setIsToDropdownOpen(false);
                    }}
                    className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                    role="option"
                    aria-selected={toUnit === unit.value}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={handleConvert}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Convert
        </button>
        <button
          onClick={clearFields}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {outputValue && (
        <div className="mt-4">
          <label htmlFor="outputValue" className="block mb-2 text-sm font-bold text-text-secondary">
            Converted Value:
          </label>
          <input
            id="outputValue"
            type="text"
            className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={outputValue} // Display as string
            readOnly
          />
        </div>
      )}

      <div className="p-4 mt-8 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Area Units Explained:</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-md border bg-bg-primary border-border-primary">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left border-b border-border-primary text-text-primary bg-bg-tertiary">
                  Unit
                </th>
                <th className="px-4 py-3 text-left border-b border-border-primary text-text-primary bg-bg-tertiary">
                  Category
                </th>
                <th className="px-4 py-3 text-left border-b border-border-primary text-text-primary bg-bg-tertiary">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit, index) => (
                <tr
                  key={unit.value}
                  className={index % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}
                >
                  <td className="px-4 py-3 font-medium border-b border-border-primary text-text-primary">
                    {unit.label}
                  </td>
                  <td className="px-4 py-3 border-b border-border-primary text-text-secondary">
                    {unit.category}
                  </td>
                  <td className="px-4 py-3 border-b border-border-primary text-text-secondary">
                    {unit.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AreaConverter;
