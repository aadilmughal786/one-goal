'use client';

import React, { useState } from 'react';

const DiscountCalculator: React.FC = () => {
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<string | null>(null);
  const [youSaved, setYouSaved] = useState<string | null>(null);

  const calculateDiscount = () => {
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercentage);

    if (isNaN(price) || isNaN(discount) || price <= 0 || discount < 0 || discount > 100) {
      setFinalPrice('Invalid input');
      setYouSaved(null);
      return;
    }

    const savedAmount = (price * discount) / 100;
    const final = price - savedAmount;

    setFinalPrice(final.toFixed(2));
    setYouSaved(savedAmount.toFixed(2));
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg shadow-lg text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Discount Calculator</h2>
      <div className="mb-4">
        <label htmlFor="originalPrice" className="block mb-2 text-sm font-medium">
          Original Price ($):
        </label>
        <input
          type="number"
          id="originalPrice"
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
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
          className="w-full p-2 border rounded-md bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={discountPercentage}
          onChange={e => setDiscountPercentage(e.target.value)}
          placeholder="e.g., 15"
        />
      </div>
      <button
        onClick={calculateDiscount}
        className="w-full px-4 py-2 text-white rounded-md bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Calculate Discount
      </button>
      {finalPrice && (
        <div className="mt-6 p-4 bg-bg-primary rounded-md border border-border-primary">
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
