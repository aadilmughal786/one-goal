// app/components/dashboard/PinnedWeatherDisplay.tsx
'use client';

import { WeatherCard } from '@/components/tools/WeatherTool'; // Import the unified WeatherCard
import { weatherService } from '@/services/weatherService';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi'; // Import refresh icon

interface WeatherData {
  name: string;
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
  sys: { country: string; sunrise: number; sunset: number };
  dt: number; // Time of data calculation, unix, UTC
}

interface SavedLocation {
  name: string;
  weather: WeatherData;
  timestamp: number;
}

const PinnedWeatherDisplay: React.FC = () => {
  const [pinnedWeatherLocations, setPinnedWeatherLocations] = useState<SavedLocation[]>([]);

  const fetchPinnedWeather = useCallback(async () => {
    const storedPinned = localStorage.getItem('pinnedWeatherLocations');
    if (storedPinned) {
      const pinnedNames: string[] = JSON.parse(storedPinned);
      const fetchedLocations = [];
      for (const name of pinnedNames) {
        const savedLocs = weatherService.getSavedLocations();
        const savedLoc = savedLocs.find(loc => loc.name === name);

        if (savedLoc) {
          if (Date.now() - savedLoc.timestamp < 10 * 60 * 1000) {
            fetchedLocations.push(savedLoc);
          } else {
            const updatedWeather = await weatherService.getWeather(name);
            if (updatedWeather) {
              const newSavedLoc = { name, weather: updatedWeather, timestamp: Date.now() };
              weatherService.saveLocation(name, updatedWeather);
              fetchedLocations.push(newSavedLoc);
            }
          }
        } else {
          const weatherData = await weatherService.getWeather(name);
          if (weatherData) {
            const newSavedLoc = { name, weather: weatherData, timestamp: Date.now() };
            weatherService.saveLocation(name, weatherData);
            fetchedLocations.push(newSavedLoc);
          }
        }
      }
      setPinnedWeatherLocations(fetchedLocations);
    }
  }, []);

  useEffect(() => {
    fetchPinnedWeather();
    const interval = setInterval(fetchPinnedWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPinnedWeather]);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Pinned Weather</h2>
        <div className="flex items-center space-x-2">
          {pinnedWeatherLocations.length > 0 && (
            <button
              onClick={fetchPinnedWeather} // This button refreshes all pinned locations
              className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
              title="Refresh All Pinned Weather"
            >
              <FiRefreshCw />
            </button>
          )}
          <Link href="/tools?tool=weather-tool" className="text-blue-500 hover:underline">
            Manage Weather Locations
          </Link>
        </div>
      </div>
      {pinnedWeatherLocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pinnedWeatherLocations.map(loc => (
            <WeatherCard
              key={loc.name}
              location={loc}
              onDelete={() => {}} // Dummy handler
              onEdit={() => {}} // Dummy handler
              onPin={() => {}} // Dummy handler
              isPinned={true} // Always true for pinned locations
              showActions={false} // Hide actions for dashboard view
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary">
          No locations pinned. Pin locations from the Weather Tool to see them here.
        </p>
      )}
    </section>
  );
};

export default PinnedWeatherDisplay;
