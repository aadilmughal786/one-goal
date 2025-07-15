// app/components/tools/IpWhoisTool.tsx
'use client';

import React, { useState } from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi'; // Import FiLoader
import { FaGlobe } from 'react-icons/fa';
import { format } from 'date-fns';

interface IpWhoisData {
  'About Us': string;
  ip: string;
  success: boolean;
  type: string;
  continent: string;
  continent_code: string;
  country: string;
  country_code: string;
  region: string;
  region_code: string;
  city: string;
  latitude: number;
  longitude: number;
  is_eu: boolean;
  postal: string;
  calling_code: string;
  capital: string;
  borders: string;
  flag: {
    img: string;
    emoji: string;
    emoji_unicode: string;
  };
  connection: {
    asn: number;
    org: string;
    isp: string;
    domain: string;
  };
  timezone: {
    id: string;
    abbr: string;
    is_dst: boolean;
    offset: number;
    utc: string;
    current_time: string;
  };
}

const IpWhoisTool: React.FC = () => {
  const [ipData, setIpData] = useState<IpWhoisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIpData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://ipwho.is/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: IpWhoisData = await response.json();
      setIpData(data);
    } catch (e: unknown) {
      setError(`Failed to fetch IP data: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-bg-secondary rounded-lg shadow-md text-text-primary">
      <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
        <FaGlobe className="text-accent" /> IP Geolocation Lookup
      </h2>
      <p className="mb-4 text-text-secondary">
        Click the button below to fetch your current IP address information, including geographic
        and network details.
      </p>
      <div className="flex justify-center mb-6">
        <button
          onClick={fetchIpData}
          disabled={loading}
          className="inline-flex gap-2 justify-center items-center px-6 py-3 w-full text-lg font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border-accent disabled:opacity-60"
        >
          {loading ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <FiSearch className="w-5 h-5" />
              <span>Get My IP Info</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {ipData && (
        <div className="mt-6 p-4 bg-bg-tertiary rounded-md">
          <h3 className="mb-3 text-lg font-semibold">Your IP Information:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-primary">
              <tbody className="divide-y divide-border-primary">
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    IP Address
                  </td>
                  <td className="px-4 py-2">
                    {ipData.ip} ({ipData.type})
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Country
                  </td>
                  <td className="px-4 py-2">
                    {ipData.country} {ipData.flag?.emoji} ({ipData.country_code})
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">Region</td>
                  <td className="px-4 py-2">
                    {ipData.region} ({ipData.region_code})
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">City</td>
                  <td className="px-4 py-2">
                    {ipData.city} {ipData.postal && `(${ipData.postal})`}
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Capital
                  </td>
                  <td className="px-4 py-2">{ipData.capital}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Calling Code
                  </td>
                  <td className="px-4 py-2">+{ipData.calling_code}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Borders
                  </td>
                  <td className="px-4 py-2">{ipData.borders}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Continent
                  </td>
                  <td className="px-4 py-2">
                    {ipData.continent} ({ipData.continent_code})
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    EU Member
                  </td>
                  <td className="px-4 py-2">{ipData.is_eu ? 'Yes' : 'No'}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Coordinates
                  </td>
                  <td className="px-4 py-2">
                    {ipData.latitude}, {ipData.longitude}
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Organization
                  </td>
                  <td className="px-4 py-2">{ipData.connection?.org || 'N/A'}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">ISP</td>
                  <td className="px-4 py-2">{ipData.connection?.isp || 'N/A'}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">Domain</td>
                  <td className="px-4 py-2">{ipData.connection?.domain || 'N/A'}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Autonomous System Number
                  </td>
                  <td className="px-4 py-2">{ipData.connection?.asn || 'N/A'}</td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Timezone
                  </td>
                  <td className="px-4 py-2">
                    {ipData.timezone?.id} ({ipData.timezone?.abbr})
                  </td>
                </tr>
                <tr className="hover:bg-bg-secondary">
                  <td className="px-4 py-2 font-semibold border-r border-border-primary">
                    Current Time
                  </td>
                  <td className="px-4 py-2">
                    {ipData.timezone?.current_time
                      ? format(new Date(ipData.timezone.current_time), 'PPP p')
                      : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpWhoisTool;
