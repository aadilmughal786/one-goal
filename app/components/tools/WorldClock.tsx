// app/components/tools/WorldClock.tsx
'use client';

import { Timezone, timezones } from '@/data/timezones';
import React, { useEffect, useState } from 'react';
import { FiClock, FiGlobe, FiMoon, FiPlus, FiSearch, FiSun, FiUsers, FiX } from 'react-icons/fi';

const LOCAL_STORAGE_KEY = 'one-goal-world-clocks';

const WorldClockApp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);
  const [selectedTimezones, setSelectedTimezones] = useState<Timezone[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setSelectedTimezones(JSON.parse(stored));
    } else {
      setSelectedTimezones([
        { name: 'New York', timezone: 'America/New_York', country: 'USA' },
        { name: 'London', timezone: 'Europe/London', country: 'UK' },
        { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedTimezones));
  }, [selectedTimezones]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInTimezone = (timezone: string) => {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getDateInTimezone = (timezone: string) => {
    return new Date().toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeOfDay = (timezone: string) => {
    const hour = parseInt(
      new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      })
    );

    if (hour >= 6 && hour < 12) return { period: 'Morning', icon: FiSun, color: 'text-yellow-500' };
    if (hour >= 12 && hour < 17)
      return { period: 'Afternoon', icon: FiSun, color: 'text-orange-500' };
    if (hour >= 17 && hour < 21)
      return { period: 'Evening', icon: FiSun, color: 'text-orange-600' };
    return { period: 'Night', icon: FiMoon, color: 'text-blue-500' };
  };

  const getTimeDifference = (timezone: string) => {
    const localTime = new Date();
    const timezoneTime = new Date(localTime.toLocaleString('en-US', { timeZone: timezone }));
    const diffHours = Math.round((timezoneTime.getTime() - localTime.getTime()) / (1000 * 60 * 60));

    if (diffHours === 0) return 'Same time';
    if (diffHours > 0) return `+${diffHours}h`;
    return `${diffHours}h`;
  };

  const addTimezone = (timezone: Timezone) => {
    if (!selectedTimezones.find(tz => tz.timezone === timezone.timezone)) {
      setSelectedTimezones([...selectedTimezones, timezone]);
    }
    setShowAddCity(false);
    setSearchTerm('');
  };

  const removeTimezone = (timezoneToRemove: string) => {
    setSelectedTimezones(selectedTimezones.filter(tz => tz.timezone !== timezoneToRemove));
  };

  const filteredTimezones = timezones.filter(
    tz =>
      tz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tz.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const findBestMeetingTime = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const businessHours = hours.filter(hour => hour >= 9 && hour <= 17);

    return businessHours
      .map(hour => {
        const suitableTimezones = selectedTimezones.filter(tz => {
          const testTime = new Date();
          testTime.setHours(hour, 0, 0, 0);
          const timezoneHour = parseInt(
            testTime.toLocaleString('en-US', {
              timeZone: tz.timezone,
              hour: '2-digit',
              hour12: false,
            })
          );
          return timezoneHour >= 9 && timezoneHour <= 17;
        });

        return {
          hour: `${hour.toString().padStart(2, '0')}:00`,
          suitable: suitableTimezones.length,
          total: selectedTimezones.length,
          percentage: Math.round((suitableTimezones.length / selectedTimezones.length) * 100),
        };
      })
      .sort((a, b) => b.suitable - a.suitable);
  };

  const meetingTimes = findBestMeetingTime();

  return (
    <div className="p-6 mx-auto max-w-6xl min-h-screen bg-bg-primary text-text-primary">
      <div className="p-6 mb-6 rounded-lg shadow-lg bg-bg-secondary">
        <h1 className="flex gap-2 items-center mb-2 text-3xl font-bold text-text-primary">
          <FiGlobe className="text-accent" />
          World Clock
        </h1>
        <p className="text-text-secondary">
          Track time across multiple time zones and find the best meeting times
        </p>
      </div>

      {/* Current Local Time */}
      <div className="p-6 mb-6 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="mb-2 text-xl font-semibold">Your Local Time</h2>
            <div className="text-3xl font-bold">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-lg opacity-90">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          <FiClock size={64} className="opacity-80" />
        </div>
      </div>

      {/* Add City Section */}
      <div className="p-6 mb-6 rounded-lg shadow-lg bg-bg-secondary">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">World Clocks</h2>
          <button
            onClick={() => setShowAddCity(!showAddCity)}
            className="flex gap-2 items-center px-4 py-2 text-white rounded-lg cursor-pointer bg-accent hover:opacity-80"
          >
            <FiPlus size={20} />
            Add City
          </button>
        </div>

        {showAddCity && (
          <div className="p-4 mb-6 rounded-lg bg-bg-tertiary">
            <div className="relative mb-4">
              <FiSearch className="absolute top-3 left-3 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search cities..."
                className="py-2 pr-4 pl-10 w-full rounded-lg border border-border-primary bg-bg-primary focus:ring-2 focus:ring-accent focus:border-accent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid overflow-y-auto grid-cols-1 gap-2 max-h-64 md:grid-cols-2 lg:grid-cols-3">
              {filteredTimezones.map(timezone => (
                <button
                  key={timezone.timezone}
                  onClick={() => addTimezone(timezone)}
                  className="p-3 text-left rounded-lg border transition-colors cursor-pointer border-border-secondary hover:bg-bg-tertiary hover:border-accent"
                  disabled={selectedTimezones.some(tz => tz.timezone === timezone.timezone)}
                >
                  <div className="font-medium text-text-primary">{timezone.name}</div>
                  <div className="text-sm text-text-secondary">{timezone.country}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Timezones */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {selectedTimezones.map(timezone => {
            const timeOfDay = getTimeOfDay(timezone.timezone);
            const TimeIcon = timeOfDay.icon;

            return (
              <div
                key={timezone.timezone}
                className="relative p-4 rounded-lg border bg-bg-tertiary border-border-primary"
              >
                <button
                  onClick={() => removeTimezone(timezone.timezone)}
                  className="absolute top-2 right-2 cursor-pointer text-text-muted hover:text-red-500"
                >
                  <FiX size={16} />
                </button>

                <div className="flex gap-2 items-center mb-2">
                  <TimeIcon className={`${timeOfDay.color}`} size={20} />
                  <h3 className="font-semibold text-text-primary">{timezone.name}</h3>
                </div>

                <div className="mb-1 text-2xl font-bold text-text-primary">
                  {getTimeInTimezone(timezone.timezone)}
                </div>

                <div className="mb-2 text-sm text-text-secondary">
                  {getDateInTimezone(timezone.timezone)}
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-sm ${timeOfDay.color}`}>{timeOfDay.period}</span>
                  <span className="text-sm text-text-muted">
                    {getTimeDifference(timezone.timezone)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meeting Time Finder */}
      {selectedTimezones.length > 1 && (
        <div className="p-6 rounded-lg shadow-lg bg-bg-secondary">
          <h2 className="flex gap-2 items-center mb-4 text-xl font-semibold text-text-primary">
            <FiUsers className="text-accent" />
            Best Meeting Times
          </h2>
          <p className="mb-4 text-text-secondary">
            Find the best times when most locations are in business hours (9 AM - 5 PM)
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetingTimes.slice(0, 6).map(time => (
              <div key={time.hour} className="p-4 rounded-lg border border-border-primary">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-text-primary">{time.hour}</span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      time.percentage >= 75
                        ? 'bg-green-500/20 text-green-500'
                        : time.percentage >= 50
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {time.percentage}%
                  </span>
                </div>

                <div className="text-sm text-text-secondary">
                  {time.suitable} of {time.total} locations
                </div>

                <div className="mt-2 w-full h-2 rounded-full bg-bg-tertiary">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      time.percentage >= 75
                        ? 'bg-green-500'
                        : time.percentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${time.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldClockApp;
