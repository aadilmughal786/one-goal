'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useState } from 'react';
import { FiRefreshCcw } from 'react-icons/fi';

interface UrlParts {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

const UrlAnatomyTool: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputUrl, setInputUrl] = useState('');
  const [urlParts, setUrlParts] = useState<UrlParts | null>(null);

  const parseUrl = () => {
    if (!inputUrl) {
      showToast('Please enter a URL.', 'error');
      setUrlParts(null);
      return;
    }

    try {
      const url = new URL(inputUrl);

      const defaultPorts: { [key: string]: string } = {
        'http:': '80',
        'https:': '443',
        'ftp:': '21',
        'ssh:': '22',
      };

      const port = url.port || defaultPorts[url.protocol] || 'N/A';

      setUrlParts({
        protocol: url.protocol,
        hostname: url.hostname,
        port: port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      });
    } catch {
      showToast('Invalid URL format.', 'error');
      setUrlParts(null);
    }
  };

  const clearFields = () => {
    setInputUrl('');
    setUrlParts(null);
    showToast('Fields cleared.', 'info');
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">URL Anatomy Tool</h2>

      <div className="mb-4">
        <label htmlFor="inputUrl" className="block mb-2 text-sm font-bold text-text-secondary">
          Enter URL:
        </label>
        <input
          id="inputUrl"
          type="text"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          placeholder="e.g., https://www.example.com:8080/path/to/page?query=string#hash"
        />
      </div>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={parseUrl}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Parse URL
        </button>
        <button
          onClick={clearFields}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {urlParts && (
        <div className="p-4 mt-4 rounded-lg border bg-bg-secondary border-border-primary">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">URL Components:</h3>
          <ul className="space-y-1 text-text-secondary">
            <li>
              <strong>Protocol:</strong> {urlParts.protocol || 'N/A'}
            </li>
            <li>
              <strong>Hostname:</strong> {urlParts.hostname || 'N/A'}
            </li>
            <li>
              <strong>Port:</strong> {urlParts.port || 'N/A'}
            </li>
            <li>
              <strong>Pathname:</strong> {urlParts.pathname || 'N/A'}
            </li>
            <li>
              <strong>Hash (Fragment):</strong>
              {urlParts.hash ? (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                  {urlParts.hash}
                </span>
              ) : (
                'N/A'
              )}
            </li>
            <li>
              <strong>Search (Query):</strong>
              {urlParts.search ? (
                <table className="mt-2 w-full text-sm border-collapse table-auto">
                  <thead>
                    <tr className="bg-bg-tertiary">
                      <th className="p-2 text-left border border-border-primary">Parameter</th>
                      <th className="p-2 text-left border border-border-primary">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new URLSearchParams(urlParts.search).entries()).map(
                      ([key, value]) => (
                        <tr key={key} className="even:bg-bg-secondary odd:bg-bg-primary">
                          <td className="p-2 border border-border-primary">{key}</td>
                          <td className="p-2 border border-border-primary">{value}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                'N/A'
              )}
            </li>
          </ul>
        </div>
      )}

      <div className="p-4 mt-8 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">How URL Anatomy Works:</h3>
        <p className="mb-2 text-sm text-text-secondary">
          A Uniform Resource Locator (URL) is a reference to a web resource that specifies its
          location on a computer network and a mechanism for retrieving it. It is composed of
          several parts, each serving a specific purpose:
        </p>
        <ul className="space-y-1 text-sm list-disc list-inside text-text-secondary">
          <li>
            <strong>Protocol:</strong> The method used to access the resource (e.g.,{' '}
            <code>http://</code>, <code>https://</code>, <code>ftp://</code>).
          </li>
          <li>
            <strong>Hostname:</strong> The domain name or IP address of the server hosting the
            resource (e.g., <code>www.example.com</code>).
          </li>
          <li>
            <strong>Port:</strong> An optional number indicating the specific port on the server to
            connect to (e.g., <code>:8080</code>). If omitted, the default port for the protocol is
            used.
          </li>
          <li>
            <strong>Pathname:</strong> The specific location of the resource on the server (e.g.,{' '}
            <code>/path/to/page</code>).
          </li>
          <li>
            <strong>Search (Query):</strong> A string of information passed to the server, typically
            key-value pairs, starting with a question mark (<code>?</code>) (e.g.,{' '}
            <code>?query=string&param=value</code>).
          </li>
          <li>
            <strong>Hash (Fragment):</strong> An anchor identifier that points to a specific section
            within a document, starting with a hash symbol (<code>#</code>) (e.g.,{' '}
            <code>#section-name</code>). This part is processed by the client (browser) and not sent
            to the server.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UrlAnatomyTool;
