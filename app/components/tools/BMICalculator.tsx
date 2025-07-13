'use client';

import React, { useState } from 'react';
import { FiLoader } from 'react-icons/fi';

const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateBMI = () => {
    setIsLoading(true);
    setBmi(null);
    setCategory(null);

    setTimeout(() => {
      const h = parseFloat(height);
      const w = parseFloat(weight);

      if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
        setBmi('Invalid input');
        setCategory(null);
        setIsLoading(false);
        return;
      }

      const bmiValue = w / ((h / 100) * (h / 100)); // Height in cm, weight in kg
      setBmi(bmiValue.toFixed(2));

      if (bmiValue < 18.5) {
        setCategory('Underweight');
      } else if (bmiValue >= 18.5 && bmiValue < 24.9) {
        setCategory('Normal weight');
      } else if (bmiValue >= 25 && bmiValue < 29.9) {
        setCategory('Overweight');
      } else {
        setCategory('Obesity');
      }
      setIsLoading(false);
    }, 1000); // 1 second fake delay
  };

  return (
    <div className="p-6 mx-auto rounded-lg shadow-lg w-xl bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">BMI Calculator</h2>
      <div className="mb-4">
        <label htmlFor="height" className="block mb-2 text-sm font-medium">
          Height (cm):
        </label>
        <input
          type="number"
          id="height"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={height}
          onChange={e => setHeight(e.target.value)}
          placeholder="e.g., 175"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="weight" className="block mb-2 text-sm font-medium">
          Weight (kg):
        </label>
        <input
          type="number"
          id="weight"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="e.g., 70"
        />
      </div>
      <button
        onClick={calculateBMI}
        disabled={isLoading}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Calculating...</span>
          </>
        ) : (
          <span>Calculate BMI</span>
        )}
      </button>
      {bmi && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">
            Your BMI: <span className="font-bold text-accent">{bmi}</span>
          </p>
          {category && (
            <p className="text-lg font-medium">
              Category: <span className="font-bold text-accent">{category}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
