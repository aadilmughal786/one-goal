// app/components/tools/WaterIntakeCalculator.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaCloud, FaFemale, FaMale, FaSnowflake, FaSun } from 'react-icons/fa';
import { FiChevronDown, FiLoader } from 'react-icons/fi';

type Gender = 'male' | 'female';
type Climate = 'cold' | 'moderate' | 'hot';

const GENERAL_GLASS_SIZE_ML = 240; // Assuming a general glass size of 240 ml (approx. 8 oz)

const WaterIntakeCalculator: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [climate, setClimate] = useState<Climate>('moderate');
  const [exerciseMins, setExerciseMins] = useState<string>('');
  const [waterIntake, setWaterIntake] = useState<number | null>(null);
  const [glassesNeeded, setGlassesNeeded] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isClimateDropdownOpen, setIsClimateDropdownOpen] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const climateDropdownRef = useRef<HTMLDivElement>(null);

  const calculateIntake = () => {
    setIsLoading(true);
    setWaterIntake(null);
    setGlassesNeeded(null);

    setTimeout(() => {
      const weightKg = parseFloat(weight);
      const exercise = parseFloat(exerciseMins) || 0;

      if (isNaN(weightKg) || weightKg <= 0) {
        setIsLoading(false);
        return;
      }

      let baseWater = weightKg * 35;

      if (gender === 'male') {
        baseWater += 250;
      }

      if (climate === 'hot') {
        baseWater += 250;
      } else if (climate === 'cold') {
        baseWater -= 250;
      }

      const extraWater = (exercise / 30) * 350;
      baseWater += extraWater;

      const finalIntake = Math.round(baseWater / 100) * 100;
      const calculatedGlasses = finalIntake / GENERAL_GLASS_SIZE_ML;

      setWaterIntake(finalIntake);
      setGlassesNeeded(parseFloat(calculatedGlasses.toFixed(1))); // Round to one decimal place
      setIsLoading(false);
    }, 700);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false);
      }
      if (
        climateDropdownRef.current &&
        !climateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClimateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGenderIcon = (selectedGender: Gender) => {
    return selectedGender === 'male' ? <FaMale className="mr-2" /> : <FaFemale className="mr-2" />;
  };

  const getClimateIcon = (selectedClimate: Climate) => {
    switch (selectedClimate) {
      case 'hot':
        return <FaSun className="mr-2" />;
      case 'moderate':
        return <FaCloud className="mr-2" />;
      case 'cold':
        return <FaSnowflake className="mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 mx-auto max-w-md rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-2xl font-semibold text-center">Water Intake Calculator</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="weight-kg" className="block mb-2 text-sm font-medium">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight-kg"
            className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="e.g., 70"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Gender</label>
          <div className="relative" ref={genderDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
              className="flex justify-between items-center px-3 py-2 w-full text-left rounded-md border cursor-pointer bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span className="flex items-center capitalize">
                {getGenderIcon(gender)}
                {gender}
              </span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isGenderDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isGenderDropdownOpen && (
              <div className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary">
                <button
                  onClick={() => {
                    setGender('male');
                    setIsGenderDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-border-primary"
                >
                  <FaMale className="mr-2" />
                  Male
                </button>
                <button
                  onClick={() => {
                    setGender('female');
                    setIsGenderDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-border-primary"
                >
                  <FaFemale className="mr-2" />
                  Female
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Climate</label>
          <div className="relative" ref={climateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClimateDropdownOpen(!isClimateDropdownOpen)}
              className="flex justify-between items-center px-3 py-2 w-full text-left rounded-md border cursor-pointer bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span className="flex items-center capitalize">
                {getClimateIcon(climate)}
                {climate}
              </span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isClimateDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isClimateDropdownOpen && (
              <div className="absolute z-10 p-2 mt-2 w-full rounded-md border shadow-lg bg-bg-primary border-border-primary">
                <button
                  onClick={() => {
                    setClimate('cold');
                    setIsClimateDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-border-primary"
                >
                  <FaSnowflake className="mr-2" />
                  Cold
                </button>
                <button
                  onClick={() => {
                    setClimate('moderate');
                    setIsClimateDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-border-primary"
                >
                  <FaCloud className="mr-2" />
                  Moderate
                </button>
                <button
                  onClick={() => {
                    setClimate('hot');
                    setIsClimateDropdownOpen(false);
                  }}
                  className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-border-primary"
                >
                  <FaSun className="mr-2" />
                  Hot
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="exercise-mins" className="block mb-2 text-sm font-medium">
            Daily Exercise (minutes)
          </label>
          <input
            type="number"
            id="exercise-mins"
            className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={exerciseMins}
            onChange={e => setExerciseMins(e.target.value)}
            placeholder="e.g., 30"
          />
        </div>
      </div>

      <button
        onClick={calculateIntake}
        disabled={isLoading}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 mt-6 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Calculating...</span>
          </>
        ) : (
          <span>Calculate Intake</span>
        )}
      </button>

      {waterIntake !== null && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium text-center">
            Estimated Daily Intake:
            <span className="block mt-1 text-3xl font-bold text-accent">
              {waterIntake.toLocaleString()} ml
            </span>
            <span className="text-base text-text-secondary">
              (~{(waterIntake / 1000).toFixed(1)} Liters)
            </span>
          </p>
          {glassesNeeded !== null && (
            <p className="mt-2 font-medium text-center text-md">
              Approximately <span className="font-bold text-accent">{glassesNeeded}</span> glasses
              per day
              <span className="text-xs text-text-muted">
                {' '}
                (based on {GENERAL_GLASS_SIZE_ML}ml/glass)
              </span>
            </p>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-center text-text-muted">
        This is a general guideline. Individual needs can vary.
      </p>
    </div>
  );
};

export default WaterIntakeCalculator;
