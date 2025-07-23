'use client';

import { MathJax, MathJaxContext } from 'better-react-mathjax';
import React, { useMemo, useState } from 'react';
import { FaCalculator } from 'react-icons/fa';

// Enhanced Toggle Switch Component
const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => {
  return (
    <div className="flex flex-col">
      <span className="mb-2 text-sm font-medium text-text-secondary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`inline-flex relative items-center w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer bg-border-primary`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute flex items-center justify-center h-6 w-6 transform rounded-full  shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            enabled ? 'bg-green-400 translate-x-7' : 'bg-white translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

// Helper functions for calculations with BigInt
const permute = (n: number, k: number): bigint => {
  if (k < 0 || k > n) return 0n;
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result *= BigInt(n - i);
  }
  return result;
};

const factorial = (n: number): bigint => {
  if (n < 0) return 0n;
  let result = 1n;
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i);
  }
  return result;
};

const CombinationCalculator: React.FC = () => {
  const [n, setN] = useState<string>('');
  const [k, setK] = useState<string>('');
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const [isRepeatable, setIsRepeatable] = useState<boolean>(false);

  const config = {
    loader: { load: ['input/tex', 'output/svg'] },
    svg: { fontCache: 'global' },
  };

  const result = useMemo<{
    type: string;
    formula: string;
    value: bigint | null;
    error?: string;
  }>(() => {
    if (n === '' || k === '') {
      return { type: '', formula: '', value: null };
    }

    const totalItems = parseInt(n, 10);
    const itemsToChoose = parseInt(k, 10);

    if (isNaN(totalItems) || isNaN(itemsToChoose)) {
      return {
        type: 'Invalid Input',
        formula: '',
        value: null,
        error: "Please enter valid numbers for 'n' and 'k'.",
      };
    }
    if (totalItems < 0 || itemsToChoose < 0) {
      return {
        type: 'Invalid Input',
        formula: '',
        value: null,
        error: "'n' and 'k' must be non-negative.",
      };
    }
    if (!isRepeatable && itemsToChoose > totalItems) {
      return {
        type: 'Invalid Input',
        formula: '',
        value: null,
        error: "'k' cannot be greater than 'n' when repetition is not allowed.",
      };
    }
    if (totalItems === 0 && itemsToChoose > 0) {
      return {
        type: 'Invalid Input',
        formula: '',
        value: null,
        error: 'Cannot choose items from an empty set.',
      };
    }

    // Case 1: Permutation with Repetition (Ordered, Repeatable)
    if (isOrdered && isRepeatable) {
      return {
        type: 'Permutation with Repetition',
        formula: 'n^k',
        value: BigInt(totalItems) ** BigInt(itemsToChoose),
      };
    }
    // Case 2: Permutation (Ordered, Not Repeatable)
    if (isOrdered && !isRepeatable) {
      return {
        type: 'Permutation',
        formula: 'P(n,k) = \\frac{n!}{(n-k)!}',
        value: permute(totalItems, itemsToChoose),
      };
    }
    // Case 3: Combination with Repetition (Not Ordered, Repeatable)
    if (!isOrdered && isRepeatable) {
      if (totalItems === 0 && itemsToChoose === 0)
        return { type: 'Combination with Repetition', formula: 'C(n+k-1, k)', value: 1n };
      if (totalItems === 0)
        return { type: 'Combination with Repetition', formula: 'C(n+k-1, k)', value: 0n };

      const nPlusKMinus1 = totalItems + itemsToChoose - 1;
      const numerator = permute(nPlusKMinus1, itemsToChoose);
      const denominator = factorial(itemsToChoose);
      return {
        type: 'Combination with Repetition',
        formula: 'C(n+k-1, k) = \\frac{(n+k-1)!}{k!(n-1)!}',
        value: denominator > 0n ? numerator / denominator : 0n,
      };
    }
    // Case 4: Combination (Not Ordered, Not Repeatable)
    if (!isOrdered && !isRepeatable) {
      const numerator = permute(totalItems, itemsToChoose);
      const denominator = factorial(itemsToChoose);
      return {
        type: 'Combination',
        formula: 'C(n,k) = \\frac{n!}{k!(n-k)!}',
        value: denominator > 0n ? numerator / denominator : 0n,
      };
    }

    return { type: 'Unknown', formula: '', value: null, error: 'An unknown error occurred.' };
  }, [n, k, isOrdered, isRepeatable]);

  return (
    <MathJaxContext config={config} renderMode="post">
      <div className="p-6 rounded-lg shadow-lg bg-bg-secondary text-text-primary">
        <h2 className="mb-6 text-2xl font-semibold">
          <FaCalculator className="inline mr-2 w-5 h-5" />
          Combinations & Permutations
        </h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div>
            <label
              htmlFor="total-items"
              className="block mb-2 text-sm font-medium text-text-secondary"
            >
              Total Items (n)
            </label>
            <input
              id="total-items"
              type="number"
              value={n}
              min="0"
              onChange={e => setN(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g., 52"
            />
          </div>
          <div>
            <label
              htmlFor="items-to-choose"
              className="block mb-2 text-sm font-medium text-text-secondary"
            >
              Items to Choose (k)
            </label>
            <input
              id="items-to-choose"
              type="number"
              value={k}
              min="0"
              onChange={e => setK(e.target.value)}
              className="px-4 py-2 w-full rounded-lg border bg-bg-primary border-border-primary focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g., 5"
            />
          </div>

          <ToggleSwitch
            label="Order Matters (Permutation)"
            enabled={isOrdered}
            onChange={setIsOrdered}
          />
          <ToggleSwitch
            label="Repetition Allowed"
            enabled={isRepeatable}
            onChange={setIsRepeatable}
          />
        </div>

        {result.type && (
          <div className="p-6 mt-8 rounded-lg border bg-bg-primary border-border-primary">
            {result.error ? (
              <p className="text-lg font-medium text-red-500">{result.error}</p>
            ) : (
              <div>
                <p className="text-sm font-medium text-text-secondary">Result Type</p>
                <h3 className="mb-2 text-xl font-semibold text-accent">{result.type}</h3>

                <p className="mt-4 text-sm font-medium text-text-secondary">Formula</p>
                <div className="p-3 my-1 text-lg text-center rounded-md bg-bg-secondary">
                  <MathJax inline={false}>{`$$${result.formula}$$`}</MathJax>
                </div>

                <p className="mt-4 text-sm font-medium text-text-secondary">
                  Number of Possibilities
                </p>
                <p className="text-3xl font-bold break-words text-accent">
                  {result.value?.toString() ?? '...'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MathJaxContext>
  );
};

export default CombinationCalculator;
