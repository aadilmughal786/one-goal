'use client';

import Fuse from 'fuse.js';
import React, { useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import { FaSearch } from 'react-icons/fa';

interface GameItem {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  component: React.FC;
}

interface GameSearchAndListProps {
  allGames: GameItem[];
  handleGameSelect: (gameId: string) => void;
  handleRequestGame: () => void;
}

const fuseOptions = {
  keys: ['name', 'description'],
  threshold: 0.3,
};

const GameSearchAndList: React.FC<GameSearchAndListProps> = ({
  allGames,
  handleGameSelect,
  handleRequestGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const fuse = useMemo(() => new Fuse(allGames, fuseOptions), [allGames]);

  const filteredGames = useMemo(() => {
    if (!searchQuery) {
      return allGames;
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse, allGames]);

  return (
    <>
      <div className="flex items-center mb-6 rounded-lg border shadow-sm border-border-primary bg-bg-secondary">
        <FaSearch className="ml-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search for games..."
          className="flex-1 p-3 bg-transparent focus:outline-none text-text-primary placeholder-text-muted"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search games"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="flex flex-col items-center p-6 text-center rounded-lg border shadow-lg transition-shadow duration-200 cursor-pointer border-border-primary bg-bg-secondary hover:shadow-xl"
              >
                <Icon className="mb-4 text-4xl text-text-accent" />
                <h2 className="mb-2 text-xl font-semibold text-text-primary">{game.name}</h2>
                <p className="text-sm text-text-secondary">{game.description}</p>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center md:col-span-3 text-text-muted">
            No games found matching your search.
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleRequestGame}
          className="px-4 py-2 text-white bg-blue-500 rounded-md transition-colors duration-200 hover:bg-blue-600"
        >
          Request a New Game
        </button>
      </div>
    </>
  );
};

export default GameSearchAndList;
