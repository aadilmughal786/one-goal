'use client';

import React, { useState } from 'react';
import { FiLoader } from 'react-icons/fi';

const LoanCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<string | null>(null);
  const [totalPayment, setTotalPayment] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateLoan = () => {
    setIsLoading(true);
    setMonthlyPayment(null);
    setTotalPayment(null);
    setAmortizationSchedule([]);

    setTimeout(() => {
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
        setAmortizationSchedule([]);
        setIsLoading(false);
        return;
      }

      const monthlyInterestRate = annualInterestRate / 100 / 12;
      const numberOfPayments = years * 12;

      let monthlyPaymentValue: number;

      if (monthlyInterestRate === 0) {
        monthlyPaymentValue = principal / numberOfPayments;
      } else {
        monthlyPaymentValue =
          (principal *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments))) /
          (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      }

      setMonthlyPayment(monthlyPaymentValue.toFixed(2));
      setTotalPayment((monthlyPaymentValue * numberOfPayments).toFixed(2));

      // Generate amortization schedule (Monthly)
      const schedule = [];
      let remainingBalance = principal;

      for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPaymentValue - interestPayment;
        remainingBalance -= principalPayment;

        schedule.push({
          month: i,
          startingBalance: (remainingBalance + principalPayment).toFixed(2),
          interestPayment: interestPayment.toFixed(2),
          principalPayment: principalPayment.toFixed(2),
          endingBalance: Math.max(0, remainingBalance).toFixed(2), // Ensure no negative balance
        });
      }
      setAmortizationSchedule(schedule);
      setIsLoading(false);
    }, 1000); // 1 second fake delay
  };

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Loan Calculator</h2>
      <div className="mb-4">
        <label htmlFor="loanAmount" className="block mb-2 text-sm font-medium">
          Loan Amount ($):
        </label>
        <input
          type="number"
          id="loanAmount"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={loanTerm}
          onChange={e => setLoanTerm(e.target.value)}
          placeholder="e.g., 5"
        />
      </div>
      <button
        onClick={calculateLoan}
        disabled={isLoading}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Calculating...</span>
          </>
        ) : (
          <span>Calculate Loan</span>
        )}
      </button>
      {monthlyPayment && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
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

      {amortizationSchedule.length > 0 && (
        <div className="overflow-x-auto mt-8">
          <h3 className="mb-4 text-xl font-semibold">Amortization Schedule (Payer&apos;s View)</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="p-2 border border-border-primary">Month</th>
                <th className="p-2 border border-border-primary">Starting Balance</th>
                <th className="p-2 border border-border-primary">Interest Paid</th>
                <th className="p-2 border border-border-primary">Principal Paid</th>
                <th className="p-2 border border-border-primary">Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {amortizationSchedule.map((payment, index) => (
                <tr key={index} className="even:bg-bg-primary odd:bg-bg-secondary">
                  <td className="p-2 border border-border-primary">{payment.month}</td>
                  <td className="p-2 border border-border-primary">${payment.startingBalance}</td>
                  <td className="p-2 border border-border-primary">${payment.interestPayment}</td>
                  <td className="p-2 border border-border-primary">${payment.principalPayment}</td>
                  <td className="p-2 border border-border-primary">${payment.endingBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {amortizationSchedule.length > 0 && (
        <div className="overflow-x-auto mt-8">
          <h3 className="mb-4 text-xl font-semibold">Amortization Schedule (Lender&apos;s View)</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="p-2 border border-border-primary">Month</th>
                <th className="p-2 border border-border-primary">Starting Principal</th>
                <th className="p-2 border border-border-primary">Profit</th>
                <th className="p-2 border border-border-primary">Principal Received</th>
                <th className="p-2 border border-border-primary">Ending Principal</th>
              </tr>
            </thead>
            <tbody>
              {amortizationSchedule.map((payment, index) => (
                <tr key={index} className="even:bg-bg-primary odd:bg-bg-secondary">
                  <td className="p-2 border border-border-primary">{payment.month}</td>
                  <td className="p-2 border border-border-primary">${payment.startingBalance}</td>
                  <td className="p-2 border border-border-primary">${payment.interestPayment}</td>
                  <td className="p-2 border border-border-primary">${payment.principalPayment}</td>
                  <td className="p-2 border border-border-primary">${payment.endingBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;
