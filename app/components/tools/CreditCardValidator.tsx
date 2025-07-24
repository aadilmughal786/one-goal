// app/components/tools/CreditCardValidator.tsx
'use client';

import React, { useState } from 'react';
import { FiCreditCard } from 'react-icons/fi';

const luhnCheck = (cardNumber: string): boolean => {
  let sum = 0;
  let double = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};

interface CardRegex {
  name: string;
  regex: RegExp;
  lengths: number[];
}

const cardRegexes: CardRegex[] = [
  { name: 'American Express', regex: /^(34|37)/, lengths: [15] },
  { name: 'Diners Club - Carte Blanche', regex: /^30[0-5]/, lengths: [14] },
  { name: 'Diners Club - International', regex: /^36/, lengths: [14] },
  { name: 'Diners Club - USA & Canada', regex: /^54/, lengths: [16] },
  {
    name: 'Discover',
    regex: /^(6011|622(?:12[6-9]|[1-9][0-9]{2}|[0-9][1-9][0-9]|[0-9]{2}[1-9])|64[4-9]|65)/,
    lengths: [16, 17, 18, 19],
  },
  { name: 'InstaPayment', regex: /^(637|638|639)/, lengths: [16] },
  { name: 'JCB', regex: /^35(?:2[8-9]|[3-8][0-9])/, lengths: [16, 17, 18, 19] },
  {
    name: 'Maestro',
    regex: /^(5018|5020|5038|5893|6304|6759|6761|6762|6763)/,
    lengths: [16, 17, 18, 19],
  },
  {
    name: 'MasterCard',
    regex: /^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)/,
    lengths: [16],
  },
  { name: 'Visa', regex: /^4/, lengths: [13, 16, 19] },
  { name: 'Visa Electron', regex: /^(4026|417500|4508|4844|4913|4917)/, lengths: [16] },
];

const getCardType = (cardNumber: string): string => {
  for (const card of cardRegexes) {
    if (card.regex.test(cardNumber) && card.lengths.includes(cardNumber.length)) {
      return card.name;
    }
  }
  return 'Unknown';
};

const CreditCardValidator: React.FC = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean | null;
    type: string | null;
  } | null>(null);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces
    setCardNumber(value);

    if (value.length >= 12) {
      // Start validating after a reasonable number of digits
      const isValid = luhnCheck(value);
      const type = getCardType(value);
      setValidationResult({ isValid, type });
    } else {
      setValidationResult(null);
    }
  };

  return (
    <div className="p-6 mx-auto w-full max-w-4xl rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-3xl font-bold text-center">Credit Card Validator</h2>

      <div className="mb-8">
        <label htmlFor="cardNumber" className="block mb-2 text-sm font-medium">
          Enter Credit Card Number:
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            className="p-3 pr-10 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="XXXX XXXX XXXX XXXX"
            maxLength={19} // Max length for numbers + spaces
          />
          <FiCreditCard
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
            size={20}
          />
        </div>
      </div>

      {validationResult && (
        <div className="p-6 mb-8 rounded-md border shadow-md bg-bg-primary border-border-primary">
          <h3 className="mb-4 text-2xl font-semibold text-center">Validation Result</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Card Type: <span className="font-bold text-accent">{validationResult.type}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Validity:{' '}
                <span
                  className={`font-bold ${validationResult.isValid ? 'text-green-500' : 'text-red-500'}`}
                >
                  {validationResult.isValid ? 'Valid' : 'Invalid'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-lg border shadow-md bg-bg-primary border-border-primary">
        <h3 className="mb-4 text-2xl font-semibold text-center">
          How Credit Card Validation Works
        </h3>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">1. Luhn Algorithm (Mod 10 Algorithm)</h4>
          <p className="mb-2 text-text-secondary">
            Most credit card numbers use the Luhn algorithm, a simple checksum formula used to
            validate a variety of identification numbers. It helps in quickly detecting accidental
            errors, not fraudulent ones.
          </p>
          <p className="text-text-secondary">
            <strong>Steps:</strong>
          </p>
          <ol className="ml-4 list-decimal list-inside text-text-secondary">
            <li>
              Starting from the rightmost digit (checksum digit), and moving left, double the value
              of every second digit.
            </li>
            <li>
              If a doubled digit is greater than 9 (e.g., 7 doubled is 14), sum its digits (e.g., 1
              + 4 = 5).
            </li>
            <li>
              Sum all the digits (including the undoubled ones and the summed doubled digits).
            </li>
            <li>
              If the total sum is divisible by 10 (i.e., the sum modulo 10 is 0), then the number is
              valid according to the Luhn algorithm.
            </li>
          </ol>
        </div>

        <div className="mb-6">
          <h4 className="mb-2 text-xl font-semibold">2. Credit Card Number Formats</h4>
          <p className="mb-2 text-text-secondary">
            Different credit card issuers use distinct patterns for their card numbers, including
            specific starting digits (IIN ranges) and varying lengths.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-collapse table-auto border-border-primary">
              <thead>
                <tr className="bg-bg-tertiary">
                  <th className="px-4 py-2 text-sm font-semibold text-left border border-border-primary">
                    Credit Card Issuer
                  </th>
                  <th className="px-4 py-2 text-sm font-semibold text-left border border-border-primary">
                    Starts With (IIN Range)
                  </th>
                  <th className="px-4 py-2 text-sm font-semibold text-left border border-border-primary">
                    Length (Number of digits)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">American Express</td>
                  <td className="px-4 py-2 border border-border-primary">34, 37</td>
                  <td className="px-4 py-2 border border-border-primary">15</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">
                    Diners Club - Carte Blanche
                  </td>
                  <td className="px-4 py-2 border border-border-primary">
                    300, 301, 302, 303, 304, 305
                  </td>
                  <td className="px-4 py-2 border border-border-primary">14</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">
                    Diners Club - International
                  </td>
                  <td className="px-4 py-2 border border-border-primary">36</td>
                  <td className="px-4 py-2 border border-border-primary">14</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">
                    Diners Club - USA & Canada
                  </td>
                  <td className="px-4 py-2 border border-border-primary">54</td>
                  <td className="px-4 py-2 border border-border-primary">16</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">Discover</td>
                  <td className="px-4 py-2 border border-border-primary">
                    6011, 622126 to 622925, 644, 645, 646, 647, 648, 649, 65
                  </td>
                  <td className="px-4 py-2 border border-border-primary">16-19</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">InstaPayment</td>
                  <td className="px-4 py-2 border border-border-primary">637, 638, 639</td>
                  <td className="px-4 py-2 border border-border-primary">16</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">JCB</td>
                  <td className="px-4 py-2 border border-border-primary">3528 to 3589</td>
                  <td className="px-4 py-2 border border-border-primary">16-19</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">Maestro</td>
                  <td className="px-4 py-2 border border-border-primary">
                    5018, 5020, 5038, 5893, 6304, 6759, 6761, 6762, 6763
                  </td>
                  <td className="px-4 py-2 border border-border-primary">16-19</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">MasterCard</td>
                  <td className="px-4 py-2 border border-border-primary">
                    51, 52, 53, 54, 55, 222100-272099
                  </td>
                  <td className="px-4 py-2 border border-border-primary">16</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">Visa</td>
                  <td className="px-4 py-2 border border-border-primary">4</td>
                  <td className="px-4 py-2 border border-border-primary">13-16-19</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-border-primary">Visa Electron</td>
                  <td className="px-4 py-2 border border-border-primary">
                    4026, 417500, 4508, 4844, 4913, 4917
                  </td>
                  <td className="px-4 py-2 border border-border-primary">16</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardValidator;
