'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import 'katex/dist/katex.min.css';
import React, { useState } from 'react';
import { FiRefreshCcw } from 'react-icons/fi';
import { BlockMath, InlineMath } from 'react-katex';

const CAGRCalculator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [beginningValue, setBeginningValue] = useState<number | string>('');
  const [endingValue, setEndingValue] = useState<number | string>('');
  const [numberOfYears, setNumberOfYears] = useState<number | string>('');
  const [cagrResult, setCagrResult] = useState<string | null>(null);

  const calculateCAGR = () => {
    const bv = parseFloat(beginningValue as string);
    const ev = parseFloat(endingValue as string);
    const n = parseFloat(numberOfYears as string);

    if (isNaN(bv) || isNaN(ev) || isNaN(n) || bv <= 0 || n <= 0) {
      showToast('Please enter valid positive numbers for all fields.', 'error');
      setCagrResult(null);
      return;
    }

    if (bv === 0) {
      showToast('Beginning value cannot be zero.', 'error');
      setCagrResult(null);
      return;
    }

    const result = (Math.pow(ev / bv, 1 / n) - 1) * 100;
    setCagrResult(result.toFixed(2) + '%');
  };

  const clearFields = () => {
    setBeginningValue('');
    setEndingValue('');
    setNumberOfYears('');
    setCagrResult(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">CAGR Calculator</h2>

      <div className="mb-4">
        <label
          htmlFor="beginningValue"
          className="block mb-2 text-sm font-bold text-text-secondary"
        >
          Beginning Value:
        </label>
        <input
          id="beginningValue"
          type="number"
          step="any"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={beginningValue}
          onChange={e => setBeginningValue(e.target.value)}
          placeholder="e.g., 10000"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="endingValue" className="block mb-2 text-sm font-bold text-text-secondary">
          Ending Value:
        </label>
        <input
          id="endingValue"
          type="number"
          step="any"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={endingValue}
          onChange={e => setEndingValue(e.target.value)}
          placeholder="e.g., 19500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="numberOfYears" className="block mb-2 text-sm font-bold text-text-secondary">
          Number of Years:
        </label>
        <input
          id="numberOfYears"
          type="number"
          step="any"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={numberOfYears}
          onChange={e => setNumberOfYears(e.target.value)}
          placeholder="e.g., 5"
        />
      </div>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={calculateCAGR}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate CAGR
        </button>
        <button
          onClick={clearFields}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {cagrResult !== null && (
        <div className="p-3 mt-4 rounded-md border bg-bg-secondary border-border-primary">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">CAGR:</h3>
          <p className="text-2xl font-bold text-text-primary">{cagrResult}</p>
        </div>
      )}

      <div className="p-4 mt-8 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">How CAGR Works:</h3>
        <p className="mb-2 text-sm text-text-secondary">
          Compound Annual Growth Rate (CAGR) is the mean annual growth rate of an investment over a
          specified period longer than one year. It smooths out volatile returns and provides a more
          accurate representation of growth than simple average annual growth.
        </p>
        <div className="text-sm text-text-secondary">
          <span>The formula for CAGR is:</span>{' '}
          <div className="p-3 my-1 text-lg text-center rounded-md bg-bg-secondary">
            {' '}
            <BlockMath
              math={String.raw`CAGR = \Biggl(\Biggl(\frac{EV}{BV}\Biggr)^{\frac{1}{n}} - 1\Biggr) \times 100\%`}
            />{' '}
          </div>{' '}
          <ul className="pl-5 mt-2 list-disc">
            {' '}
            <li>
              {' '}
              <InlineMath math={String.raw`EV`} /> = Ending Value{' '}
            </li>{' '}
            <li>
              {' '}
              <InlineMath math={String.raw`BV`} /> = Beginning Value{' '}
            </li>{' '}
            <li>
              {' '}
              <InlineMath math={String.raw`n`} /> = Number of Years{' '}
            </li>{' '}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CAGRCalculator;
