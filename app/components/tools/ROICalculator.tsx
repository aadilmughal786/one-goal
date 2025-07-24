'use client';

import React, { useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiRefreshCcw } from 'react-icons/fi';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const ROICalculator: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [netProfit, setNetProfit] = useState<number | string>('');
  const [costOfInvestment, setCostOfInvestment] = useState<number | string>('');
  const [roiResult, setRoiResult] = useState<string | null>(null);

  const calculateROI = () => {
    const np = parseFloat(netProfit as string);
    const ci = parseFloat(costOfInvestment as string);

    if (isNaN(np) || isNaN(ci)) {
      showToast('Please enter valid numbers for all fields.', 'error');
      setRoiResult(null);
      return;
    }

    if (ci === 0) {
      showToast('Cost of Investment cannot be zero.', 'error');
      setRoiResult(null);
      return;
    }

    const result = (np / ci) * 100;
    setRoiResult(result.toFixed(2) + '%');
  };

  const clearFields = () => {
    setNetProfit('');
    setCostOfInvestment('');
    setRoiResult(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 bg-bg-primary rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-text-primary mb-4">ROI Calculator</h2>

      <div className="mb-4">
        <label htmlFor="netProfit" className="block text-text-secondary text-sm font-bold mb-2">
          Net Profit (or Gain from Investment):
        </label>
        <input
          id="netProfit"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={netProfit}
          onChange={e => setNetProfit(e.target.value)}
          placeholder="e.g., 1000"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="costOfInvestment"
          className="block text-text-secondary text-sm font-bold mb-2"
        >
          Cost of Investment:
        </label>
        <input
          id="costOfInvestment"
          type="number"
          step="any"
          className="w-full p-2 border border-border-primary rounded-md bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={costOfInvestment}
          onChange={e => setCostOfInvestment(e.target.value)}
          placeholder="e.g., 5000"
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={calculateROI}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculate ROI
        </button>
        <button
          onClick={clearFields}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {roiResult !== null && (
        <div className="mt-4 p-3 bg-bg-secondary rounded-md border border-border-primary">
          <h3 className="text-lg font-semibold text-text-primary mb-2">ROI:</h3>
          <p className="text-text-primary text-2xl font-bold">{roiResult}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-bg-secondary rounded-lg border border-border-primary">
        <h3 className="text-lg font-semibold text-text-primary mb-2">How ROI Works:</h3>
        <p className="text-text-secondary text-sm mb-2">
          Return on Investment (ROI) is a performance measure used to evaluate the efficiency or
          profitability of an investment or compare the efficiency of a number of different
          investments.
        </p>
        <p className="text-text-secondary text-sm">The formula for ROI is:</p>
        <div className="p-3 my-1 text-lg text-center rounded-md bg-bg-secondary">
          <InlineMath
            math={String.raw`ROI = \frac{\text{Net Profit}}{\text{Cost of Investment}} \times 100\%`}
          />
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
