// app/components/tools/NetworkCalculator.tsx
'use client';

import React, { useState } from 'react';

const ipToBinary = (ip: string): string => {
  return ip
    .split('.')
    .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
    .join('');
};

const binaryToIp = (binary: string): string => {
  const octets = [];
  for (let i = 0; i < 32; i += 8) {
    octets.push(parseInt(binary.substring(i, i + 8), 2));
  }
  return octets.join('.');
};

const getNetworkClass = (ipAddress: string): string => {
  const firstOctet = parseInt(ipAddress.split('.')[0], 10);
  if (firstOctet >= 1 && firstOctet <= 126) {
    return 'A';
  } else if (firstOctet >= 128 && firstOctet <= 191) {
    return 'B';
  } else if (firstOctet >= 192 && firstOctet <= 223) {
    return 'C';
  } else if (firstOctet >= 224 && firstOctet <= 239) {
    return 'D (Multicast)';
  } else if (firstOctet >= 240 && firstOctet <= 255) {
    return 'E (Experimental)';
  } else {
    return 'N/A';
  }
};

const calculateNetworkDetails = (ipAddress: string, subnetMaskOrCidr: string) => {
  const ipBinary = ipToBinary(ipAddress);
  let subnetBinary = '';
  let cidr = 0;

  if (subnetMaskOrCidr.includes('.')) {
    // Subnet mask provided
    subnetBinary = ipToBinary(subnetMaskOrCidr);
    cidr = subnetBinary.indexOf('0');
    if (cidr === -1) cidr = 32; // All ones
  } else {
    // CIDR provided
    cidr = parseInt(subnetMaskOrCidr, 10);
    subnetBinary = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
  }

  const networkBinary = ipBinary.substring(0, cidr) + '0'.repeat(32 - cidr);
  const broadcastBinary = ipBinary.substring(0, cidr) + '1'.repeat(32 - cidr);

  const networkAddress = binaryToIp(networkBinary);
  const broadcastAddress = binaryToIp(broadcastBinary);

  const firstHostBinary = networkBinary.substring(0, 31) + '1';
  const lastHostBinary = broadcastBinary.substring(0, 31) + '0';

  const firstHost = cidr === 32 ? 'N/A' : binaryToIp(firstHostBinary);
  const lastHost = cidr === 32 ? 'N/A' : binaryToIp(lastHostBinary);

  const numberOfHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.pow(2, 32 - cidr) - 2;
  const networkClass = getNetworkClass(ipAddress);

  return {
    networkAddress,
    broadcastAddress,
    firstHost,
    lastHost,
    numberOfHosts,
    cidr,
    subnetMask: binaryToIp(subnetBinary),
    networkClass,
  };
};

const NetworkCalculator: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('');
  const [subnetMaskOrCidr, setSubnetMaskOrCidr] = useState('');
  const [networkDetails, setNetworkDetails] = useState<ReturnType<
    typeof calculateNetworkDetails
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    try {
      if (!ipAddress || !subnetMaskOrCidr) {
        setError('Please enter both IP Address and Subnet Mask/CIDR.');
        setNetworkDetails(null);
        return;
      }

      // Basic validation for IP address format
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(ipAddress)) {
        setError('Invalid IP Address format.');
        setNetworkDetails(null);
        return;
      }

      // Basic validation for subnet mask or CIDR
      if (subnetMaskOrCidr.includes('.')) {
        // Subnet mask validation
        if (!ipRegex.test(subnetMaskOrCidr)) {
          setError('Invalid Subnet Mask format.');
          setNetworkDetails(null);
          return;
        }
      } else {
        // CIDR validation
        const cidrValue = parseInt(subnetMaskOrCidr, 10);
        if (isNaN(cidrValue) || cidrValue < 0 || cidrValue > 32) {
          setError('Invalid CIDR value (0-32).');
          setNetworkDetails(null);
          return;
        }
      }

      const details = calculateNetworkDetails(ipAddress, subnetMaskOrCidr);
      setNetworkDetails(details);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      setNetworkDetails(null);
    }
  };

  return (
    <div className="p-6 mx-auto rounded-lg shadow-lg w-full max-w-4xl bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-3xl font-bold text-center">Network Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="ipAddress" className="block mb-2 text-sm font-medium">
            IP Address:
          </label>
          <input
            type="text"
            id="ipAddress"
            className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={ipAddress}
            onChange={e => setIpAddress(e.target.value)}
            placeholder="e.g., 192.168.1.1"
          />
        </div>
        <div>
          <label htmlFor="subnetMaskOrCidr" className="block mb-2 text-sm font-medium">
            Subnet Mask or CIDR:
          </label>
          <input
            type="text"
            id="subnetMaskOrCidr"
            className="p-3 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={subnetMaskOrCidr}
            onChange={e => setSubnetMaskOrCidr(e.target.value)}
            placeholder="e.g., 255.255.255.0 or /24"
          />
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full px-4 py-2 mb-8 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        Calculate Network Details
      </button>

      {error && (
        <div className="p-4 mb-8 text-red-800 bg-red-100 border border-red-300 rounded-md">
          <p className="font-semibold">Error: {error}</p>
        </div>
      )}

      {networkDetails && (
        <div className="p-6 rounded-lg border bg-bg-primary border-border-primary shadow-md">
          <h3 className="mb-4 text-2xl font-semibold text-center">Network Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                IP Address: <span className="font-bold text-accent">{ipAddress}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Subnet Mask:{' '}
                <span className="font-bold text-accent">{networkDetails.subnetMask}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                CIDR: <span className="font-bold text-accent">/{networkDetails.cidr}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Network Class:{' '}
                <span className="font-bold text-accent">{networkDetails.networkClass}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Network Address:{' '}
                <span className="font-bold text-accent">{networkDetails.networkAddress}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Broadcast Address:{' '}
                <span className="font-bold text-accent">{networkDetails.broadcastAddress}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                First Usable Host:{' '}
                <span className="font-bold text-accent">{networkDetails.firstHost}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Last Usable Host:{' '}
                <span className="font-bold text-accent">{networkDetails.lastHost}</span>
              </p>
            </div>
            <div className="p-4 rounded-md bg-bg-tertiary">
              <p className="text-lg font-medium">
                Number of Usable Hosts:{' '}
                <span className="font-bold text-accent">{networkDetails.numberOfHosts}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 mt-8 rounded-lg border bg-bg-primary border-border-primary shadow-md">
        <h3 className="mb-4 text-2xl font-semibold text-center">How Network Calculations Work</h3>
        <p className="text-text-secondary mb-4">
          A network calculator helps in understanding IP addressing, subnetting, and network
          segmentation. It takes an IP address and a subnet mask (or CIDR notation) and calculates
          various network parameters.
        </p>

        <h4 className="mb-2 text-xl font-semibold">Key Concepts:</h4>
        <ul className="list-disc list-inside text-text-secondary ml-4 mb-4">
          <li>
            <strong>IP Address:</strong> A unique numerical label assigned to each device connected
            to a computer network that uses the Internet Protocol for communication.
          </li>
          <li>
            <strong>Subnet Mask:</strong> A 32-bit number that masks an IP address and divides the
            IP address into network address and host address.
          </li>
          <li>
            <strong>CIDR (Classless Inter-Domain Routing):</strong> A method for allocating IP
            addresses and routing IP packets. It is a more flexible alternative to the traditional
            classful IP addressing system. The CIDR value (e.g., /24) indicates the number of bits
            in the network portion of the address.
          </li>
          <li>
            <strong>Network Address:</strong> The first address in a network, used to identify the
            network itself. All host bits are 0.
          </li>
          <li>
            <strong>Broadcast Address:</strong> The last address in a network, used to send data to
            all devices on that network. All host bits are 1.
          </li>
          <li>
            <strong>Usable Host Range:</strong> The range of IP addresses within a network that can
            be assigned to devices. It excludes the network and broadcast addresses.
          </li>
          <li>
            <strong>Number of Usable Hosts:</strong> The total count of IP addresses available for
            devices within a network.
          </li>
        </ul>

        <h4 className="mb-2 text-xl font-semibold">Calculation Steps:</h4>
        <ol className="list-decimal list-inside text-text-secondary ml-4">
          <li>
            <strong>Convert IP Address and Subnet Mask/CIDR to Binary:</strong> Both the IP address
            and the subnet mask are converted into their 32-bit binary representations. If CIDR is
            provided, it&apos;s converted to a binary subnet mask.
          </li>
          <li>
            <strong>Determine Network Address:</strong> Perform a bitwise AND operation between the
            IP address and the subnet mask. The result is the network address.
          </li>
          <li>
            <strong>Determine Broadcast Address:</strong> Perform a bitwise OR operation between the
            IP address and the inverse of the subnet mask. The result is the broadcast address.
          </li>
          <li>
            <strong>Identify First and Last Usable Host:</strong> The first usable host is the
            network address plus one (last bit 1). The last usable host is the broadcast address
            minus one (last bit 0).
          </li>
          <li>
            <strong>Calculate Number of Usable Hosts:</strong> This is calculated as 2^(32 - CIDR) -
            2. For /31 and /32 networks, special rules apply (2 and 1 host respectively, no
            network/broadcast addresses in the traditional sense).
          </li>
        </ol>
      </div>
    </div>
  );
};

export default NetworkCalculator;
