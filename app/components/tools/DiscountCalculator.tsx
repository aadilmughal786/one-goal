'use client';

import React, { useState } from 'react';
import { FiLoader } from 'react-icons/fi';

const DiscountCalculator: React.FC = () => {
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<string | null>(null);
  const [youSaved, setYouSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const calculateDiscount = () => {
    setIsLoading(true);
    setFinalPrice(null);
    setYouSaved(null);

    setTimeout(() => {
      const price = parseFloat(originalPrice);
      const discount = parseFloat(discountPercentage);

      if (isNaN(price) || isNaN(discount) || price <= 0 || discount < 0 || discount > 100) {
        setFinalPrice('Invalid input');
        setYouSaved(null);
        setIsLoading(false);
        return;
      }

      const savedAmount = (price * discount) / 100;
      const final = price - savedAmount;

      setFinalPrice(final.toFixed(2));
      setYouSaved(savedAmount.toFixed(2));
      setIsLoading(false);
    }, 1000); // 1 second fake delay
  };

  return (
    <div className="p-6 mx-auto rounded-lg shadow-lg w-xl bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Discount Calculator</h2>
      <div className="mb-4">
        <label htmlFor="originalPrice" className="block mb-2 text-sm font-medium">
          Original Price ($):
        </label>
        <input
          type="number"
          id="originalPrice"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={originalPrice}
          onChange={e => setOriginalPrice(e.target.value)}
          placeholder="e.g., 100.00"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="discountPercentage" className="block mb-2 text-sm font-medium">
          Discount Percentage (%):
        </label>
        <input
          type="number"
          id="discountPercentage"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={discountPercentage}
          onChange={e => setDiscountPercentage(e.target.value)}
          placeholder="e.g., 15"
        />
      </div>
      <button
        onClick={calculateDiscount}
        disabled={isLoading}
        className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Calculating...</span>
          </>
        ) : (
          <span>Calculate Discount</span>
        )}
      </button>
      {finalPrice && (
        <div className="p-4 mt-6 rounded-md border bg-bg-primary border-border-primary">
          <p className="text-lg font-medium">
            Final Price: <span className="font-bold text-accent">${finalPrice}</span>
          </p>
          {youSaved && (
            <p className="text-lg font-medium">
              You Saved: <span className="font-bold text-accent">${youSaved}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountCalculator;
