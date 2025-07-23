// app/components/tools/InvestmentReturnCalculator.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';

const InvestmentReturnCalculator: React.FC = () => {
  const [initialAmount, setInitialAmount] = useState('1000');
  const [monthlyContribution, setMonthlyContribution] = useState('100');
  const [interestRate, setInterestRate] = useState('7');
  const [years, setYears] = useState('10');

  const results = useMemo(() => {
    const P = parseFloat(initialAmount);
    const PMT = parseFloat(monthlyContribution);
    const r = parseFloat(interestRate) / 100;
    const t = parseInt(years, 10);

    if (isNaN(P) || isNaN(PMT) || isNaN(r) || isNaN(t)) {
      return null;
    }

    const n = 12; // Compounded monthly
    const futureValue =
      P * Math.pow(1 + r / n, n * t) + PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
    const totalInvested = P + PMT * 12 * t;
    const totalInterest = futureValue - totalInvested;

    return {
      futureValue,
      totalInvested,
      totalInterest,
    };
  }, [initialAmount, monthlyContribution, interestRate, years]);

  return (
    <div className="p-4 rounded-lg bg-bg-primary text-text-primary">
      <h2 className="mb-2 text-2xl font-bold text-center">Investment Return Calculator</h2>
      <p className="mb-6 text-center text-text-secondary">
        Project the future value of your investments.
      </p>

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-text-secondary">Initial Amount ($)</span>
          </label>
          <input
            type="number"
            value={initialAmount}
            onChange={e => setInitialAmount(e.target.value)}
            className="p-3 w-full rounded-md border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-text-secondary">Monthly Contribution ($)</span>
          </label>
          <input
            type="number"
            value={monthlyContribution}
            onChange={e => setMonthlyContribution(e.target.value)}
            className="p-3 w-full rounded-md border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-text-secondary">Annual Interest Rate (%)</span>
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={e => setInterestRate(e.target.value)}
            className="p-3 w-full rounded-md border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-text-secondary">Investment Period (Years)</span>
          </label>
          <input
            type="number"
            value={years}
            onChange={e => setYears(e.target.value)}
            className="p-3 w-full rounded-md border text-text-primary border-border-primary bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border-accent"
          />
        </div>
      </div>

      {results && (
        <div className="p-6 text-center rounded-lg border bg-bg-secondary border-border-primary">
          <FiTrendingUp className="mx-auto mb-4 text-5xl text-green-500" />
          <h3 className="text-lg font-semibold text-text-primary">Projected Value:</h3>
          <p className="mb-2 text-4xl font-bold text-green-500">
            $
            {results.futureValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="grid grid-cols-1 gap-4 mt-4 text-sm md:grid-cols-2">
            <p>
              <span className="text-text-secondary">Total Invested:</span> $
              {results.totalInvested.toLocaleString()}
            </p>
            <p>
              <span className="text-text-secondary">Total Interest:</span> $
              {results.totalInterest.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentReturnCalculator;
