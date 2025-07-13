'use client';

import React, { useEffect, useMemo, useState } from 'react';

const AgeCalculator: React.FC = () => {
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);

  const calculateAge = useMemo(() => {
    if (!birthDate) return null;

    const today = new Date();
    const dob = new Date(birthDate);

    if (isNaN(dob.getTime())) return null; // Invalid date

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); // Days in previous month
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }, [birthDate]);

  useEffect(() => {
    setAge(calculateAge);
  }, [calculateAge]);

  return (
    <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Age Calculator</h2>

      <div className="mb-4">
        <label htmlFor="birthDate" className="block mb-2 text-sm font-medium">
          Your Birth Date:
        </label>
        <input
          type="date"
          id="birthDate"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
        />
      </div>

      {age && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">
            Your Age:{' '}
            <span className="font-bold text-accent">
              {age.years} years, {age.months} months, and {age.days} days
            </span>
          </p>
        </div>
      )}
      {birthDate && !age && (
        <div className="p-4 mt-6 text-red-500 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">Invalid date. Please enter a valid birth date.</p>
        </div>
      )}
    </div>
  );
};

export default AgeCalculator;
