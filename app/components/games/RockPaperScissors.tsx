'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { FaHandPaper, FaHandRock, FaHandScissors } from 'react-icons/fa';

type Choice = 'rock' | 'paper' | 'scissors';

const RockPaperScissors: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const choices: Choice[] = useMemo(() => ['rock', 'paper', 'scissors'], []);

  const determineWinner = useCallback((player: Choice, computer: Choice) => {
    if (player === computer) {
      return "It's a tie!";
    } else if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'You win!';
    } else {
      return 'Computer wins!';
    }
  }, []);

  const playGame = useCallback(
    (choice: Choice) => {
      setAnimating(true);
      setPlayerChoice(null);
      setComputerChoice(null);
      setResult(null);

      setTimeout(() => {
        const randomComputerChoice = choices[Math.floor(Math.random() * choices.length)];
        setPlayerChoice(choice);
        setComputerChoice(randomComputerChoice);
        setResult(determineWinner(choice, randomComputerChoice));
        setAnimating(false);
      }, 1000); // Simulate thinking time for animation
    },
    [choices, determineWinner]
  );

  const ChoiceDisplay: React.FC<{ choice: Choice | null; label: string }> = ({ choice, label }) => {
    const Icon =
      choice === 'rock'
        ? FaHandRock
        : choice === 'paper'
          ? FaHandPaper
          : choice === 'scissors'
            ? FaHandScissors
            : null;
    return (
      <div className="flex flex-col items-center">
        <p className="mb-2 text-lg font-medium">{label}</p>
        <div
          className={`p-4 rounded-lg bg-bg-tertiary text-text-primary flex items-center justify-center w-24 h-24 text-5xl transition-all duration-300 ease-in-out
            ${animating ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
            ${choice ? 'shadow-md' : 'border border-border-primary'}`}
        >
          {Icon && <Icon />}
        </div>
        <p className="mt-2 text-lg font-semibold capitalize">{choice}</p>
      </div>
    );
  };

  return (
    <div className="p-6 text-center rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-4 text-2xl font-semibold">Rock, Paper, Scissors</h2>

      <div className="mb-6">
        <p className="mb-4 text-lg font-medium">Make your choice:</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => playGame('rock')}
            className="flex flex-col items-center p-4 text-white rounded-lg transition-colors cursor-pointer bg-accent hover:bg-accent-dark"
          >
            <FaHandRock size={40} />
            <span className="mt-2">Rock</span>
          </button>
          <button
            onClick={() => playGame('paper')}
            className="flex flex-col items-center p-4 text-white rounded-lg transition-colors cursor-pointer bg-accent hover:bg-accent-dark"
          >
            <FaHandPaper size={40} />
            <span className="mt-2">Paper</span>
          </button>
          <button
            onClick={() => playGame('scissors')}
            className="flex flex-col items-center p-4 text-white rounded-lg transition-colors cursor-pointer bg-accent hover:bg-accent-dark"
          >
            <FaHandScissors size={40} />
            <span className="mt-2">Scissors</span>
          </button>
        </div>
      </div>

      <div className="flex gap-8 justify-center items-center mt-6">
        <ChoiceDisplay choice={playerChoice} label="You Chose:" />
        <div className="text-4xl font-bold text-text-primary">VS</div>
        <ChoiceDisplay choice={computerChoice} label="Computer Chose:" />
      </div>

      {result && (
        <div
          className={`mt-6 p-4 bg-bg-primary rounded-md border border-border-primary transition-opacity duration-500 ease-in-out
            ${animating ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="mt-2 text-xl font-bold text-text-primary">{result}</p>
        </div>
      )}
    </div>
  );
};

export default RockPaperScissors;
