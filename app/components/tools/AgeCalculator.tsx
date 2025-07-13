'use client';

import React, { useState, useMemo } from 'react';
import { FaBirthdayCake } from 'react-icons/fa';

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

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Age Calculator</h2>

      <div className="mb-4">
        <label htmlFor="birthDate" className="block mb-2 text-sm font-medium">
          Your Birth Date:
        </label>
        <input
          type="date"
          id="birthDate"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
        />
      </div>

      {calculateAge && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
          <p className="text-lg font-medium">
            Your Age:{' '}
            <span className="font-bold text-accent">
              {calculateAge.years} years, {calculateAge.months} months, and {calculateAge.days} days
            </span>
          </p>
        </div>
      )}
      {birthDate && !calculateAge && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary text-red-500">
          <p className="text-lg font-medium">Invalid date. Please enter a valid birth date.</p>
        </div>
      )}
    </div>
  );
};

export default AgeCalculator;
