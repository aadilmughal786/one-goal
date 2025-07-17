import { useNotificationStore } from '@/store/useNotificationStore';

const OPENWEATHERMAP_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

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

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds for weather data

export const weatherService = {
  getWeather: async (location: string): Promise<WeatherData | null> => {
    if (!OPENWEATHERMAP_API_KEY) {
      useNotificationStore
        .getState()
        .showToast('OpenWeatherMap API key is not configured.', 'error');
      return null;
    }
    try {
      const response = await fetch(
        `${BASE_URL}?q=${location}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          useNotificationStore
            .getState()
            .showToast('Location not found. Please check the spelling.', 'error');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return null;
      }
      const data: WeatherData = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      useNotificationStore
        .getState()
        .showToast('Failed to fetch weather data. Please try again later.', 'error');
      return null;
    }
  },

  getSavedLocations: (): SavedLocation[] => {
    if (typeof window === 'undefined') return [];
    const savedLocations = localStorage.getItem('weatherLocations');
    return savedLocations ? JSON.parse(savedLocations) : [];
  },

  saveLocation: (locationName: string, weatherData: WeatherData): void => {
    if (typeof window === 'undefined') return;
    const locations = weatherService.getSavedLocations();
    const newLocation: SavedLocation = {
      name: locationName,
      weather: weatherData,
      timestamp: Date.now(),
    };
    // Remove old entry if exists and add new one
    const filteredLocations = locations.filter(
      loc => loc.name.toLowerCase() !== locationName.toLowerCase()
    );
    localStorage.setItem('weatherLocations', JSON.stringify([...filteredLocations, newLocation]));
    useNotificationStore.getState().showToast(`Weather for ${locationName} saved!`, 'success');
  },

  updateLocationWeather: async (locationName: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    const locations = weatherService.getSavedLocations();
    const locationToUpdate = locations.find(
      loc => loc.name.toLowerCase() === locationName.toLowerCase()
    );

    if (locationToUpdate) {
      // Check cache duration
      if (Date.now() - locationToUpdate.timestamp < CACHE_DURATION) {
        useNotificationStore
          .getState()
          .showToast(`Weather for ${locationName} is up to date.`, 'info');
        return;
      }

      const updatedWeather = await weatherService.getWeather(locationName);
      if (updatedWeather) {
        weatherService.saveLocation(locationName, updatedWeather);
        useNotificationStore
          .getState()
          .showToast(`Weather for ${locationName} updated!`, 'success');
      } else {
        useNotificationStore
          .getState()
          .showToast(`Failed to update weather for ${locationName}.`, 'error');
      }
    } else {
      useNotificationStore
        .getState()
        .showToast(`Location ${locationName} not found in saved list.`, 'error');
    }
  },

  deleteLocation: (locationName: string): void => {
    if (typeof window === 'undefined') return;
    const locations = weatherService.getSavedLocations();
    const filteredLocations = locations.filter(
      loc => loc && loc.name && loc.name.toLowerCase() !== locationName.toLowerCase()
    );
    localStorage.setItem('weatherLocations', JSON.stringify(filteredLocations));
    useNotificationStore.getState().showToast(`Location ${locationName} removed.`, 'info');
  },
};
