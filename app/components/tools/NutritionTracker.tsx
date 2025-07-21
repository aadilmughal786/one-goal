// app/components/tools/NutritionTracker.tsx
'use client';

import { FoodItem, nutritionData } from '@/data/nutritionData';
import Fuse from 'fuse.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiSearch, FiTarget, FiTrash2, FiTrendingUp } from 'react-icons/fi';

const LOCAL_STORAGE_KEY = 'one-goal-nutrition-intake';

type AgeGroup = 'child' | 'boy' | 'man' | 'old';

const ageGroupGoals = {
  child: { calories: 1600, protein: 30, carbs: 220, fat: 50, fiber: 20, sugar: 40 },
  boy: { calories: 2200, protein: 50, carbs: 300, fat: 70, fiber: 28, sugar: 60 },
  man: { calories: 2500, protein: 56, carbs: 325, fat: 80, fiber: 30, sugar: 50 },
  old: { calories: 2000, protein: 56, carbs: 275, fat: 65, fiber: 28, sugar: 40 },
};

const NutritionTracker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dailyIntake, setDailyIntake] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('man');
  const isInitialMount = useRef(true);

  const nutritionGoals = ageGroupGoals[ageGroup];

  const fuse = useMemo(
    () =>
      new Fuse(Object.values(nutritionData), {
        keys: ['name'],
        threshold: 0.3,
      }),
    []
  );

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const today = new Date().toISOString().split('T')[0];
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.date === today) {
          setDailyIntake(parsedData.intake);
        } else {
          // If the stored data is not for today, reset it for the new day
          const todayData = { date: today, intake: [] };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todayData));
          setDailyIntake([]);
        }
      } else {
        // Initialize for today if no data exists
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ date: today, intake: [] }));
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
  }, []);

  // Save data to localStorage whenever intake changes, skipping the initial render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const dataToStore = { date: today, intake: dailyIntake };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save data to localStorage', error);
    }
  }, [dailyIntake]);

  const searchFood = async (query: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (query.trim() === '') {
      setSearchResults([]);
    } else {
      const results = fuse.search(query).map(result => result.item);
      setSearchResults(results);
    }

    setLoading(false);
  };

  const addToDaily = (food: FoodItem) => {
    const newEntry = {
      id: Date.now(),
      ...food,
      timestamp: new Date().toISOString(),
    };
    setDailyIntake(prev => [...prev, newEntry]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const removeFromDaily = (id: number) => {
    setDailyIntake(prev => prev.filter(item => item.id !== id));
  };

  const getDailyTotals = () => {
    return dailyIntake.reduce(
      (totals, item) => ({
        calories: totals.calories + item.calories,
        protein: totals.protein + item.protein,
        carbs: totals.carbs + item.carbs,
        fat: totals.fat + item.fat,
        fiber: totals.fiber + item.fiber,
        sugar: totals.sugar + item.sugar,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
    );
  };

  const getProgressPercentage = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    if (percentage <= 100) return 'bg-green-500';
    return 'bg-orange-500';
  };

  const dailyTotals = getDailyTotals();
  const todaysIntake = dailyIntake;

  return (
    <div className="p-6 mx-auto max-w-4xl min-h-screen bg-bg-primary text-text-primary">
      <div className="p-6 mb-6 rounded-lg shadow-lg bg-bg-secondary">
        <h1 className="flex gap-2 items-center mb-2 text-3xl font-bold text-text-primary">
          <FiTarget className="text-accent" />
          Nutrition Tracker
        </h1>
        <p className="text-text-secondary">
          Track your daily nutrition intake and reach your health goals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Age Group Selection */}
        <div className="p-6 rounded-lg shadow-lg bg-bg-secondary">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">Select Age Group</h2>
          <div className="flex flex-wrap gap-2">
            {(['child', 'boy', 'man', 'old'] as AgeGroup[]).map(group => (
              <button
                key={group}
                onClick={() => setAgeGroup(group)}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${ageGroup === group ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-primary hover:bg-border-primary'}`}
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Progress Section */}
        <div className="p-6 rounded-lg shadow-lg bg-bg-secondary">
          <div className="flex justify-between items-center mb-4">
            <h2 className="flex gap-2 items-center text-xl font-semibold text-text-primary">
              <FiTrendingUp className="text-accent" />
              Today&apos;s Progress
            </h2>
          </div>

          <div className="space-y-4">
            {Object.entries(nutritionGoals).map(([nutrient, goal]) => {
              const current = dailyTotals[nutrient as keyof typeof dailyTotals];
              const percentage = getProgressPercentage(current, goal);
              const colorClass = getProgressColor(current, goal);

              return (
                <div key={nutrient} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize text-text-primary">{nutrient}</span>
                    <span className="text-sm text-text-secondary">
                      {Math.round(current)}
                      {nutrient === 'calories' ? '' : 'g'} / {goal}
                      {nutrient === 'calories' ? '' : 'g'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-tertiary">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Search Section */}
        <div className="p-6 rounded-lg shadow-lg bg-bg-secondary">
          <h2 className="flex gap-2 items-center mb-4 text-xl font-semibold text-text-primary">
            <FiSearch className="text-accent" />
            Search Foods
          </h2>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search for foods (e.g., apple, chicken, rice)..."
              className="px-4 py-2 w-full rounded-lg border border-border-primary bg-bg-primary focus:ring-2 focus:ring-accent focus:border-accent"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && searchFood(searchTerm)}
            />
            <button
              onClick={() => searchFood(searchTerm)}
              className="absolute top-2 right-2 cursor-pointer text-text-secondary hover:text-accent"
              disabled={loading}
            >
              <FiSearch size={20} />
            </button>
          </div>

          {loading && (
            <div className="py-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full border-b-2 animate-spin border-accent"></div>
              <p className="mt-2 text-text-secondary">Searching foods...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="overflow-y-auto space-y-2 max-h-64">
              {searchResults.map((food, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border cursor-pointer border-border-primary hover:bg-bg-tertiary"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">{food.name}</h3>
                      <p className="text-sm text-text-secondary">{food.serving}</p>
                      <div className="flex flex-wrap gap-y-1 gap-x-4 mt-2 text-sm text-text-secondary">
                        <span>{food.calories} cal</span>
                        <span>{food.protein}g protein</span>
                        <span>{food.carbs}g carbs</span>
                        <span>{food.fat}g fat</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToDaily(food)}
                      className="flex gap-1 items-center px-3 py-1 rounded-lg cursor-pointer bg-text-primary text-bg-primary hover:opacity-80"
                    >
                      <FiPlus size={16} />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Intake Section */}
      <div className="p-6 mt-6 rounded-lg shadow-lg bg-bg-secondary">
        <h2 className="mb-4 text-xl font-semibold text-text-primary">Today&apos;s Intake</h2>

        {todaysIntake.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">
            No foods logged for today. Start by searching and adding foods above!
          </p>
        ) : (
          <div className="space-y-3">
            {todaysIntake.map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 rounded-lg bg-bg-tertiary"
              >
                <div>
                  <h3 className="font-medium text-text-primary">{item.name}</h3>
                  <div className="flex flex-wrap gap-y-1 gap-x-4 mt-1 text-sm text-text-secondary">
                    <span>{item.calories} cal</span>
                    <span>{item.protein}g protein</span>
                    <span>{item.carbs}g carbs</span>
                    <span>{item.fat}g fat</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromDaily(item.id)}
                  className="p-2 text-red-500 cursor-pointer hover:text-red-700"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionTracker;
