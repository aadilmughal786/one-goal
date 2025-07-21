// app/data/timezones.ts

export interface Timezone {
  name: string;
  timezone: string;
  country: string;
}

export const timezones: Timezone[] = [
  { name: 'New York', timezone: 'America/New_York', country: 'USA' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA' },
  { name: 'Chicago', timezone: 'America/Chicago', country: 'USA' },
  { name: 'London', timezone: 'Europe/London', country: 'UK' },
  { name: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
  { name: 'Rome', timezone: 'Europe/Rome', country: 'Italy' },
  { name: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain' },
  { name: 'Amsterdam', timezone: 'Europe/Amsterdam', country: 'Netherlands' },
  { name: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
  { name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
  { name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'China' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
  { name: 'Beijing', timezone: 'Asia/Shanghai', country: 'China' },
  { name: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
  { name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { name: 'Melbourne', timezone: 'Australia/Melbourne', country: 'Australia' },
  { name: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil' },
  { name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
  { name: 'Mexico City', timezone: 'America/Mexico_City', country: 'Mexico' },
  { name: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
  { name: 'Vancouver', timezone: 'America/Vancouver', country: 'Canada' },
  { name: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt' },
  { name: 'Lagos', timezone: 'Africa/Lagos', country: 'Nigeria' },
  { name: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa' },
  { name: 'Istanbul', timezone: 'Europe/Istanbul', country: 'Turkey' },
];
