'use client';

import React, { useState, useEffect, useRef } from 'react';
import { currencyConverterService } from '@/services/currencyConverterService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { FiLoader, FiChevronDown } from 'react-icons/fi';

interface Currency {
  code: string;
  name: string;
}

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('INR');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [displayAmount, setDisplayAmount] = useState<number | null>(null); // New state for the amount displayed in result
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);

  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await currencyConverterService.getCurrencies();
        const currencyList = Object.entries(data).map(([code, name]) => ({
          code,
          name: name as string,
        }));
        setCurrencies(currencyList);
      } catch (error) {
        console.error('Error fetching currencies:', error);
        useNotificationStore
          .getState()
          .showToast('Failed to fetch currencies. Please try again later.', 'error');
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target as Node)) {
        setIsFromDropdownOpen(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target as Node)) {
        setIsToDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      useNotificationStore.getState().showToast('Please enter a valid amount.', 'error');
      return;
    }

    setLoading(true);
    setConvertedAmount(null);
    setDisplayAmount(null); // Clear display amount before conversion
    try {
      const rate = await currencyConverterService.getExchangeRate(fromCurrency, toCurrency);
      setConvertedAmount(numAmount * rate);
      setDisplayAmount(numAmount); // Set display amount after successful conversion
    } catch (error) {
      console.error('Error converting currency:', error);
      useNotificationStore
        .getState()
        .showToast('Failed to convert currency. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyName = (code: string) => {
    const currency = currencies.find(c => c.code === code);
    return currency ? `${currency.code} - ${currency.name}` : code;
  };

  return (
    <div className="p-6 mx-auto w-full max-w-2xl rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Currency Converter</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block mb-2 text-sm font-medium">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex space-x-4">
          <div className="relative flex-1" ref={fromDropdownRef}>
            <label htmlFor="fromCurrency" className="block mb-2 text-sm font-medium">
              From
            </label>
            <button
              onClick={() => setIsFromDropdownOpen(prev => !prev)}
              className="flex justify-between items-center px-3 py-2 w-full rounded-md border cursor-pointer text-text-primary border-border-primary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span>{getCurrencyName(fromCurrency)}</span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isFromDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isFromDropdownOpen && (
              <div className="overflow-y-auto absolute z-10 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary animate-fade-in-up">
                {currencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setFromCurrency(currency.code);
                      setIsFromDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-border-primary ${fromCurrency === currency.code ? 'bg-blue-500/50' : ''}`}
                  >
                    {currency.code} - {currency.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1" ref={toDropdownRef}>
            <label htmlFor="toCurrency" className="block mb-2 text-sm font-medium">
              To
            </label>
            <button
              onClick={() => setIsToDropdownOpen(prev => !prev)}
              className="flex justify-between items-center px-3 py-2 w-full rounded-md border cursor-pointer text-text-primary border-border-primary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <span>{getCurrencyName(toCurrency)}</span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isToDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isToDropdownOpen && (
              <div className="overflow-y-auto absolute z-10 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary animate-fade-in-up">
                {currencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      setToCurrency(currency.code);
                      setIsToDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-border-primary ${toCurrency === currency.code ? 'bg-blue-500/50' : ''}`}
                  >
                    {currency.code} - {currency.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleConvert}
          disabled={loading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
        >
          {loading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <span>Convert</span>
          )}
        </button>
        {convertedAmount !== null && displayAmount !== null && (
          <div className="p-4 text-center rounded-md bg-bg-primary">
            <p className="text-lg font-semibold">
              {displayAmount.toFixed(2)} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
