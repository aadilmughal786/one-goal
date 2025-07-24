'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw, FiChevronDown } from 'react-icons/fi';
import { FaExchangeAlt } from 'react-icons/fa';

interface Unit {
  value: string;
  label: string;
  category: string;
  description: string;
}

const units: Unit[] = [
  {
    value: 'meter',
    label: 'Meter (m)',
    category: 'Metric',
    description: 'The base unit of length in the International System of Units (SI).',
  },
  {
    value: 'kilometer',
    label: 'Kilometer (km)',
    category: 'Metric',
    description: 'A unit of length equal to 1,000 meters.',
  },
  {
    value: 'centimeter',
    label: 'Centimeter (cm)',
    category: 'Metric',
    description: 'A unit of length equal to 0.01 meters.',
  },
  {
    value: 'millimeter',
    label: 'Millimeter (mm)',
    category: 'Metric',
    description: 'A unit of length equal to 0.001 meters.',
  },
  {
    value: 'micrometer',
    label: 'Micrometer (µm)',
    category: 'Metric',
    description: 'A unit of length equal to 0.000001 meters (one millionth of a meter).',
  },
  {
    value: 'nanometer',
    label: 'Nanometer (nm)',
    category: 'Metric',
    description: 'A unit of length equal to 0.000000001 meters (one billionth of a meter).',
  },
  {
    value: 'mile',
    label: 'Mile (mi)',
    category: 'Imperial',
    description: 'A unit of length equal to 1,609.34 meters.',
  },
  {
    value: 'yard',
    label: 'Yard (yd)',
    category: 'Imperial',
    description: 'A unit of length equal to 0.9144 meters.',
  },
  {
    value: 'foot',
    label: 'Foot (ft)',
    category: 'Imperial',
    description: 'A unit of length equal to 0.3048 meters.',
  },
  {
    value: 'inch',
    label: 'Inch (in)',
    category: 'Imperial',
    description: 'A unit of length equal to 0.0254 meters.',
  },
  {
    value: 'nautical_mile',
    label: 'Nautical Mile (nmi)',
    category: 'Other',
    description: 'A unit of length used in marine and aerial navigation, equal to 1,852 meters.',
  },
  {
    value: 'light_year',
    label: 'Light-Year (ly)',
    category: 'Astronomical',
    description:
      'The distance light travels in one Julian year in vacuum, approximately 9.461 trillion kilometers.',
  },
  {
    value: 'astronomical_unit',
    label: 'Astronomical Unit (AU)',
    category: 'Astronomical',
    description:
      'The average distance from the Earth to the Sun, approximately 149.6 million kilometers.',
  },
  {
    value: 'parsec',
    label: 'Parsec (pc)',
    category: 'Astronomical',
    description:
      'A unit of length used to measure large distances to objects outside the Solar System, equal to about 3.26 light-years.',
  },
];

// Conversion factors to Meters (m)
const conversionFactors: { [key: string]: number } = {
  meter: 1,
  kilometer: 1000,
  centimeter: 0.01,
  millimeter: 0.001,
  micrometer: 0.000001,
  nanometer: 0.000000001,
  mile: 1609.34,
  yard: 0.9144,
  foot: 0.3048,
  inch: 0.0254,
  nautical_mile: 1852,
  light_year: 9.461e15, // 9.461 trillion kilometers in meters
  astronomical_unit: 1.496e11, // 149.6 million kilometers in meters
  parsec: 3.086e16, // 3.086 trillion kilometers in meters
};

const LengthConverter: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputValue, setInputValue] = useState<number | string>('');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('foot');
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

    const valueInMeters = numValue * conversionFactors[fromUnit];
    const convertedValue = valueInMeters / conversionFactors[toUnit];
    setOutputValue(convertedValue.toPrecision(6)); // To 6 significant figures for precision
  };

  const clearFields = () => {
    setInputValue('');
    setOutputValue('');
    setFromUnit('meter');
    setToUnit('foot');
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
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Length Converter</h2>

      <div className="mb-4">
        <label htmlFor="inputValue" className="block text-text-secondary text-sm font-bold mb-2">
          Value:
        </label>
        <input
          id="inputValue"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Enter value to convert"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-center">
        <div>
          <label htmlFor="fromUnit" className="block text-text-secondary text-sm font-bold mb-2">
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
                className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary max-h-60 overflow-y-auto"
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
            className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            title="Swap Units"
          >
            <FaExchangeAlt />
          </button>
        </div>

        <div>
          <label htmlFor="toUnit" className="block text-text-secondary text-sm font-bold mb-2">
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
                className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary max-h-60 overflow-y-auto"
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

      <div className="flex space-x-2 mb-4">
        <button
          onClick={handleConvert}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Convert
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {outputValue && (
        <div className="mt-4">
          <label htmlFor="outputValue" className="block text-text-secondary text-sm font-bold mb-2">
            Converted Value:
          </label>
          <input
            id="outputValue"
            type="text"
            className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={outputValue} // Display as string
            readOnly
          />
        </div>
      )}

      <div className="mt-8 p-4 bg-bg-secondary rounded-lg border border-border-primary">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Length Units Explained:</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-bg-primary border border-border-primary rounded-md">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b border-border-primary text-left text-text-primary bg-bg-tertiary">
                  Unit
                </th>
                <th className="py-3 px-4 border-b border-border-primary text-left text-text-primary bg-bg-tertiary">
                  Category
                </th>
                <th className="py-3 px-4 border-b border-border-primary text-left text-text-primary bg-bg-tertiary">
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
                  <td className="py-3 px-4 border-b border-border-primary text-text-primary font-medium">
                    {unit.label}
                  </td>
                  <td className="py-3 px-4 border-b border-border-primary text-text-secondary">
                    {unit.category}
                  </td>
                  <td className="py-3 px-4 border-b border-border-primary text-text-secondary">
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

export default LengthConverter;
