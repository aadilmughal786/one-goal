'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { useState } from 'react';
import { FaRegLightbulb } from 'react-icons/fa';
import { FiRefreshCcw } from 'react-icons/fi';

interface ExtractedData {
  ips: string[];
  hashtags: string[];
  urls: string[];
  emails: string[];
  phoneNumbers: string[];
  numbers: string[];
  names: string[];
  emojis: string[];
}

const TextExtractor: React.FC = () => {
  const { showToast } = useNotificationStore();
  const [inputText, setInputText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const extractData = () => {
    if (!inputText.trim()) {
      showToast('Please enter text to extract data from.', 'error');
      setExtractedData(null);
      return;
    }

    const ips = inputText.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
    const hashtags = inputText.match(/#[a-zA-Z0-9_]+/g) || [];
    const urls = inputText.match(/\b(?:https?:\/\/|www\.)\S+\b/g) || [];
    const emails = inputText.match(/\b[\w.-]+@[\w.-]+\.[a-zA-Z]{2,6}\b/g) || [];
    const phoneNumbers = inputText.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || [];
    const numbers = inputText.match(/\b\d+\.?\d*\b/g) || [];
    // Simple regex for names (capitalized words, might need refinement for accuracy)
    const names = inputText.match(/\b[A-Z][a-z]+\b/g) || [];
    const emojis =
      inputText.match(
        /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g
      ) || [];

    setExtractedData({
      ips,
      hashtags,
      urls,
      emails,
      phoneNumbers,
      numbers,
      names,
      emojis,
    });
  };

  const clearFields = () => {
    setInputText('');
    setExtractedData(null);
    showToast('Fields cleared.', 'info');
  };

  const renderExtractedList = (title: string, items: string[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          {title} ({items.length}):
        </h3>
        <ul className="space-y-1 list-disc list-inside text-text-secondary">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-bg-primary">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Text Extractor</h2>

      <div className="mb-4">
        <label htmlFor="inputText" className="block mb-2 text-sm font-bold text-text-secondary">
          Enter Text:
        </label>
        <textarea
          id="inputText"
          className="p-2 w-full rounded-md border border-border-primary bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={8}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text containing IPs, hashtags, URLs, emails, phone numbers, numbers, or names."
        ></textarea>
      </div>

      <div className="flex mb-4 space-x-2">
        <button
          onClick={extractData}
          className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Extract Data
        </button>
        <button
          onClick={clearFields}
          className="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          title="Clear Fields"
        >
          <FiRefreshCcw />
        </button>
      </div>

      {extractedData && (
        <div className="p-4 mt-4 rounded-lg border bg-bg-secondary border-border-primary">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Extracted Information:</h3>
          {renderExtractedList('IP Addresses', extractedData.ips)}
          {renderExtractedList('Hashtags', extractedData.hashtags)}
          {renderExtractedList('URLs', extractedData.urls)}
          {renderExtractedList('Emails', extractedData.emails)}
          {renderExtractedList('Phone Numbers', extractedData.phoneNumbers)}
          {renderExtractedList('Numbers', extractedData.numbers)}
          {renderExtractedList('Names', extractedData.names)}
          {renderExtractedList('Emojis', extractedData.emojis)}

          {Object.values(extractedData).every(arr => arr.length === 0) && (
            <p className="text-text-secondary">No data extracted.</p>
          )}
        </div>
      )}

      <div className="p-4 mt-8 rounded-lg border bg-bg-secondary border-border-primary">
        <h3 className="flex gap-2 items-center mb-2 text-lg font-semibold text-text-primary">
          <FaRegLightbulb /> How it Works:
        </h3>
        <p className="mb-2 text-sm text-text-secondary">
          This tool uses regular expressions (regex) to identify and extract specific patterns from
          the input text. Each category (IPs, emails, URLs, etc.) has a predefined regex pattern
          that it matches against the text.
        </p>
        <ul className="space-y-1 text-sm list-disc list-inside text-text-secondary">
          <li>
            <strong>IP Addresses:</strong> Matches standard IPv4 patterns.
          </li>
          <li>
            <strong>Hashtags:</strong> Identifies words starting with &apos;#&apos;.
          </li>
          <li>
            <strong>URLs:</strong> Detects common web addresses (http/https/www).
          </li>
          <li>
            <strong>Emails:</strong> Recognizes standard email address formats.
          </li>
          <li>
            <strong>Phone Numbers:</strong> Looks for common 10-digit phone number patterns (with
            optional separators).
          </li>
          <li>
            <strong>Numbers:</strong> Extracts sequences of digits, including decimals.
          </li>
          <li>
            <strong>Names:</strong> A basic attempt to find capitalized words. This is a simple
            heuristic and may not be fully accurate for all names or contexts.
          </li>
          <li>
            <strong>Emojis:</strong> Detects common Unicode emoji characters.
          </li>
        </ul>
        <p className="mt-2 text-sm text-text-secondary">
          For more complex or nuanced extraction, specialized natural language processing (NLP)
          tools might be required.
        </p>
      </div>
    </div>
  );
};

export default TextExtractor;
