'use client';

import React, { useState } from 'react';

const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      setBmi('Invalid input');
      setCategory(null);
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
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">BMI Calculator</h2>
      <div className="mb-4">
        <label htmlFor="height" className="block mb-2 text-sm font-medium">
          Height (cm):
        </label>
        <input
          type="number"
          id="height"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="e.g., 70"
        />
      </div>
      <button
        onClick={calculateBMI}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Calculate BMI
      </button>
      {bmi && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
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
