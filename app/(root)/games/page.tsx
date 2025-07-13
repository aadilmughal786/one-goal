'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import {
  FaAppleAlt,
  FaCalculator,
  FaGripLines,
  FaHandRock,
  FaQuestionCircle,
  FaSearch,
  FaTh,
  FaTimes,
} from 'react-icons/fa';
import { FaBolt, FaHammer, FaTowerCell } from 'react-icons/fa6';
import { FiChevronLeft } from 'react-icons/fi';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import BalloonPop from '@/components/games/BalloonPop';
import CatchTheFallingObjects from '@/components/games/CatchTheFallingObjects';

import Game2048 from '@/components/games/Game2048';
import GameSearchAndList from '@/components/games/GameSearchAndList';
import GuessTheNumber from '@/components/games/GuessTheNumber';
import HangmanGame from '@/components/games/HangmanGame';

import ReactionTimeTester from '@/components/games/ReactionTimeTester';
import RockPaperScissors from '@/components/games/RockPaperScissors';
import SimpleCalculatorGame from '@/components/games/SimpleCalculatorGame';
import SnakeGame from '@/components/games/SnakeGame';

import SudokuGame from '@/components/games/SudokuGame';
import TicTacToe from '@/components/games/TicTacToe';
import TowerOfHanoi from '@/components/games/TowerOfHanoi';
import WhackAMole from '@/components/games/WhackAMole';
import { useAuth } from '@/hooks/useAuth';
import { BsBalloon } from 'react-icons/bs';
import { GoNumber } from 'react-icons/go';
import { VscSnake } from 'react-icons/vsc';

interface GameItem {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const allGames: GameItem[] = [
  {
    id: 'browse',
    name: 'Browse Games',
    description: 'Search and discover available games.',
    icon: FaSearch,
    component: ({ allGames, handleGameSelect, handleRequestGame }) => (
      <GameSearchAndList
        allGames={allGames}
        handleGameSelect={handleGameSelect}
        handleRequestGame={handleRequestGame}
      />
    ),
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock, Paper, Scissors',
    description: 'Play the classic game against the computer.',
    icon: FaHandRock,
    component: RockPaperScissors,
  },
  {
    id: 'guess-the-number',
    name: 'Guess the Number',
    description: 'Guess a randomly generated number.',
    icon: FaQuestionCircle,
    component: GuessTheNumber,
  },
  {
    id: 'hangman',
    name: 'Hangman Game',
    description: 'Classic word-guessing game.',
    icon: FaGripLines,
    component: HangmanGame,
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    description: 'Test your reflexes by whacking moles.',
    icon: FaHammer,
    component: WhackAMole,
  },
  {
    id: 'snake-game',
    name: 'Snake Game',
    description: 'Play the classic snake game.',
    icon: VscSnake,
    component: SnakeGame,
  },

  {
    id: 'reaction-time-tester',
    name: 'Reaction Time Tester',
    description: 'Test how fast your reflexes are.',
    icon: FaBolt,
    component: ReactionTimeTester,
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Classic 3x3 grid game.',
    icon: FaTimes,
    component: TicTacToe,
  },
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles to merge numbers.',
    icon: GoNumber,
    component: Game2048,
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Solve a basic Sudoku puzzle.',
    icon: FaTh,
    component: SudokuGame,
  },
  {
    id: 'tower-of-hanoi',
    name: 'Tower of Hanoi',
    description: 'Move discs between pegs with rules.',
    icon: FaTowerCell,
    component: TowerOfHanoi,
  },
  {
    id: 'calculator-game',
    name: 'Simple Calculator Game',
    description: 'Solve basic math problems quickly.',
    icon: FaCalculator,
    component: SimpleCalculatorGame,
  },
  {
    id: 'catch-objects',
    name: 'Catch the Falling Objects',
    description: 'Move a character to catch specific objects.',
    icon: FaAppleAlt,
    component: CatchTheFallingObjects,
  },

  {
    id: 'balloon-pop',
    name: 'Balloon Pop',
    description: 'Pop balloons as they float up.',
    icon: BsBalloon,
    component: BalloonPop,
  },
];

const GamesPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isGameContentLoading, setIsGameContentLoading] = useState(false);

  useEffect(() => {
    const gameFromUrl = searchParams.get('game');
    if (gameFromUrl && allGames.some(game => game.id === gameFromUrl)) {
      setSelectedGameId(gameFromUrl);
    } else {
      setSelectedGameId('browse'); // Default to 'browse' game
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && selectedGameId) {
      setIsGameContentLoading(true);
      const timer = setTimeout(() => {
        setIsGameContentLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedGameId, isLoading]);

  const handleGameSelect = useCallback(
    (gameId: string) => {
      setSelectedGameId(gameId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('game', gameId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleBackToGames = useCallback(() => {
    setSelectedGameId('browse');
    router.replace('/games?game=browse', { scroll: false });
  }, [router]);

  const handleRequestGame = useCallback(() => {
    const githubIssueUrl =
      'https://github.com/aadilmughal786/one-goal/issues/new?assignees=&labels=feature&projects=&template=feature_request.md&title=Feature%3A+New+Game+Suggestion';
    window.open(githubIssueUrl, '_blank');
  }, []);

  const renderContent = () => {
    if (isLoading || isGameContentLoading) {
      return <PageContentSkeleton />;
    }

    const currentGame = allGames.find(t => t.id === selectedGameId);

    if (currentGame) {
      const ComponentToRender = currentGame.component;
      if (currentGame.id === 'browse') {
        return (
          <ComponentToRender
            allGames={allGames.filter(game => game.id !== 'browse')}
            handleGameSelect={handleGameSelect}
            handleRequestGame={handleRequestGame}
          />
        );
      } else {
        return (
          <div className="pt-4">
            <ComponentToRender />
          </div>
        );
      }
    }
    return (
      <div className="p-8 text-center text-text-secondary">
        <p className="text-lg">Select a game from the list to get started!</p>
      </div>
    );
  };

  return (
    <main className="flex flex-col min-h-screen text-text-primary bg-bg-primary font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-bg-primary/50 border-border-primary">
        {isLoading ? (
          <div className="flex space-x-2">
            <div className="px-4 py-3 animate-pulse">
              <div className="w-24 h-6 rounded-md bg-bg-tertiary"></div>
            </div>
          </div>
        ) : selectedGameId === 'browse' ? (
          <div className="flex space-x-2">
            <button
              onClick={handleBackToGames}
              className="flex gap-2 items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none text-text-primary border-border-accent"
              aria-label="Games"
            >
              Games
            </button>
          </div>
        ) : (
          <div className="flex relative justify-center items-center w-full">
            <button
              onClick={handleBackToGames}
              className="absolute left-0 p-2 rounded-full transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              aria-label="Go to Games"
            >
              <FiChevronLeft size={24} />
            </button>
            <button
              className="flex gap-2 items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none text-text-primary border-border-accent"
              aria-label={`Current Game: ${allGames.find(t => t.id === selectedGameId)?.name}`}
            >
              {allGames.find(t => t.id === selectedGameId)?.name}
            </button>
          </div>
        )}
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-5xl">{renderContent()}</div>
    </main>
  );
};

export default function GamesPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <GamesPageContent />
    </Suspense>
  );
}
