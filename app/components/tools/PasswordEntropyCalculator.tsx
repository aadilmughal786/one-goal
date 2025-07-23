// app/components/tools/PasswordEntropyCalculator.tsx
'use client';

import { MathJax, MathJaxContext } from 'better-react-mathjax';
import React, { useMemo, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const config = {
  loader: {
    load: ['[tex]/html'],
  },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
  },
};

const PasswordEntropyCalculatorComponent: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const analysis = useMemo(() => {
    if (!password) {
      return null;
    }

    const length = password.length;
    let poolSize = 0;

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSpecial) poolSize += 32; // Common special characters

    const entropy = length * Math.log2(poolSize);
    const combinations = Math.pow(poolSize, length);

    return {
      length,
      poolSize,
      entropy,
      combinations,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSpecial,
    };
  }, [password]);

  const strength = useMemo(() => {
    if (!analysis) return null;

    const { entropy } = analysis;
    if (entropy < 25) return { text: 'Very Weak', color: 'text-red-500', percentage: 20 };
    if (entropy < 50) return { text: 'Weak', color: 'text-orange-500', percentage: 40 };
    if (entropy < 75) return { text: 'Fair', color: 'text-yellow-500', percentage: 60 };
    if (entropy < 100) return { text: 'Good', color: 'text-green-500', percentage: 80 };
    return { text: 'Strong', color: 'text-blue-500', percentage: 100 };
  }, [analysis]);

  const crackTime = useMemo(() => {
    if (!analysis || !isFinite(analysis.combinations)) return 'Unknown';

    const secondsToCrack = analysis.combinations / 2 / 1e9; // 1 billion guesses/sec

    if (secondsToCrack < 1) return 'Less than a second';
    const units = [
      { name: 'billion years', value: 31557600000000000 },
      { name: 'million years', value: 31557600000000 },
      { name: 'years', value: 31557600 },
      { name: 'months', value: 2629800 },
      { name: 'days', value: 86400 },
      { name: 'hours', value: 3600 },
      { name: 'minutes', value: 60 },
      { name: 'seconds', value: 1 },
    ];
    for (const unit of units) {
      if (secondsToCrack >= unit.value) {
        const amount = Math.round(secondsToCrack / unit.value);
        return `${amount.toLocaleString()} ${unit.name}`;
      }
    }
    return 'Less than a second';
  }, [analysis]);

  const formatNumber = (num: number) => {
    if (!isFinite(num) || num === 0) return '0';
    if (num > 1e100) return 'More than 10¹⁰⁰';
    if (num > 1e50) return num.toExponential(2);
    return num.toLocaleString();
  };

  return (
    <div className="p-4 rounded-lg bg-bg-primary text-text-primary">
      <h2 className="mb-2 text-2xl font-bold text-center">Password Entropy Calculator</h2>
      <p className="mb-6 text-center text-text-secondary">
        Measure your password strength and security
      </p>

      <div className="flex relative items-center mb-6">
        <label htmlFor="password-input" className="sr-only">
          Enter your password:
        </label>
        <input
          id="password-input"
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Type your password here..."
          className="p-3 pr-10 w-full text-lg rounded-md border text-text-primary border-border-primary bg-bg-secondary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-border-accent"
        />
        <button
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          className="absolute right-0 p-3 cursor-pointer text-text-secondary hover:text-text-primary"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border bg-bg-secondary border-border-primary">
            <h3 className="mb-4 text-lg font-semibold">Strength Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Password Strength:</span>
                <span className={`font-bold ${strength?.color}`}>{strength?.text}</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${strength?.color.replace('text-', 'bg-')}`}
                  style={{ width: `${strength?.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-bg-secondary border-border-primary">
              <h3 className="mb-4 text-lg font-semibold">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Length:</span>{' '}
                  <span>{analysis.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Character Pool:</span>{' '}
                  <span>{analysis.poolSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Entropy (bits):</span>{' '}
                  <span>{analysis.entropy.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Combinations:</span>{' '}
                  <span className="truncate">{formatNumber(analysis.combinations)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-bg-secondary border-border-primary">
              <h3 className="mb-4 text-lg font-semibold">Character Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div
                  className={`flex justify-between ${analysis.hasLowercase ? 'text-green-500' : 'text-red-500'}`}
                >
                  <span className="text-text-secondary">Lowercase (a-z):</span>{' '}
                  <span>{analysis.hasLowercase ? '✓' : '✗'}</span>
                </div>
                <div
                  className={`flex justify-between ${analysis.hasUppercase ? 'text-green-500' : 'text-red-500'}`}
                >
                  <span className="text-text-secondary">Uppercase (A-Z):</span>{' '}
                  <span>{analysis.hasUppercase ? '✓' : '✗'}</span>
                </div>
                <div
                  className={`flex justify-between ${analysis.hasNumbers ? 'text-green-500' : 'text-red-500'}`}
                >
                  <span className="text-text-secondary">Numbers (0-9):</span>{' '}
                  <span>{analysis.hasNumbers ? '✓' : '✗'}</span>
                </div>
                <div
                  className={`flex justify-between ${analysis.hasSpecial ? 'text-green-500' : 'text-red-500'}`}
                >
                  <span className="text-text-secondary">Special Chars:</span>{' '}
                  <span>{analysis.hasSpecial ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 text-center rounded-lg border bg-blue-500/10 border-blue-500/20">
            <h3 className="text-lg font-semibold text-blue-400">Estimated Time to Crack</h3>
            <p className="text-2xl font-bold text-text-primary">{crackTime}</p>
            <p className="text-xs text-text-secondary">(Assuming 1 billion guesses per second)</p>
          </div>
        </div>
      )}

      <div className="p-4 mt-6 rounded-lg border bg-green-500/10 border-green-500/20">
        <h3 className="mb-2 text-lg font-semibold text-green-400">Tips for Strong Passwords</h3>
        <ul className="space-y-1 text-sm list-disc list-inside text-text-secondary">
          <li>Use at least 12 characters (16+ is even better)</li>
          <li>Include uppercase and lowercase letters</li>
          <li>Add numbers and special characters</li>
          <li>Avoid common words and personal information</li>
          <li>Consider using a passphrase with random words</li>
        </ul>
      </div>

      <div className="p-4 mt-6 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">What is Password Entropy?</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            Password entropy is a measure of how unpredictable a password is. It&apos;s measured in
            bits, and a higher bit number means a stronger, more secure password that is harder to
            guess or crack.
          </p>
          <p>
            We calculate it using the formula:{' '}
            <MathJax hideUntilTypeset={'first'}>{'$$E = L \\times \\log_2(N)$$'}</MathJax>
          </p>
          <ul className="pl-4 mt-2 list-disc list-inside">
            <li>
              <MathJax inline>{'\\(E\\)'}</MathJax> is the entropy.
            </li>
            <li>
              <MathJax inline>{'\\(L\\)'}</MathJax> is the password length.
            </li>
            <li>
              <MathJax inline>{'\\(N\\)'}</MathJax> is the size of the character pool (e.g., 26 for
              lowercase letters, 52 for upper and lower, 62 with numbers, etc.).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const PasswordEntropyCalculator: React.FC = () => {
  return (
    <MathJaxContext config={config}>
      <PasswordEntropyCalculatorComponent />
    </MathJaxContext>
  );
};

export default PasswordEntropyCalculator;
