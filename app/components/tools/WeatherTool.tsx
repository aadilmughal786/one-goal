'use client';

import { weatherService } from '@/services/weatherService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { format } from 'date-fns';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { FaMoon, FaSun, FaTemperatureHigh, FaTemperatureLow, FaTint, FaWind } from 'react-icons/fa';
import { FiEdit, FiLoader, FiMapPin, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import WeatherEditModal from './WeatherEditModal';

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

interface WeatherCardProps {
  location: SavedLocation;
  onDelete: (name: string) => void;
  onEdit: (location: SavedLocation) => void;
  onPin: (location: SavedLocation) => void;
  isPinned: boolean;
  showActions?: boolean; // New prop
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  location,
  onDelete,
  onEdit,
  onPin,
  isPinned,
  showActions = true,
}) => {
  const weather = location.weather;
  const lastUpdated = new Date(location.timestamp);

  const sunriseTime = new Date(weather.sys.sunrise * 1000); // Convert to milliseconds
  const sunsetTime = new Date(weather.sys.sunset * 1000); // Convert to milliseconds

  return (
    <div className="flex flex-col p-4 h-full rounded-lg shadow-md bg-bg-secondary text-text-primary">
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">
            {weather.name}, {weather.sys.country}
          </h3>
          {showActions && (
            <div className="flex space-x-2">
              {/* Removed individual refresh button */}
              <button
                onClick={() => onEdit(location)}
                className="p-2 rounded-full cursor-pointer hover:bg-bg-tertiary"
              >
                <FiEdit />
              </button>
              <button
                onClick={() => onPin(location)}
                className={`p-2 rounded-full hover:bg-bg-tertiary cursor-pointer ${isPinned ? 'text-blue-500' : ''}`}
              >
                <FiMapPin />
              </button>
              <button
                onClick={() => onDelete(location.name)}
                className="p-2 text-red-500 rounded-full cursor-pointer hover:bg-bg-tertiary"
              >
                <FiTrash2 />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center mb-2">
          <Image
            src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
            alt={weather.weather[0].description}
            width={64} // Equivalent to w-16 (16 * 4 = 64px)
            height={64} // Equivalent to h-16 (16 * 4 = 64px)
          />
          <p className="ml-2 text-4xl font-bold">{weather.main.temp.toFixed(1)}°C</p>
        </div>
        <p className="mb-1 capitalize text-text-secondary">{weather.weather[0].description}</p>
        <p className="mb-2 text-sm text-text-tertiary">
          Feels like: {weather.main.feels_like.toFixed(1)}°C
        </p>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <p className="flex items-center">
            <FaTemperatureLow className="mr-1" /> Min Temp: {weather.main.temp_min.toFixed(1)}°C
          </p>
          <p className="flex items-center">
            <FaTemperatureHigh className="mr-1" /> Max Temp: {weather.main.temp_max.toFixed(1)}°C
          </p>
          <p className="flex items-center">
            <FaTint className="mr-1" /> Humidity: {weather.main.humidity}%
          </p>
          <p className="flex items-center">
            <FaWind className="mr-1" /> Wind: {weather.wind.speed.toFixed(1)} m/s
          </p>
          <p className="flex items-center">
            <FaSun className="mr-1" /> Sunrise: {format(sunriseTime, 'HH:mm')}
          </p>
          <p className="flex items-center">
            <FaMoon className="mr-1" /> Sunset: {format(sunsetTime, 'HH:mm')}
          </p>
        </div>
      </div>
      <p className="pt-2 mt-auto text-xs text-text-tertiary">
        Last updated: {format(lastUpdated, 'MMM d, yyyy HH:mm')}
      </p>
    </div>
  );
};

const WeatherTool: React.FC = () => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [newLocationName, setNewLocationName] = useState<string>('');
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pinnedLocations, setPinnedLocations] = useState<string[]>([]); // Stores names of pinned locations
  const [isRefreshingAll, setIsRefreshingAll] = useState(false); // New state for refresh all loading

  const { showToast } = useNotificationStore();

  useEffect(() => {
    setLocations(weatherService.getSavedLocations());
    const storedPinned = localStorage.getItem('pinnedWeatherLocations');
    if (storedPinned) {
      setPinnedLocations(JSON.parse(storedPinned));
    }
  }, []);

  const handleAddOrUpdateLocation = async () => {
    if (!newLocationName.trim()) {
      showToast('Please enter a location name.', 'error');
      return;
    }

    const weatherData = await weatherService.getWeather(newLocationName);
    if (weatherData) {
      weatherService.saveLocation(newLocationName, weatherData);
      setLocations(weatherService.getSavedLocations());
      setNewLocationName('');
      setEditingLocation(null);
      setIsEditModalOpen(false);
    }
  };

  // Removed handleRefreshSingleLocation

  const handleRefreshAllLocations = async () => {
    setIsRefreshingAll(true);
    const currentLocations = weatherService.getSavedLocations();
    for (const loc of currentLocations) {
      await weatherService.updateLocationWeather(loc.name);
    }
    setLocations(weatherService.getSavedLocations());
    setIsRefreshingAll(false);
    showToast('All weather locations refreshed!', 'success');
  };

  const handleDelete = (name: string) => {
    weatherService.deleteLocation(name);
    setLocations(weatherService.getSavedLocations());
    setPinnedLocations(prev => prev.filter(locName => locName !== name)); // Unpin if deleted
    localStorage.setItem(
      'pinnedWeatherLocations',
      JSON.stringify(pinnedLocations.filter(locName => locName !== name))
    );
  };

  const handleEdit = (location: SavedLocation) => {
    setEditingLocation(location);
    setNewLocationName(location.name); // Pre-fill input with current name
    setIsEditModalOpen(true);
  };

  const handleSaveEditedLocation = (oldName: string, newName: string) => {
    const locations = weatherService.getSavedLocations();
    const locationToUpdate = locations.find(loc => loc.name === oldName);

    if (locationToUpdate) {
      // Update the name in the saved locations
      const updatedLocations = locations.map(loc =>
        loc.name === oldName ? { ...loc, name: newName } : loc
      );
      localStorage.setItem('weatherLocations', JSON.stringify(updatedLocations));
      setLocations(updatedLocations);

      // Update pinned locations if the edited location was pinned
      if (pinnedLocations.includes(oldName)) {
        setPinnedLocations(prev => prev.map(locName => (locName === oldName ? newName : locName)));
        localStorage.setItem(
          'pinnedWeatherLocations',
          JSON.stringify(pinnedLocations.map(locName => (locName === oldName ? newName : locName)))
        );
      }
      showToast(`Location ${oldName} updated to ${newName}.`, 'success');
    } else {
      showToast(`Location ${oldName} not found.`, 'error');
    }
    setIsEditModalOpen(false);
    setNewLocationName('');
    setEditingLocation(null);
  };

  const handlePin = (location: SavedLocation) => {
    let updatedPinnedLocations;
    if (pinnedLocations.includes(location.name)) {
      updatedPinnedLocations = pinnedLocations.filter(name => name !== location.name);
      showToast(`${location.name} unpinned from dashboard.`, 'info');
    } else {
      updatedPinnedLocations = [...pinnedLocations, location.name];
      showToast(`${location.name} pinned to dashboard!`, 'success');
    }
    setPinnedLocations(updatedPinnedLocations);
    localStorage.setItem('pinnedWeatherLocations', JSON.stringify(updatedPinnedLocations));
  };

  return (
    <div className="p-6 mx-auto w-full max-w-4xl rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Weather Tool</h2>
      <div className="flex mb-4 space-x-2">
        <input
          type="text"
          value={newLocationName}
          onChange={e => setNewLocationName(e.target.value)}
          placeholder="Enter city name (e.g., London)"
          className="flex-grow p-2 rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleAddOrUpdateLocation}
          className="inline-flex gap-2 justify-center items-center px-4 py-2 font-semibold text-black bg-white rounded-md transition-all duration-200 cursor-pointer hover:bg-gray-200"
        >
          <FiPlus />
          {editingLocation ? 'Update Location' : 'Add Location'}
        </button>
        <button
          onClick={handleRefreshAllLocations}
          disabled={isRefreshingAll || locations.length === 0}
          className="inline-flex gap-2 justify-center items-center px-4 py-2 font-semibold text-black bg-white rounded-md transition-all duration-200 cursor-pointer hover:bg-gray-200"
        >
          {isRefreshingAll ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          Refresh All
        </button>
      </div>

      <p className="mb-4 text-sm text-text-secondary">
        Use the <FiMapPin className="inline-block mx-1" /> pin icon on a weather card to show it on
        your dashboard.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {locations.length > 0 ? (
          locations.map(loc => (
            <WeatherCard
              key={loc.name}
              location={loc}
              // onRefresh={handleRefreshSingleLocation} // Removed individual refresh handler
              onDelete={handleDelete}
              onEdit={handleEdit}
              onPin={handlePin}
              isPinned={pinnedLocations.includes(loc.name)}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-text-secondary">
            No locations saved. Add one above!
          </p>
        )}
      </div>

      <WeatherEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        locationToEdit={editingLocation}
        onSave={handleSaveEditedLocation}
      />
    </div>
  );
};

export default WeatherTool;
