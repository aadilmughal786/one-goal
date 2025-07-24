// app/components/tools/NumerologyCalculator.tsx
'use client';

import { DateTimePicker } from '@/components/common/DateTimePicker';
import { format } from 'date-fns';
import React, { useState } from 'react';

const numerologyMap: { [key: string]: number } = {
  A: 1,
  J: 1,
  S: 1,
  B: 2,
  K: 2,
  T: 2,
  C: 3,
  L: 3,
  U: 3,
  D: 4,
  M: 4,
  V: 4,
  E: 5,
  N: 5,
  W: 5,
  F: 6,
  O: 6,
  X: 6,
  G: 7,
  P: 7,
  Y: 7,
  H: 8,
  Q: 8,
  Z: 8,
  I: 9,
  R: 9,
};

const reduceNumber = (num: number): number => {
  if (num === 11 || num === 22 || num === 33) {
    return num;
  }
  while (num > 9) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
};

const calculateLifePath = (dob: Date | null): number | null => {
  if (!dob) return null;

  const year = dob.getFullYear();
  const month = dob.getMonth() + 1; // Month is 0-indexed
  const day = dob.getDate();

  const reducedMonth = reduceNumber(month);
  const reducedDay = reduceNumber(day);
  const reducedYear = reduceNumber(year);

  return reduceNumber(reducedMonth + reducedDay + reducedYear);
};

const calculateNumerology = (name: string, dob: Date | null) => {
  const cleanedName = name.toUpperCase().replace(/[^A-Z]/g, '');
  let destinySum = 0;
  let soulUrgeSum = 0; // Vowels
  let personalitySum = 0; // Consonants

  for (const char of cleanedName) {
    const value = numerologyMap[char];
    if (value) {
      destinySum += value;
      if ('AEIOU'.includes(char)) {
        soulUrgeSum += value;
      } else {
        personalitySum += value;
      }
    }
  }

  const lifePath = calculateLifePath(dob);

  return {
    destiny: reduceNumber(destinySum),
    soulUrge: reduceNumber(soulUrgeSum),
    personality: reduceNumber(personalitySum),
    lifePath: lifePath,
  };
};

const numberDescriptions: { [key: number]: string } = {
  1: 'The Leader: Independent, ambitious, and a natural pioneer. You are driven to achieve and lead.',
  2: 'The Peacemaker: Cooperative, diplomatic, and sensitive. You thrive in harmony and partnership.',
  3: 'The Communicator: Creative, expressive, and optimistic. You bring joy and inspiration to others.',
  4: 'The Builder: Practical, disciplined, and stable. You are a hard worker who values security and order.',
  5: 'The Adventurer: Versatile, restless, and freedom-loving. You seek new experiences and embrace change.',
  6: 'The Nurturer: Responsible, compassionate, and family-oriented. You are drawn to service and care for others.',
  7: 'The Seeker: Analytical, spiritual, and introspective. You are a deep thinker who values truth and wisdom.',
  8: 'The Achiever: Ambitious, powerful, and successful. You are driven by material success and recognition.',
  9: 'The Humanitarian: Compassionate, selfless, and idealistic. You are motivated by a desire to make the world a better place.',
  11: 'The Master Intuitor: Highly intuitive, inspiring, and visionary. You have the potential for great spiritual insight.',
  22: 'The Master Builder: Practical idealist, capable of manifesting grand visions. You have the power to achieve monumental things.',
  33: 'The Master Teacher/Healer: The &apos;Christ Consciousness&apos; number, focused on unconditional love and service to humanity.',
};

const NumerologyCalculator: React.FC = () => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [results, setResults] = useState<{
    destiny: number;
    soulUrge: number;
    personality: number;
    lifePath: number | null;
  } | null>(null);

  const handleCalculate = () => {
    if (name.trim() === '' && !dob) {
      setResults(null);
      return;
    }
    setResults(calculateNumerology(name, dob));
  };

  const handleDateChange = (date: Date | null) => {
    setDob(date);
    setIsDatePickerOpen(false);
    handleCalculate();
  };

  return (
    <div className="p-6 mx-auto w-full max-w-4xl rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-3xl font-bold text-center">Numerology Calculator</h2>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium">
            Enter Full Name:
          </label>
          <input
            type="text"
            id="name"
            className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={name}
            onChange={e => {
              setName(e.target.value);
              handleCalculate();
            }}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="dob" className="block mb-2 text-sm font-medium">
            Enter Date of Birth:
          </label>
          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="p-3 w-full text-left rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {dob ? format(dob, 'yyyy-MM-dd') : 'Select Date'}
          </button>
          <DateTimePicker
            isOpen={isDatePickerOpen}
            value={dob}
            onChange={handleDateChange}
            onClose={() => setIsDatePickerOpen(false)}
            mode="date"
          />
        </div>
      </div>

      {results && (results.destiny || results.lifePath) && (
        <div className="p-6 mb-8 rounded-md border shadow-md bg-bg-primary border-border-primary">
          <h3 className="mb-4 text-2xl font-semibold text-center">Your Numerology Profile</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.destiny > 0 && (
              <div className="p-4 rounded-md bg-bg-tertiary">
                <p className="text-lg font-medium">
                  Destiny Number: <span className="font-bold text-accent">{results.destiny}</span>
                </p>
                <p className="text-sm text-text-secondary">{numberDescriptions[results.destiny]}</p>
              </div>
            )}
            {results.lifePath && (
              <div className="p-4 rounded-md bg-bg-tertiary">
                <p className="text-lg font-medium">
                  Life Path Number:{' '}
                  <span className="font-bold text-accent">{results.lifePath}</span>
                </p>
                <p className="text-sm text-text-secondary">
                  {numberDescriptions[results.lifePath]}
                </p>
              </div>
            )}
            {results.soulUrge > 0 && (
              <div className="p-4 rounded-md bg-bg-tertiary">
                <p className="text-lg font-medium">
                  Soul Urge Number (Vowels):{' '}
                  <span className="font-bold text-accent">{results.soulUrge}</span>
                </p>
                <p className="text-sm text-text-secondary">
                  {numberDescriptions[results.soulUrge]}
                </p>
              </div>
            )}
            {results.personality > 0 && (
              <div className="p-4 rounded-md bg-bg-tertiary">
                <p className="text-lg font-medium">
                  Personality Number (Consonants):{' '}
                  <span className="font-bold text-accent">{results.personality}</span>
                </p>
                <p className="text-sm text-text-secondary">
                  {numberDescriptions[results.personality]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 rounded-lg border shadow-md bg-bg-primary border-border-primary">
        <h3 className="mb-4 text-2xl font-semibold text-center">
          How These Numbers Are Calculated
        </h3>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">1. Destiny Number (Expression Number)</h4>
          <p className="mb-2 text-text-secondary">
            Calculated from your full birth name. It reveals your natural talents, abilities, and
            potential.
          </p>
          <p className="text-text-secondary">
            <strong>Calculation:</strong> Assign a number to each letter of your full name using the
            chart below. Sum all the numbers and then reduce the total to a single digit (unless
            it&apos;s a Master Number: 11, 22, 33).
          </p>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">2. Life Path Number</h4>
          <p className="mb-2 text-text-secondary">
            Derived from your full date of birth. It indicates your primary lesson or purpose in
            life, and the path you are destined to walk.
          </p>
          <p className="text-text-secondary">
            <strong>Calculation:</strong> Reduce the month, day, and year of your birth to single
            digits (or Master Numbers). Then, sum these three reduced numbers and reduce the total
            to a single digit (or Master Number).
          </p>
          <p className="mt-2 text-sm text-text-secondary">Example: DOB 1990-12-25</p>
          <ul className="ml-4 text-sm list-disc list-inside text-text-secondary">
            <li>Month (12): 1 + 2 = 3</li>
            <li>Day (25): 2 + 5 = 7</li>
            <li>Year (1990): 1 + 9 + 9 + 0 = 19 &amp;rarr; 1 + 9 = 10 &amp;rarr; 1 + 0 = 1</li>
            <li>Life Path: 3 + 7 + 1 = 11 (Master Number, not reduced further)</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">
            3. Soul Urge Number (Heart&apos;s Desire Number)
          </h4>
          <p className="mb-2 text-text-secondary">
            Calculated from the vowels in your full birth name. It represents your inner desires,
            motivations, and what you truly want in life.
          </p>
          <p className="text-text-secondary">
            <strong>Calculation:</strong> Sum the numerical values of only the vowels (A, E, I, O,
            U) in your full name. Reduce the total to a single digit (or Master Number).
          </p>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">4. Personality Number</h4>
          <p className="mb-2 text-text-secondary">
            Derived from the consonants in your full birth name. It reflects the aspects of your
            personality that you show to the outside world.
          </p>
          <p className="text-text-secondary">
            <strong>Calculation:</strong> Sum the numerical values of only the consonants in your
            full name. Reduce the total to a single digit.
          </p>
        </div>

        <div className="p-4 mt-6 rounded-md bg-bg-tertiary">
          <h4 className="mb-2 text-xl font-semibold text-center">
            Numerology Letter-to-Number Chart
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-text-secondary">
            <div>1: A, J, S</div>
            <div>2: B, K, T</div>
            <div>3: C, L, U</div>
            <div>4: D, M, V</div>
            <div>5: E, N, W</div>
            <div>6: F, O, X</div>
            <div>7: G, P, Y</div>
            <div>8: H, Q, Z</div>
            <div>9: I, R</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumerologyCalculator;
