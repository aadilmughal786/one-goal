'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FaGraduationCap } from 'react-icons/fa';

interface GradeInput {
  name: string;
  score: string;
  weight: string;
}

const SimpleGradeCalculator: React.FC = () => {
  const [grades, setGrades] = useState<GradeInput[]>([{ name: '', score: '', weight: '' }]);

  const handleGradeChange = useCallback(
    (index: number, field: keyof GradeInput, value: string) => {
      const newGrades = [...grades];
      newGrades[index][field] = value;
      setGrades(newGrades);
    },
    [grades]
  );

  const addGrade = useCallback(() => {
    setGrades([...grades, { name: '', score: '', weight: '' }]);
  }, [grades]);

  const removeGrade = useCallback(
    (index: number) => {
      const newGrades = grades.filter((_, i) => i !== index);
      setGrades(newGrades);
    },
    [grades]
  );

  const calculateAverage = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let isValid = true;

    grades.forEach(grade => {
      const score = parseFloat(grade.score);
      const weight = parseFloat(grade.weight);

      if (isNaN(score) || isNaN(weight) || score < 0 || weight < 0) {
        isValid = false;
      }

      totalWeightedScore += score * weight;
      totalWeight += weight;
    });

    if (!isValid) return 'Invalid Input';
    if (totalWeight === 0) return 'N/A';

    return (totalWeightedScore / totalWeight).toFixed(2);
  }, [grades]);

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Simple Grade Calculator</h2>

      <div className="space-y-4 mb-6">
        {grades.map((grade, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`grade-name-${index}`} className="block mb-1 text-sm font-medium">
                Item Name (Optional):
              </label>
              <input
                type="text"
                id={`grade-name-${index}`}
                className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                value={grade.name}
                onChange={e => handleGradeChange(index, 'name', e.target.value)}
                placeholder="e.g., Midterm"
              />
            </div>
            <div className="w-24">
              <label htmlFor={`grade-score-${index}`} className="block mb-1 text-sm font-medium">
                Score:
              </label>
              <input
                type="number"
                id={`grade-score-${index}`}
                className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                value={grade.score}
                onChange={e => handleGradeChange(index, 'score', e.target.value)}
                placeholder="e.g., 85"
              />
            </div>
            <div className="w-24">
              <label htmlFor={`grade-weight-${index}`} className="block mb-1 text-sm font-medium">
                Weight:
              </label>
              <input
                type="number"
                id={`grade-weight-${index}`}
                className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                value={grade.weight}
                onChange={e => handleGradeChange(index, 'weight', e.target.value)}
                placeholder="e.g., 20"
              />
            </div>
            {grades.length > 1 && (
              <button
                onClick={() => removeGrade(index)}
                className="p-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addGrade}
        className="w-full px-4 py-2 mb-6 text-white rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Another Grade
      </button>

      <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
        <p className="text-lg font-medium">
          Average Grade: <span className="font-bold text-accent">{calculateAverage}</span>
        </p>
      </div>
    </div>
  );
};

export default SimpleGradeCalculator;
