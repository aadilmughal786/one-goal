'use client';

import { currencyConverterService } from '@/services/currencyConverterService';
import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useEffect, useState } from 'react';
import { FiLoader } from 'react-icons/fi';

interface CurrencyTooltipProps {
  amount: number;
  fromCurrency: string; // This will now be the display symbol, e.g., '₹'
  children: React.ReactNode;
}

const targetCurrencies = ['USD', 'EUR', 'CNY'];

const CurrencyTooltip: React.FC<CurrencyTooltipProps> = ({ amount, fromCurrency, children }) => {
  const [convertedValues, setConvertedValues] = useState<Record<string, number | null>>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number | null>>({}); // New state for exchange rates
  const [loading, setLoading] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    if (!showTooltip) return;

    const fetchConversions = async () => {
      setLoading(true);
      const newConvertedValues: Record<string, number | null> = {};
      const newExchangeRates: Record<string, number | null> = {};
      const apiFromCurrency = fromCurrency === '₹' ? 'INR' : fromCurrency;

      for (const target of targetCurrencies) {
        if (apiFromCurrency === target) {
          newConvertedValues[target] = amount;
          newExchangeRates[target] = 1; // Rate is 1 if converting to itself
          continue;
        }
        try {
          const rate = await currencyConverterService.getExchangeRate(apiFromCurrency, target);
          newConvertedValues[target] = amount * rate;
          newExchangeRates[target] = rate; // Store the direct rate
        } catch (error) {
          console.error(`Error converting to ${target}:`, error);
          newConvertedValues[target] = null;
          newExchangeRates[target] = null;
          useNotificationStore.getState().showToast(`Failed to convert to ${target}.`, 'error');
        }
      }
      setConvertedValues(newConvertedValues);
      setExchangeRates(newExchangeRates);
      setLoading(false);
    };

    fetchConversions();
  }, [showTooltip, amount, fromCurrency]);

  return (
    <div
      className="inline-block relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-20 p-3 mb-2 text-sm whitespace-nowrap rounded-md shadow-lg -translate-x-1/2 bg-bg-primary text-text-primary animate-fade-in-up">
          {/* Tooltip Cap/Arrow */}
          <div className="absolute bottom-0 left-1/2 w-0 h-0 border-t-8 border-r-8 border-l-8 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-t-bg-primary"></div>

          {loading ? (
            <div className="flex gap-2 items-center">
              <FiLoader className="w-4 h-4 animate-spin" />
              <span>Converting...</span>
            </div>
          ) : (
            <table className="w-full border border-collapse border-border-primary">
              <tbody>
                {targetCurrencies.map(target => (
                  <tr key={target} className="border-b border-border-primary last:border-b-0">
                    <td className="p-1 text-left border-r border-border-primary">
                      {exchangeRates[target] !== null
                        ? `1 ${target} = ₹ ${(1 / exchangeRates[target]!).toFixed(4)}`
                        : `N/A`}
                    </td>
                    <td className="p-1 text-right">
                      {convertedValues[target] !== null
                        ? `${target} ${convertedValues[target]?.toFixed(2)}`
                        : `${target} 0.00`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrencyTooltip;
