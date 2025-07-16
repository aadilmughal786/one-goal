import { useNotificationStore } from '@/store/useNotificationStore';

const BASE_URL = 'https://api.frankfurter.app';
const CACHE_DURATION = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

export const currencyConverterService = {
  getCurrencies: async (): Promise<Record<string, string>> => {
    const cacheKey = 'frankfurter_currencies';
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    try {
      const response = await fetch(`${BASE_URL}/currencies`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      return data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      useNotificationStore.getState().showToast('Failed to fetch currencies.', 'error');
      throw error;
    }
  },

  getExchangeRate: async (from: string, to: string): Promise<number> => {
    const cacheKey = `frankfurter_rate_${from}_${to}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    try {
      const url = `${BASE_URL}/latest?base=${from}&symbols=${to}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.rates || !data.rates[to]) {
        throw new Error('Exchange rate not found.');
      }
      const rate = data.rates[to];
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: rate, timestamp: Date.now() }));
      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      useNotificationStore.getState().showToast('Failed to fetch exchange rate.', 'error');
      throw error;
    }
  },
};
