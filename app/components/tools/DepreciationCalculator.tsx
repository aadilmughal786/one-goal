'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaCalendarAlt, FaChartLine, FaDollarSign } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DepreciationCalculator: React.FC = () => {
  const [initialValue, setInitialValue] = useState<string>('');
  const [salvageValue, setSalvageValue] = useState<string>('');
  const [usefulLife, setUsefulLife] = useState<string>('');
  const [currentAge, setCurrentAge] = useState<string>('');
  const [method, setMethod] = useState<'straight-line' | 'double-declining' | 'sum-of-years'>(
    'straight-line'
  );
  const [results, setResults] = useState<{
    currentValue: number;
    totalDepreciation: number;
    annualDepreciation: number;
    depreciationRate: number;
  } | null>(null);

  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  const methodOptions = [
    {
      value: 'straight-line',
      label: 'Straight Line',
      description: "Equal depreciation each year over the asset's useful life.",
    },
    {
      value: 'double-declining',
      label: 'Double Declining Balance',
      description: 'Higher depreciation in early years, declining over time.',
    },
    {
      value: 'sum-of-years',
      label: "Sum of Years' Digits",
      description: 'Depreciation decreases each year based on remaining useful life.',
    },
  ];

  const calculateDepreciation = useMemo(() => {
    const initial = parseFloat(initialValue);
    const salvage = parseFloat(salvageValue) || 0;
    const life = parseFloat(usefulLife);
    const age = parseFloat(currentAge);

    if (
      isNaN(initial) ||
      isNaN(life) ||
      isNaN(age) ||
      age < 0 ||
      age > life ||
      initial < 0 ||
      life <= 0
    ) {
      return null;
    }

    let currentValue = initial;
    let totalDepreciation = 0;
    let annualDepreciation = 0;

    switch (method) {
      case 'straight-line':
        annualDepreciation = (initial - salvage) / life;
        totalDepreciation = annualDepreciation * age;
        currentValue = initial - totalDepreciation;
        break;

      case 'double-declining':
        const rate = 2 / life;
        currentValue = initial;
        let tempTotalDepreciation = 0;
        for (let year = 1; year <= age; year++) {
          const yearlyDepreciation = Math.min(
            currentValue * rate,
            Math.max(0, initial - salvage - tempTotalDepreciation)
          );
          tempTotalDepreciation += yearlyDepreciation;
          currentValue -= yearlyDepreciation;
        }
        totalDepreciation = tempTotalDepreciation;
        annualDepreciation = age > 0 ? totalDepreciation / age : 0;
        break;

      case 'sum-of-years':
        const sumOfYears = (life * (life + 1)) / 2;
        let tempSOYDTotalDepreciation = 0;
        for (let year = 1; year <= age; year++) {
          const yearlyDepreciation = ((life - year + 1) / sumOfYears) * (initial - salvage);
          tempSOYDTotalDepreciation += yearlyDepreciation;
        }
        totalDepreciation = tempSOYDTotalDepreciation;
        currentValue = initial - totalDepreciation;
        annualDepreciation = age > 0 ? totalDepreciation / age : 0;
        break;
    }

    return {
      currentValue: Math.max(currentValue, salvage),
      totalDepreciation,
      annualDepreciation,
      depreciationRate: ((initial - Math.max(currentValue, salvage)) / initial) * 100,
    };
  }, [initialValue, salvageValue, usefulLife, currentAge, method]);

  useEffect(() => {
    setResults(calculateDepreciation);
  }, [calculateDepreciation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setIsMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const chartData = useMemo(() => {
    const data = [];
    const initial = parseFloat(initialValue);
    const salvage = parseFloat(salvageValue) || 0;
    const life = parseFloat(usefulLife);

    if (isNaN(initial) || isNaN(life) || initial < 0 || life <= 0) {
      return [];
    }

    let currentBookValue = initial;
    let totalDepreciation = 0;

    for (let year = 0; year <= life; year++) {
      let yearlyDepreciation = 0;
      if (year > 0) {
        switch (method) {
          case 'straight-line':
            yearlyDepreciation = (initial - salvage) / life;
            break;
          case 'double-declining':
            const rate = 2 / life;
            yearlyDepreciation = Math.min(
              currentBookValue * rate,
              Math.max(0, initial - salvage - totalDepreciation)
            );
            break;
          case 'sum-of-years':
            const sumOfYears = (life * (life + 1)) / 2;
            yearlyDepreciation = ((life - year + 1) / sumOfYears) * (initial - salvage);
            break;
        }
      }
      totalDepreciation += yearlyDepreciation;
      currentBookValue = Math.max(salvage, initial - totalDepreciation);
      data.push({
        year: year,
        'Book Value': currentBookValue,
      });
    }
    return data;
  }, [initialValue, salvageValue, usefulLife, method]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-2xl font-semibold">Depreciation Calculator</h2>

      {/* --- Input Grid --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            <FaDollarSign className="inline mr-1 w-4 h-4" />
            Initial Value
          </label>
          <input
            type="number"
            value={initialValue}
            onChange={e => setInitialValue(e.target.value)}
            className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Enter initial purchase price"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            <FaDollarSign className="inline mr-1 w-4 h-4" />
            Salvage Value
          </label>
          <input
            type="number"
            value={salvageValue}
            onChange={e => setSalvageValue(e.target.value)}
            className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Expected value at end of life (optional)"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            <FaCalendarAlt className="inline mr-1 w-4 h-4" />
            Useful Life (years)
          </label>
          <input
            type="number"
            value={usefulLife}
            onChange={e => setUsefulLife(e.target.value)}
            className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="Expected lifespan in years"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            <FaCalendarAlt className="inline mr-1 w-4 h-4" />
            Current Age (years)
          </label>
          <input
            type="number"
            value={currentAge}
            onChange={e => setCurrentAge(e.target.value)}
            className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="How old is the asset now?"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            <FaChartLine className="inline mr-1 w-4 h-4" />
            Depreciation Method
          </label>
          <div className="relative" ref={methodDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
              className="flex justify-between items-center px-4 py-2 w-full text-left rounded-lg border cursor-pointer text-text-primary bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
              aria-haspopup="listbox"
              aria-expanded={isMethodDropdownOpen}
            >
              {methodOptions.find(opt => opt.value === method)?.label}
              <FiChevronDown
                className={`transition-transform duration-200 ${
                  isMethodDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isMethodDropdownOpen && (
              <div
                className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary"
                role="listbox"
              >
                {methodOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setMethod(option.value as any);
                      setIsMethodDropdownOpen(false);
                    }}
                    className="block px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                    role="option"
                    aria-selected={method === option.value}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-text-primary">{option.label}</p>
                      <p className="text-xs text-text-secondary">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Results Section --- */}
      {results && (
        <div className="p-6 mt-6 rounded-lg border bg-bg-primary border-border-primary">
          <h3 className="mb-4 text-xl font-semibold">Results</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary">Current Value</p>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(results.currentValue)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary">Total Depreciation</p>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(results.totalDepreciation)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary">Average Annual Depreciation</p>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(results.annualDepreciation)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-secondary">
              <p className="text-sm text-text-secondary">Depreciation Rate</p>
              <p className="text-2xl font-bold text-accent">
                {results.depreciationRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Method Used:{' '}
            <span className="font-semibold text-text-primary">
              {method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </p>
        </div>
      )}

      {initialValue && !results && (
        <div className="p-4 mt-6 text-red-500 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">Please enter valid asset details to see results.</p>
        </div>
      )}

      {/* --- Chart Section --- */}
      {results && chartData.length > 0 && (
        <div className="p-6 mt-8 rounded-lg border bg-bg-primary border-border-primary">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">Depreciation Schedule</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
              <XAxis dataKey="year" stroke="var(--text-secondary)" unit=" yr" />
              <YAxis
                stroke="var(--text-secondary)"
                tickFormatter={value => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--text-accent)' }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={label => `Year ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Book Value"
                stroke="var(--text-accent)"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DepreciationCalculator;
