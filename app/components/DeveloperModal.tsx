// src/components/DeveloperModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FiX, FiMail, FiLinkedin, FiGithub, FiInfo } from 'react-icons/fi'; // Removed FiPhone, FiAward, FiBriefcase, FiCode
import { DeveloperInfo } from '@/types';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeveloperInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate fetch delay

        const mockData: DeveloperInfo = {
          name: 'Aadil Mughal',
          title: 'Full Stack Developer',
          email: 'aadilmughal.dev@example.com',
          linkedin: 'https://www.linkedin.com/in/aadil-mughal-dev',
          github: 'https://github.com/aadilmughal786',
          description:
            "This 'One Goal' application was created with the philosophy that focus is a superpower. In a world of constant distractions, I believe that by concentrating on one core objective at a time, individuals can achieve significant progress and excellence. This app aims to provide a clear, uncluttered space to define that one goal, track progress, manage distractions, and reflect on achievements, fostering a truly productive mindset.",
        };
        setDeveloperInfo(mockData);
      } catch (err) {
        setError('Failed to load developer information.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setDeveloperInfo(null); // Clear previous info on open
      fetchDeveloperInfo();
    }
  }, [isOpen]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div id="developerModal" className="modal show" onClick={handleOutsideClick}>
      <div className="max-w-xl modal-content">
        {' '}
        {/* Adjusted max-width slightly */}
        <div className="p-8">
          <div className="flex justify-between items-center pb-4 mb-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">About the Developer & App</h2>
            <button
              className="p-1 text-gray-500 rounded-full hover:text-gray-700 hover:bg-gray-100"
              onClick={onClose}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-12 h-12 rounded-full border-b-2 border-gray-900 animate-spin"></div>
            </div>
          ) : error ? (
            <p className="py-8 text-lg text-center text-red-500">{error}</p>
          ) : developerInfo ? (
            <div className="space-y-8 text-gray-700">
              <div className="text-center">
                <h3 className="text-3xl font-extrabold text-gray-900">{developerInfo.name}</h3>
                <p className="mt-1 text-lg text-gray-600">{developerInfo.title}</p>
              </div>

              {/* App Description */}
              <div className="p-4 bg-gray-100 rounded-lg shadow-sm">
                <h4 className="flex gap-2 items-center mb-3 text-xl font-semibold text-gray-800">
                  <FiInfo /> Why this App?
                </h4>
                <p className="leading-relaxed text-gray-700">{developerInfo.description}</p>
              </div>

              {/* Contact Info */}
              <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
                <h4 className="flex gap-2 items-center mb-3 text-xl font-semibold text-blue-800">
                  <FiMail /> Contact Information
                </h4>
                <p className="flex gap-2 items-center mb-1 font-medium text-blue-700">
                  <FiMail className="w-4 h-4" /> {developerInfo.email}
                </p>
                <p className="flex gap-2 items-center">
                  <FiLinkedin className="w-4 h-4 text-blue-700" />
                  <a
                    href={developerInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </p>
                <p className="flex gap-2 items-center">
                  <FiGithub className="w-4 h-4 text-blue-700" />
                  <a
                    href={developerInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    GitHub Profile
                  </a>
                </p>
              </div>
              {/* Skills and Experience sections removed */}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DeveloperModal;
