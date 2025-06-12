// components/AppHeader.tsx
import React from 'react';
import { FiTarget, FiDownload, FiUpload, FiRotateCcw, FiLogOut } from 'react-icons/fi'; // Added FiRotateCcw, FiLogOut
import { User } from 'firebase/auth'; // Import User type

interface AppHeaderProps {
  onExport: () => void;
  onImport: () => void;
  currentUser: User | null; // Pass current user for conditional rendering
  onSignOut: () => void; // Callback for sign out
  onResetGoal: () => void; // Callback for reset goal
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onExport,
  onImport,
  currentUser,
  onSignOut,
  onResetGoal,
}) => {
  return (
    <header className="relative py-8 text-center">
      {' '}
      {/* Added relative for absolute positioning of control buttons */}
      {/* Control Buttons Section (Sign Out, Export, Import, Reset Goal) */}
      <div className="flex absolute top-4 right-4 z-50 flex-col gap-2 items-end md:flex-row">
        {currentUser && ( // Sign Out button visible only when user is logged in
          <button
            onClick={onSignOut}
            className="flex gap-1 items-center px-4 py-2 font-medium text-white bg-red-500 rounded-lg transition-all duration-300 hover:bg-red-600"
            title="Sign Out"
          >
            <FiLogOut className="w-5 h-5" />
            Sign Out
          </button>
        )}
        <div className="flex gap-2">
          {' '}
          {/* Group export/import/reset buttons */}
          <button id="exportBtn" className="icon-btn" title="Export Data" onClick={onExport}>
            <FiDownload className="w-5 h-5" />
          </button>
          <button id="importBtn" className="icon-btn" title="Import Data" onClick={onImport}>
            <FiUpload className="w-5 h-5" />
          </button>
          <button
            id="resetButton"
            className="icon-btn" // Reusing icon-btn style, can customize further
            onClick={onResetGoal}
            title="Reset Goal"
          >
            <FiRotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex gap-3 justify-center items-center mb-4">
        <div className="flex justify-center items-center w-12 h-12 bg-black rounded-full">
          <FiTarget className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-black">Goal Tracker</h1>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Stay focused on your goals and track your journey
      </p>
    </header>
  );
};

export default AppHeader;
