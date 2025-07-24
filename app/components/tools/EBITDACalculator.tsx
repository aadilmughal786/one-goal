'use client';

import React, { useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw } from 'react-icons/fi';

const EBITDACalculator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [netIncome, setNetIncome] = useState<number | string>('');
  const [interestExpense, setInterestExpense] = useState<number | string>('');
  const [taxes, setTaxes] = useState<number | string>('');
  const [depreciation, setDepreciation] = useState<number | string>('');
  const [amortization, setAmortization] = useState<number | string>('');
  const [ebitdaResult, setEbitdaResult] = useState<string | null>(null);

  const calculateEBITDA = () => {
    const ni = parseFloat(netIncome as string);
    const ie = parseFloat(interestExpense as string);
    const tx = parseFloat(taxes as string);
    const dp = parseFloat(depreciation as string);
    const am = parseFloat(amortization as string);

    if (isNaN(ni) || isNaN(ie) || isNaN(tx) || isNaN(dp) || isNaN(am)) {
      showToast('Please enter valid numbers for all fields.', 'error');
      setEbitdaResult(null);
      return;
    }

    const result = ni + ie + tx + dp + am;
    setEbitdaResult(result.toFixed(2));
  };

  const clearFields = () => {
    setNetIncome('');
    setInterestExpense('');
    setTaxes('');
    setDepreciation('');
    setAmortization('');
    setEbitdaResult(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">EBITDA Calculator</h2>

      <div className="mb-4">
        <label htmlFor="netIncome" className="block text-text-secondary text-sm font-bold mb-2">
          Net Income:
        </label>
        <input
          id="netIncome"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={netIncome}
          onChange={e => setNetIncome(e.target.value)}
          placeholder="e.g., 100000"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="interestExpense"
          className="block text-text-secondary text-sm font-bold mb-2"
        >
          Interest Expense:
        </label>
        <input
          id="interestExpense"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={interestExpense}
          onChange={e => setInterestExpense(e.target.value)}
          placeholder="e.g., 5000"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="taxes" className="block text-text-secondary text-sm font-bold mb-2">
          Taxes:
        </label>
        <input
          id="taxes"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={taxes}
          onChange={e => setTaxes(e.target.value)}
          placeholder="e.g., 15000"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="depreciation" className="block text-text-secondary text-sm font-bold mb-2">
          Depreciation:
        </label>
        <input
          id="depreciation"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={depreciation}
          onChange={e => setDepreciation(e.target.value)}
          placeholder="e.g., 10000"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="amortization" className="block text-text-secondary text-sm font-bold mb-2">
          Amortization:
        </label>
        <input
          id="amortization"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={amortization}
          onChange={e => setAmortization(e.target.value)}
          placeholder="e.g., 2000"
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={calculateEBITDA}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate EBITDA
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {ebitdaResult !== null && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-md border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">EBITDA:</h3>
          <p className="text-text-primary text-2xl font-bold">{ebitdaResult}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-bg-secondary rounded-lg border border-border-primary">
        <h3 className="text-lg font-semibold text-text-primary mb-2">How EBITDA Works:</h3>
        <p className="text-text-secondary text-sm mb-2">
          EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization. It is a
          measure of a company&apos;s operating performance and is often used as a proxy for cash
          flow.
        </p>
        <p className="text-text-secondary text-sm">
          The formula for EBITDA is:
          <code>Net Income + Interest Expense + Taxes + Depreciation + Amortization</code>
        </p>
      </div>
    </div>
  );
};

export default EBITDACalculator;
