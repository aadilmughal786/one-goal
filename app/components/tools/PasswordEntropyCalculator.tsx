'use client';

import { MathJax, MathJaxContext } from 'better-react-mathjax';
import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEyeOff, FiHash, FiKey, FiLock, FiShield, FiZap } from 'react-icons/fi';

// Corrected MathJax Configuration
const config = {
  loader: { load: ['input/tex', 'output/svg'] },
  svg: { fontCache: 'global' },
};

const PasswordEntropyCalculator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // This effect ensures MathJax components only render on the client side, after initial mount.
  useEffect(() => {
    setIsClient(true);
  }, []);

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

    if (poolSize === 0) {
      return {
        length,
        poolSize,
        entropy: 0,
        combinations: 0n,
        hasLowercase,
        hasUppercase,
        hasNumbers,
        hasSpecial,
      };
    }

    const entropy = length * Math.log2(poolSize);
    const combinations = BigInt(poolSize) ** BigInt(length);

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
    if (entropy < 30)
      return { text: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500', percentage: 15 };
    if (entropy < 50)
      return { text: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500', percentage: 35 };
    if (entropy < 70)
      return { text: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500', percentage: 60 };
    if (entropy < 90)
      return { text: 'Good', color: 'text-green-500', bg: 'bg-green-500', percentage: 80 };
    return { text: 'Strong', color: 'text-blue-500', bg: 'bg-blue-500', percentage: 100 };
  }, [analysis]);

  const crackTime = useMemo(() => {
    if (!analysis || analysis.combinations === 0n) return 'Instantly';

    const guessesPerSecond = 1_000_000_000n; // 1 billion guesses/sec as BigInt
    const secondsToCrack = analysis.combinations / (2n * guessesPerSecond);

    if (secondsToCrack < 1n) return 'Less than a second';

    const units = [
      { name: 'trillion years', value: 31536000000000000000n },
      { name: 'billion years', value: 31536000000000000n },
      { name: 'million years', value: 31536000000000n },
      { name: 'years', value: 31536000n },
      { name: 'days', value: 86400n },
      { name: 'hours', value: 3600n },
      { name: 'minutes', value: 60n },
      { name: 'seconds', value: 1n },
    ];

    for (const unit of units) {
      if (secondsToCrack >= unit.value) {
        const amount = secondsToCrack / unit.value;
        return `~${amount.toLocaleString()} ${unit.name}`;
      }
    }
    return 'Instantly';
  }, [analysis]);

  const formatBigInt = (num: bigint): string => {
    const s = num.toString();
    if (s.length > 100) return '> 10¹⁰⁰';
    if (s.length > 30) {
      const exponent = s.length - 1;
      const mantissa = `${s[0]}.${s.substring(1, 3)}`;
      return `${mantissa}e+${exponent}`;
    }
    return s.toLocaleString();
  };

  return (
    <MathJaxContext config={config} renderMode="post">
      <div className="p-6 rounded-lg bg-bg-secondary text-text-primary">
        <h2 className="mb-2 text-3xl font-bold text-center">Password Entropy Calculator</h2>
        <p className="mb-8 text-center text-text-secondary">
          Analyze the strength and security of your password in real-time.
        </p>

        <div className="relative mb-8">
          <FiKey className="absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 text-text-secondary" />
          <input
            id="password-input"
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Type your password here..."
            className="py-3 pr-12 pl-12 w-full text-lg rounded-md border transition duration-200 text-text-primary border-border-primary bg-bg-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-4 top-1/2 p-1 -translate-y-1/2 cursor-pointer text-text-secondary hover:text-text-primary"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border bg-bg-primary border-border-primary">
              <h3 className="flex items-center mb-4 text-xl font-semibold">
                <FiShield className="mr-2 text-accent" />
                Strength Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Password Strength:</span>
                  <span className={`font-bold text-lg ${strength?.color}`}>{strength?.text}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-bg-tertiary">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${strength?.bg}`}
                    style={{ width: `${strength?.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-6 rounded-lg border bg-bg-primary border-border-primary">
                <h3 className="flex items-center mb-4 text-xl font-semibold">
                  <FiHash className="mr-2 text-accent" />
                  Details
                </h3>
                <div className="space-y-3 text-md">
                  <div className="flex justify-between">
                    <span>Length:</span> <span className="font-mono">{analysis.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Character Pool:</span>{' '}
                    <span className="font-mono">{analysis.poolSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entropy (bits):</span>{' '}
                    <span className="font-mono">{analysis.entropy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Combinations:</span>{' '}
                    <span className="font-mono truncate">
                      {formatBigInt(analysis.combinations)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg border bg-bg-primary border-border-primary">
                <h3 className="flex items-center mb-4 text-xl font-semibold">
                  <FiZap className="mr-2 text-accent" />
                  Character Breakdown
                </h3>
                <div className="space-y-3 text-md">
                  {[
                    { label: 'Lowercase (a-z)', present: analysis.hasLowercase },
                    { label: 'Uppercase (A-Z)', present: analysis.hasUppercase },
                    { label: 'Numbers (0-9)', present: analysis.hasNumbers },
                    { label: 'Special Chars', present: analysis.hasSpecial },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span>{item.label}:</span>
                      <span
                        className={`font-bold text-lg ${item.present ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {item.present ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 text-center rounded-lg border bg-blue-900/20 border-blue-500/30">
              <h3 className="flex justify-center items-center text-xl font-semibold text-blue-400">
                <FiLock className="mr-2" />
                Time to Crack
              </h3>
              <p className="my-2 text-3xl font-bold text-text-primary">{crackTime}</p>
              <p className="text-xs text-text-secondary">
                (Assuming 1 billion guesses per second online)
              </p>
            </div>
          </div>
        )}

        <div className="p-6 mt-8 rounded-lg border bg-bg-primary border-border-primary">
          <h3 className="mb-3 text-xl font-semibold text-text-primary">
            What is Password Entropy?
          </h3>
          <div className="space-y-3 text-text-secondary">
            <p>
              Password entropy is a measure of how unpredictable a password is. It&apos;s measured
              in bits, and a higher bit value means a stronger, more secure password that is
              exponentially harder to guess or crack.
            </p>
            <p>
              The calculation uses the formula:
              {isClient && <MathJax>{'$$E = L \\times \\log_2(N)$$'}</MathJax>}
            </p>
            <ul className="pl-5 mt-2 list-disc">
              <li>
                {isClient && (
                  <MathJax inline>
                    <b>{'\\(E\\)'}</b>
                  </MathJax>
                )}{' '}
                is the total entropy in bits.
              </li>
              <li>
                {isClient && (
                  <MathJax inline>
                    <b>{'\\(L\\)'}</b>
                  </MathJax>
                )}{' '}
                is the password&apos;s length (number of characters).
              </li>
              <li>
                {isClient && (
                  <MathJax inline>
                    <b>{'\\(N\\)'}</b>
                  </MathJax>
                )}{' '}
                is the size of the pool of unique characters used.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MathJaxContext>
  );
};

export default PasswordEntropyCalculator;
