'use client';

import React, { useState } from 'react';

const LoanCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<string | null>(null);
  const [totalPayment, setTotalPayment] = useState<string | null>(null);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount);
    const annualInterestRate = parseFloat(interestRate);
    const years = parseFloat(loanTerm);

    if (
      isNaN(principal) ||
      isNaN(annualInterestRate) ||
      isNaN(years) ||
      principal <= 0 ||
      annualInterestRate < 0 ||
      years <= 0
    ) {
      setMonthlyPayment('Invalid input');
      setTotalPayment(null);
      return;
    }

    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = years * 12;

    if (monthlyInterestRate === 0) {
      const monthly = principal / numberOfPayments;
      setMonthlyPayment(monthly.toFixed(2));
      setTotalPayment((monthly * numberOfPayments).toFixed(2));
      return;
    }

    const monthlyPaymentValue =
      (principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    setMonthlyPayment(monthlyPaymentValue.toFixed(2));
    setTotalPayment((monthlyPaymentValue * numberOfPayments).toFixed(2));
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Loan Calculator</h2>
      <div className="mb-4">
        <label htmlFor="loanAmount" className="block mb-2 text-sm font-medium">
          Loan Amount ($):
        </label>
        <input
          type="number"
          id="loanAmount"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={loanAmount}
          onChange={e => setLoanAmount(e.target.value)}
          placeholder="e.g., 10000"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="interestRate" className="block mb-2 text-sm font-medium">
          Annual Interest Rate (%):
        </label>
        <input
          type="number"
          id="interestRate"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={interestRate}
          onChange={e => setInterestRate(e.target.value)}
          placeholder="e.g., 5"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="loanTerm" className="block mb-2 text-sm font-medium">
          Loan Term (Years):
        </label>
        <input
          type="number"
          id="loanTerm"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={loanTerm}
          onChange={e => setLoanTerm(e.target.value)}
          placeholder="e.g., 5"
        />
      </div>
      <button
        onClick={calculateLoan}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Calculate Loan
      </button>
      {monthlyPayment && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
          <p className="text-lg font-medium">
            Monthly Payment: <span className="font-bold text-accent">${monthlyPayment}</span>
          </p>
          {totalPayment && (
            <p className="text-lg font-medium">
              Total Payment: <span className="font-bold text-accent">${totalPayment}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;
