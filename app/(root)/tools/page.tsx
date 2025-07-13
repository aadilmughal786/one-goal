// app/(root)/tools/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import {
  FaBirthdayCake,
  FaCalculator,
  FaCode,
  FaCoins,
  FaDice,
  FaDiceFive,
  FaFileAlt,
  FaGraduationCap,
  FaKey,
  FaMoneyBillWave,
  FaPercent,
  FaPercentage,
  FaSearch,
  FaWeight,
} from 'react-icons/fa';

import { FiChevronLeft, FiEdit, FiWatch } from 'react-icons/fi';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import BinaryConverter from '@/components/tools/BinaryConverter';
import BMICalculator from '@/components/tools/BMICalculator';
import ChatCalculator from '@/components/tools/ChatCalculator';
import DiscountCalculator from '@/components/tools/DiscountCalculator';
import DrawingTool from '@/components/tools/DrawingTool';
import LoanCalculator from '@/components/tools/LoanCalculator';
import TimeEstimator from '@/components/tools/TimeEstimator';
import ToolSearchAndList from '@/components/tools/ToolSearchAndList';

import AgeCalculator from '@/components/tools/AgeCalculator';
import CoinFlip from '@/components/tools/CoinFlip';
import DiceRoller from '@/components/tools/DiceRoller';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import RandomNumberGenerator from '@/components/tools/RandomNumberGenerator';
import SimpleGradeCalculator from '@/components/tools/SimpleGradeCalculator';
import TipCalculator from '@/components/tools/TipCalculator';

import TextUtility from '@/components/tools/TextUtility';
import { useAuth } from '@/hooks/useAuth';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const allTools: ToolItem[] = [
  {
    id: 'browse',
    name: 'Browse Tools',
    description: 'Search and discover available tools.',
    icon: FaSearch,
    component: ({ allTools, handleToolSelect, handleRequestTool }) => (
      <ToolSearchAndList
        allTools={allTools}
        handleToolSelect={handleToolSelect}
        handleRequestTool={handleRequestTool}
      />
    ),
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A simple calculator for quick arithmetic operations.',
    icon: FaCalculator,
    component: ChatCalculator,
  },
  {
    id: 'estimator',
    name: 'Time Estimator',
    description: 'Estimate the time required for tasks and projects.',
    icon: FiWatch,
    component: TimeEstimator,
  },
  {
    id: 'drawing',
    name: 'Drawing Pad',
    description: 'A basic drawing tool for quick sketches and diagrams.',
    icon: FiEdit,
    component: DrawingTool,
  },
  {
    id: 'bmi',
    name: 'BMI Calculator',
    description: 'Calculate your Body Mass Index.',
    icon: FaWeight,
    component: BMICalculator,
  },
  {
    id: 'discount',
    name: 'Discount Calculator',
    description: 'Calculate the final price after a discount.',
    icon: FaPercent,
    component: DiscountCalculator,
  },
  {
    id: 'loan',
    name: 'Loan Calculator',
    description: 'Calculate monthly payments and total cost of a loan.',
    icon: FaMoneyBillWave,
    component: LoanCalculator,
  },
  {
    id: 'binary-converter',
    name: 'Binary Converter',
    description: 'Convert binary numbers to decimal, hexadecimal, and octal.',
    icon: FaCode,
    component: BinaryConverter,
  },

  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate strong, random passwords.',
    icon: FaKey,
    component: PasswordGenerator,
  },

  {
    id: 'text-utility',
    name: 'Text Utility',
    description:
      'Perform various operations on text like case conversion, counting, and reversing.',
    icon: FaFileAlt,
    component: TextUtility,
  },
  {
    id: 'random-number-generator',
    name: 'Random Number Generator',
    description: 'Generate random numbers within a specified range.',
    icon: FaDice,
    component: RandomNumberGenerator,
  },
  {
    id: 'coin-flip',
    name: 'Coin Flip',
    description: 'Flip a coin to get a random Heads or Tails result.',
    icon: FaCoins,
    component: CoinFlip,
  },
  {
    id: 'dice-roller',
    name: 'Dice Roller',
    description: 'Roll one or more dice with customizable sides.',
    icon: FaDiceFive,
    component: DiceRoller,
  },
  {
    id: 'tip-calculator',
    name: 'Tip Calculator',
    description: 'Calculate tips and split bills easily.',
    icon: FaPercentage,
    component: TipCalculator,
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate age based on birth date.',
    icon: FaBirthdayCake,
    component: AgeCalculator,
  },
  {
    id: 'grade-calculator',
    name: 'Simple Grade Calculator',
    description: 'Calculate your average grade based on scores and weights.',
    icon: FaGraduationCap,
    component: SimpleGradeCalculator,
  },
];

const ToolsPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth();

  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isToolContentLoading, setIsToolContentLoading] = useState(false);

  useEffect(() => {
    const toolFromUrl = searchParams.get('tool');
    if (toolFromUrl && allTools.some(tool => tool.id === toolFromUrl)) {
      setSelectedToolId(toolFromUrl);
    } else {
      setSelectedToolId('browse'); // Default to 'browse' tool
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && selectedToolId) {
      setIsToolContentLoading(true);
      const timer = setTimeout(() => {
        setIsToolContentLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedToolId, isLoading]);

  const handleToolSelect = useCallback(
    (toolId: string) => {
      setSelectedToolId(toolId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tool', toolId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleBackToTools = useCallback(() => {
    setSelectedToolId('browse');
    router.replace('/tools?tool=browse', { scroll: false });
  }, [router]);

  const handleRequestTool = useCallback(() => {
    const githubIssueUrl =
      'https://github.com/aadilmughal786/one-goal/issues/new?assignees=&labels=feature&projects=&template=feature_request.md&title=Feature%3A+New+Tool+Suggestion';
    window.open(githubIssueUrl, '_blank');
  }, []);

  const renderContent = () => {
    if (isLoading || isToolContentLoading) {
      return <PageContentSkeleton />;
    }

    const currentTool = allTools.find(t => t.id === selectedToolId);

    if (currentTool) {
      const ComponentToRender = currentTool.component;
      if (currentTool.id === 'browse') {
        return (
          <ComponentToRender
            allTools={allTools.filter(tool => tool.id !== 'browse')}
            handleToolSelect={handleToolSelect}
            handleRequestTool={handleRequestTool}
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
        <p className="text-lg">Select a tool from the list to get started!</p>
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
        ) : selectedToolId === 'browse' ? (
          <div className="flex space-x-2">
            <button
              onClick={handleBackToTools}
              className="flex gap-2 items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none text-text-primary border-border-accent"
              aria-label="Tools"
            >
              Tools
            </button>
          </div>
        ) : (
          <div className="flex relative justify-center items-center w-full">
            <button
              onClick={handleBackToTools}
              className="absolute left-0 p-2 rounded-full transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              aria-label="Go to Tools"
            >
              <FiChevronLeft size={24} />
            </button>
            <button
              className="flex gap-2 items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 cursor-pointer focus:outline-none text-text-primary border-border-accent"
              aria-label={`Current Tool: ${allTools.find(t => t.id === selectedToolId)?.name}`}
            >
              {allTools.find(t => t.id === selectedToolId)?.name}
            </button>
          </div>
        )}
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-5xl">{renderContent()}</div>
    </main>
  );
};

export default function ToolsPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <ToolsPageContent />
    </Suspense>
  );
}
