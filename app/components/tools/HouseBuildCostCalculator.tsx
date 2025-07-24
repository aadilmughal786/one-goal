'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaDollarSign, FaHammer, FaHome, FaMapMarkerAlt } from 'react-icons/fa';
import { FiCheck, FiChevronDown, FiRefreshCcw } from 'react-icons/fi';

interface QualityMultipliers {
  min: number;
  max: number;
}

interface FoundationCosts {
  [key: string]: number;
}

interface MaterialCosts {
  [key: string]: number;
}

const qualityMultipliers: { [key: string]: QualityMultipliers } = {
  basic: { min: 80, max: 120 },
  standard: { min: 120, max: 180 },
  high: { min: 180, max: 250 },
  luxury: { min: 250, max: 350 },
};

const locationMultipliers: { [key: string]: number } = {
  rural: 0.9,
  suburban: 1.0,
  urban: 1.15,
  metro: 1.25,
};

const foundationCosts: FoundationCosts = {
  slab: 0,
  crawl: 3000,
  basement: 15000,
  walkout: 25000,
};

const roofingCosts: MaterialCosts = {
  asphalt: 0,
  metal: 8000,
  tile: 12000,
  slate: 20000,
};

const sidingCosts: MaterialCosts = {
  vinyl: 0,
  fiber: 5000,
  wood: 8000,
  brick: 15000,
  stone: 25000,
};

const HouseBuildCostCalculator: React.FC = () => {
  const { showToast } = useNotificationStore();

  const [sqft, setSqft] = useState<number>(2000);
  const [stories, setStories] = useState<string>('2');
  const [bedrooms, setBedrooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [quality, setQuality] = useState<string>('standard');
  const [foundation, setFoundation] = useState<string>('slab');
  const [roofing, setRoofing] = useState<string>('asphalt');
  const [siding, setSiding] = useState<string>('vinyl');
  const [permits, setPermits] = useState<number>(8000);
  const [location, setLocation] = useState<string>('suburban');
  const [additionalFeatures, setAdditionalFeatures] = useState<{
    [key: string]: boolean;
  }>({});

  const [isStoriesDropdownOpen, setIsStoriesDropdownOpen] = useState(false);
  const storiesDropdownRef = useRef<HTMLDivElement>(null);
  const [isBedroomsDropdownOpen, setIsBedroomsDropdownOpen] = useState(false);
  const bedroomsDropdownRef = useRef<HTMLDivElement>(null);
  const [isBathroomsDropdownOpen, setIsBathroomsDropdownOpen] = useState(false);
  const bathroomsDropdownRef = useRef<HTMLDivElement>(null);
  const [isQualityDropdownOpen, setIsQualityDropdownOpen] = useState(false);
  const qualityDropdownRef = useRef<HTMLDivElement>(null);
  const [isFoundationDropdownOpen, setIsFoundationDropdownOpen] = useState(false);
  const foundationDropdownRef = useRef<HTMLDivElement>(null);
  const [isRoofingDropdownOpen, setIsRoofingDropdownOpen] = useState(false);
  const roofingDropdownRef = useRef<HTMLDivElement>(null);
  const [isSidingDropdownOpen, setIsSidingDropdownOpen] = useState(false);
  const sidingDropdownRef = useRef<HTMLDivElement>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const featureOptions = useMemo(
    () => [
      { id: 'garage', label: '2-Car Garage', value: 15000 },
      { id: 'deck', label: 'Deck/Patio', value: 8000 },
      { id: 'fireplace', label: 'Fireplace', value: 5000 },
      { id: 'hvac_upgrade', label: 'HVAC Upgrade', value: 3000 },
      { id: 'hardwood', label: 'Hardwood Floors', value: 8000 },
      { id: 'granite', label: 'Granite Counters', value: 4000 },
      { id: 'appliances', label: 'High-End Appliances', value: 6000 },
      { id: 'smart_home', label: 'Smart Home System', value: 5000 },
    ],
    []
  );

  const calculateCosts = useCallback(() => {
    const currentSqft = sqft || 0;
    const currentPermits = permits || 0;

    if (currentSqft <= 0) {
      showToast('Please enter a valid square footage.', 'error');
      return null;
    }

    // Base construction cost
    const qualityRange = qualityMultipliers[quality];
    const baseCostPerSqft = (qualityRange.min + qualityRange.max) / 2;
    const baseConstructionCost = currentSqft * baseCostPerSqft;

    // Foundation adjustment
    const foundationPremium = foundationCosts[foundation];

    // Material upgrades
    const roofingUpgradeCost = roofingCosts[roofing];
    const sidingUpgradeCost = sidingCosts[siding];

    // Additional features
    let totalFeaturesCost = 0;
    featureOptions.forEach(feature => {
      if (additionalFeatures[feature.id]) {
        totalFeaturesCost += feature.value;
      }
    });

    // Location adjustment
    const locationMultiplier = locationMultipliers[location];
    const adjustedBaseCost = baseConstructionCost * locationMultiplier;
    const locationAdjustment = adjustedBaseCost - baseConstructionCost;

    // Total cost calculation
    const storiesCost = (parseInt(stories) - 1) * 10000; // Example: $10,000 per story after the first
    const bedroomsCost = (parseInt(bedrooms) > 2 ? parseInt(bedrooms) - 2 : 0) * 5000; // Example: $5,000 per bedroom after 2
    const bathroomsCost = parseFloat(bathrooms) > 1 ? (parseFloat(bathrooms) - 1) * 7500 : 0; // Example: $7,500 per bathroom after 1

    const totalEstimatedCost = Math.round(
      adjustedBaseCost +
        foundationPremium +
        roofingUpgradeCost +
        sidingUpgradeCost +
        totalFeaturesCost +
        currentPermits +
        storiesCost +
        bedroomsCost +
        bathroomsCost
    );

    // Cost range (±10%)
    const rangeLow = Math.round(totalEstimatedCost * 0.9);
    const rangeHigh = Math.round(totalEstimatedCost * 1.1);

    return {
      totalEstimatedCost,
      costPerSqft: Math.round(totalEstimatedCost / currentSqft),
      baseConstructionCost: Math.round(baseConstructionCost),
      totalFeaturesCost: Math.round(totalFeaturesCost + roofingUpgradeCost + sidingUpgradeCost),
      locationAdjustment: Math.round(locationAdjustment),
      permitsCost: currentPermits,
      foundationPremium: Math.round(foundationPremium),
      storiesCost: Math.round(storiesCost),
      bedroomsCost: Math.round(bedroomsCost),
      bathroomsCost: Math.round(bathroomsCost),
      rangeLow,
      rangeHigh,
    };
  }, [
    sqft,
    stories,
    bedrooms,
    bathrooms,
    quality,
    permits,
    foundation,
    roofing,
    siding,
    location,
    additionalFeatures,
    showToast,
    featureOptions,
  ]);

  const results = useMemo(() => calculateCosts(), [calculateCosts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFeatureChange = (id: string) => {
    setAdditionalFeatures(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const clearAllFields = () => {
    setSqft(2000);
    setStories('2');
    setBedrooms('3');
    setBathrooms('2');
    setQuality('standard');
    setFoundation('slab');
    setRoofing('asphalt');
    setSiding('vinyl');
    setPermits(8000);
    setLocation('suburban');
    setAdditionalFeatures({});
    showToast('All fields cleared and reset to defaults.', 'info');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        storiesDropdownRef.current &&
        !storiesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStoriesDropdownOpen(false);
      }
      if (
        bedroomsDropdownRef.current &&
        !bedroomsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBedroomsDropdownOpen(false);
      }
      if (
        bathroomsDropdownRef.current &&
        !bathroomsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBathroomsDropdownOpen(false);
      }
      if (
        qualityDropdownRef.current &&
        !qualityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsQualityDropdownOpen(false);
      }
      if (
        foundationDropdownRef.current &&
        !foundationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFoundationDropdownOpen(false);
      }
      if (
        roofingDropdownRef.current &&
        !roofingDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoofingDropdownOpen(false);
      }
      if (sidingDropdownRef.current && !sidingDropdownRef.current.contains(event.target as Node)) {
        setIsSidingDropdownOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary text-text-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">House Build Cost Calculator</h2>
      <p className="mb-6 text-text-secondary">
        Estimate your home construction costs with detailed breakdowns
      </p>

      <div className="grid grid-cols-1 gap-6">
        <div>
          {/* Basic Information */}
          <div className="p-6 mb-6 rounded-lg border shadow-md bg-bg-secondary border-border-primary">
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <FaHome className="text-accent" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <div className="form-group">
                <label htmlFor="sqft" className="block mb-2 text-sm font-bold text-text-secondary">
                  Square Footage{' '}
                  <span className="text-xs text-accent" data-tooltip="Total livable square footage">
                    ℹ️
                  </span>
                </label>
                <input
                  type="number"
                  id="sqft"
                  value={sqft}
                  onChange={e => setSqft(parseInt(e.target.value) || 0)}
                  min="500"
                  max="10000"
                  className="p-2 w-full rounded-md border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="form-group">
                <label
                  htmlFor="stories"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Number of Stories
                </label>
                <div className="relative" ref={storiesDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStoriesDropdownOpen(!isStoriesDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>{stories} Story</span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isStoriesDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isStoriesDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {['1', '2', '3'].map(story => (
                        <button
                          key={story}
                          type="button"
                          onClick={() => {
                            setStories(story);
                            setIsStoriesDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={stories === story}
                        >
                          {story} Story
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-group">
                <label
                  htmlFor="bedrooms"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Bedrooms
                </label>
                <div className="relative" ref={bedroomsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBedroomsDropdownOpen(!isBedroomsDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>{bedrooms} Bedrooms</span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isBedroomsDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isBedroomsDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {['1', '2', '3', '4', '5', '6+'].map(bedroom => (
                        <button
                          key={bedroom}
                          type="button"
                          onClick={() => {
                            setBedrooms(bedroom);
                            setIsBedroomsDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={bedrooms === bedroom}
                        >
                          {bedroom} Bedrooms
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label
                  htmlFor="bathrooms"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Bathrooms
                </label>
                <div className="relative" ref={bathroomsDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBathroomsDropdownOpen(!isBathroomsDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>{bathrooms} Bathrooms</span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isBathroomsDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isBathroomsDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {['1', '1.5', '2', '2.5', '3', '3.5', '4+'].map(bathroom => (
                        <button
                          key={bathroom}
                          type="button"
                          onClick={() => {
                            setBathrooms(bathroom);
                            setIsBathroomsDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={bathrooms === bathroom}
                        >
                          {bathroom} Bathrooms
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Construction Quality */}
          <div className="p-6 mb-6 rounded-lg border shadow-md bg-bg-secondary border-border-primary">
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <FaHammer className="text-accent" /> Construction Quality
            </h3>
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <div className="form-group">
                <label
                  htmlFor="quality"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Overall Quality Level
                </label>
                <div className="relative" ref={qualityDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsQualityDropdownOpen(!isQualityDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isQualityDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isQualityDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.keys(qualityMultipliers).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setQuality(key);
                            setIsQualityDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={quality === key}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label
                  htmlFor="foundation"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Foundation Type
                </label>
                <div className="relative" ref={foundationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsFoundationDropdownOpen(!isFoundationDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>
                      {foundation.charAt(0).toUpperCase() +
                        foundation
                          .slice(1)
                          .replace('slab', 'Concrete Slab')
                          .replace('crawl', 'Crawl Space')
                          .replace('basement', 'Full Basement')
                          .replace('walkout', 'Walkout Basement')}
                    </span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isFoundationDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isFoundationDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.entries(foundationCosts).map(([key, _value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setFoundation(key);
                            setIsFoundationDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={foundation === key}
                        >
                          {key.charAt(0).toUpperCase() +
                            key
                              .slice(1)
                              .replace('slab', 'Concrete Slab')
                              .replace('crawl', 'Crawl Space')
                              .replace('basement', 'Full Basement')
                              .replace('walkout', 'Walkout Basement')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-group">
                <label
                  htmlFor="roofing"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Roofing Material
                </label>
                <div className="relative" ref={roofingDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoofingDropdownOpen(!isRoofingDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>
                      {roofing.charAt(0).toUpperCase() +
                        roofing
                          .slice(1)
                          .replace('asphalt', 'Asphalt Shingles')
                          .replace('metal', 'Metal Roofing')
                          .replace('tile', 'Tile Roofing')
                          .replace('slate', 'Slate')}
                    </span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isRoofingDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isRoofingDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.entries(roofingCosts).map(([key, _value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setRoofing(key);
                            setIsRoofingDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={roofing === key}
                        >
                          {key.charAt(0).toUpperCase() +
                            key
                              .slice(1)
                              .replace('asphalt', 'Asphalt Shingles')
                              .replace('metal', 'Metal Roofing')
                              .replace('tile', 'Tile Roofing')
                              .replace('slate', 'Slate')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label
                  htmlFor="siding"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Exterior Siding
                </label>
                <div className="relative" ref={sidingDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSidingDropdownOpen(!isSidingDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>
                      {siding.charAt(0).toUpperCase() +
                        siding
                          .slice(1)
                          .replace('vinyl', 'Vinyl Siding')
                          .replace('fiber', 'Fiber Cement')
                          .replace('wood', 'Wood Siding')
                          .replace('brick', 'Brick Veneer')
                          .replace('stone', 'Stone Veneer')}
                    </span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isSidingDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isSidingDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.entries(sidingCosts).map(([key, _value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSiding(key);
                            setIsSidingDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={siding === key}
                        >
                          {key.charAt(0).toUpperCase() +
                            key
                              .slice(1)
                              .replace('vinyl', 'Vinyl Siding')
                              .replace('fiber', 'Fiber Cement')
                              .replace('wood', 'Wood Siding')
                              .replace('brick', 'Brick Veneer')
                              .replace('stone', 'Stone Veneer')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="p-6 mb-6 rounded-lg border shadow-md bg-bg-secondary border-border-primary">
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <FaDollarSign className="text-accent" /> Additional Features
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featureOptions.map(feature => (
                <div
                  key={feature.id}
                  className={`flex items-center gap-2 p-3 border rounded-md transition-all duration-200 ${additionalFeatures[feature.id] ? 'bg-green-500/10 border-green-500/30' : 'bg-bg-primary border-border-primary'} cursor-pointer`}
                  onClick={() => handleFeatureChange(feature.id)}
                >
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={additionalFeatures[feature.id] || false}
                      onChange={() => handleFeatureChange(feature.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex-none flex items-center justify-center w-6 h-6 border-2 rounded-md transition-all duration-300 ${additionalFeatures[feature.id] ? 'bg-green-500 border-green-500' : 'border-border-secondary bg-bg-tertiary group-hover:border-border-accent'}`}
                    >
                      {additionalFeatures[feature.id] ? (
                        <FiCheck className="w-4 h-4 text-white" />
                      ) : null}
                    </span>
                    <span className="ml-2 text-sm text-text-secondary">
                      {feature.label} (+{formatCurrency(feature.value)})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Location Factors */}
          <div className="p-6 mb-6 rounded-lg border shadow-md bg-bg-secondary border-border-primary">
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <FaMapMarkerAlt className="text-accent" /> Location Factors
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-group">
                <label
                  htmlFor="location"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Location Type
                </label>
                <div className="relative" ref={locationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="flex justify-between items-center px-4 py-2 w-full text-left rounded-md border cursor-pointer text-text-primary bg-bg-secondary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <span>
                      {location.charAt(0).toUpperCase() +
                        location
                          .slice(1)
                          .replace('rural', 'Rural Area (-10%)')
                          .replace('suburban', 'Suburban (Base Cost)')
                          .replace('urban', 'Urban Area (+15%)')
                          .replace('metro', 'Major Metro (+25%)')}
                    </span>
                    <FiChevronDown
                      className={`transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isLocationDropdownOpen && (
                    <div
                      className="overflow-y-auto absolute z-10 p-2 mt-1 w-full max-h-60 rounded-md border shadow-lg bg-bg-primary border-border-primary"
                      role="listbox"
                    >
                      {Object.entries(locationMultipliers).map(([key, _value]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setLocation(key);
                            setIsLocationDropdownOpen(false);
                          }}
                          className="flex items-center px-3 py-2 w-full text-left rounded-md transition-colors cursor-pointer text-text-primary hover:bg-border-primary"
                          role="option"
                          aria-selected={location === key}
                        >
                          {key.charAt(0).toUpperCase() +
                            key
                              .slice(1)
                              .replace('rural', 'Rural Area (-10%)')
                              .replace('suburban', 'Suburban (Base Cost)')
                              .replace('urban', 'Urban Area (+15%)')
                              .replace('metro', 'Major Metro (+25%)')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label
                  htmlFor="permits"
                  className="block mb-2 text-sm font-bold text-text-secondary"
                >
                  Permits & Fees
                </label>
                <input
                  type="number"
                  id="permits"
                  value={permits}
                  onChange={e => setPermits(parseInt(e.target.value) || 0)}
                  min="0"
                  max="50000"
                  className="p-2 w-full rounded-md border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="results-column">
          <div className="p-6 rounded-lg border shadow-md bg-bg-secondary border-border-primary">
            <h3 className="flex gap-2 items-center mb-4 text-lg font-semibold">
              <FaDollarSign className="text-accent" /> Cost Estimate
            </h3>

            {results ? (
              <>
                <div className="p-5 mb-4 text-center text-white bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg">
                  <div className="mb-1 text-3xl font-bold">
                    {formatCurrency(results.totalEstimatedCost)}
                  </div>
                  <div className="text-sm opacity-90">{results.costPerSqft} per sq ft</div>
                </div>

                <div className="p-4 mt-4 text-center rounded-lg border bg-bg-primary border-border-primary">
                  <div className="mb-2 text-sm text-text-secondary">Estimated Range</div>
                  <div className="flex justify-between items-center font-semibold text-text-primary">
                    <span>{formatCurrency(results.rangeLow)}</span>
                    <span>to</span>
                    <span>{formatCurrency(results.rangeHigh)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Base Construction</span>
                    <span className="font-semibold">
                      {formatCurrency(results.baseConstructionCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Additional Features & Materials</span>
                    <span className="font-semibold">
                      {formatCurrency(results.totalFeaturesCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Location Adjustment</span>
                    <span className="font-semibold">
                      {formatCurrency(results.locationAdjustment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Foundation Premium</span>
                    <span className="font-semibold">
                      {formatCurrency(results.foundationPremium)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Stories Adjustment</span>
                    <span className="font-semibold">{formatCurrency(results.storiesCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Bedrooms Adjustment</span>
                    <span className="font-semibold">{formatCurrency(results.bedroomsCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Bathrooms Adjustment</span>
                    <span className="font-semibold">{formatCurrency(results.bathroomsCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-text-secondary">Permits & Fees</span>
                    <span className="font-semibold">{formatCurrency(results.permitsCost)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-text-secondary">Enter details to calculate cost.</p>
            )}

            <button
              onClick={clearAllFields}
              className="px-4 py-2 mt-6 w-full text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <FiRefreshCcw className="inline mr-2" /> Reset All Fields
            </button>

            <div className="p-3 mt-4 text-sm text-yellow-800 bg-yellow-100 rounded-md border border-yellow-400">
              <strong>Disclaimer:</strong> These are rough estimates for planning purposes. Actual
              costs may vary significantly based on local labor rates, material costs, site
              conditions, and specific design choices. Always consult with local contractors for
              accurate quotes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseBuildCostCalculator;
