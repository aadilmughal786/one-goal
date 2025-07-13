'use client';

import React, { useMemo, useState } from 'react';

const TipCalculator: React.FC = () => {
  const [billAmount, setBillAmount] = useState<string>('');
  const [tipPercentage, setTipPercentage] = useState<string>('15');
  const [numPeople, setNumPeople] = useState<string>('1');

  const bill = parseFloat(billAmount);
  const tipPct = parseFloat(tipPercentage);
  const people = parseInt(numPeople);

  const tipAmount = useMemo(() => {
    if (isNaN(bill) || isNaN(tipPct) || bill <= 0 || tipPct < 0) return null;
    return (bill * tipPct) / 100;
  }, [bill, tipPct]);

  const totalAmount = useMemo(() => {
    if (tipAmount === null) return null;
    return bill + tipAmount;
  }, [bill, tipAmount]);

  const amountPerPerson = useMemo(() => {
    if (totalAmount === null || isNaN(people) || people <= 0) return null;
    return totalAmount / people;
  }, [totalAmount, people]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Tip Calculator</h2>

      <div className="mb-4">
        <label htmlFor="billAmount" className="block mb-2 text-sm font-medium">
          Bill Amount ($):
        </label>
        <input
          type="number"
          id="billAmount"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={billAmount}
          onChange={e => setBillAmount(e.target.value)}
          placeholder="e.g., 50.00"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="tipPercentage" className="block mb-2 text-sm font-medium">
          Tip Percentage (%):
        </label>
        <input
          type="number"
          id="tipPercentage"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={tipPercentage}
          onChange={e => setTipPercentage(e.target.value)}
          placeholder="e.g., 15"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="numPeople" className="block mb-2 text-sm font-medium">
          Number of People:
        </label>
        <input
          type="number"
          id="numPeople"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={numPeople}
          onChange={e => setNumPeople(e.target.value)}
          placeholder="e.g., 1"
          min="1"
        />
      </div>

      <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
        <p className="text-lg font-medium">
          Tip Amount:{' '}
          <span className="font-bold text-accent">
            {tipAmount !== null ? `$${tipAmount.toFixed(2)}` : '-'}
          </span>
        </p>
        <p className="text-lg font-medium">
          Total Amount:{' '}
          <span className="font-bold text-accent">
            {totalAmount !== null ? `$${totalAmount.toFixed(2)}` : '-'}
          </span>
        </p>
        <p className="text-lg font-medium">
          Amount per Person:{' '}
          <span className="font-bold text-accent">
            {amountPerPerson !== null ? `$${amountPerPerson.toFixed(2)}` : '-'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default TipCalculator;
