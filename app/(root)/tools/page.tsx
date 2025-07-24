// app/(root)/tools/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import {
  FaBirthdayCake,
  FaCalculator,
  FaChartLine,
  FaClock,
  FaCloudSun,
  FaCode,
  FaCoins,
  FaDice,
  FaDiceFive,
  FaEye,
  FaFileAlt,
  FaGlobe,
  FaGraduationCap,
  FaKey,
  FaMoneyBillWave,
  FaPercent,
  FaPercentage,
  FaQrcode,
  FaRulerCombined,
  FaRulerHorizontal,
  FaSearch,
  FaSortNumericUp,
  FaTasks,
  FaWeight,
  FaHome,
} from 'react-icons/fa';
import { GiWeightLiftingUp } from 'react-icons/gi';

import { FiChevronLeft, FiCreditCard, FiEdit, FiGlobe, FiWatch } from 'react-icons/fi';
import { IoWaterOutline } from 'react-icons/io5';

import PageContentSkeleton from '@/components/common/PageContentSkeleton';
import AreaConverter from '@/components/tools/AreaConverter';
import Base64Converter from '@/components/tools/Base64Converter';
import BinaryConverter from '@/components/tools/BinaryConverter';
import BMICalculator from '@/components/tools/BMICalculator';
import ChatCalculator from '@/components/tools/ChatCalculator';
import DiscountCalculator from '@/components/tools/DiscountCalculator';
import DrawingTool from '@/components/tools/DrawingTool';
import HashCalculator from '@/components/tools/HashCalculator';
import LengthConverter from '@/components/tools/LengthConverter';
import LoanCalculator from '@/components/tools/LoanCalculator';
import NumberSorter from '@/components/tools/NumberSorter';
import TextExtractor from '@/components/tools/TextExtractor';

import CAGRCalculator from '@/components/tools/CAGRCalculator';
import EBITDACalculator from '@/components/tools/EBITDACalculator';
import ROICalculator from '@/components/tools/ROICalculator';
import TimeEstimator from '@/components/tools/TimeEstimator';
import ToolSearchAndList from '@/components/tools/ToolSearchAndList';
import UrlAnatomyTool from '@/components/tools/UrlAnatomyTool';

import JWTDecoder from '@/components/tools/JWTDecoder';
import SavingMinutesCalculator from '@/components/tools/SavingMinutesCalculator';
import GUIDGenerator from '@/components/tools/GUIDGenerator';
import HouseBuildCostCalculator from '@/components/tools/HouseBuildCostCalculator';

import AgeCalculator from '@/components/tools/AgeCalculator';
import CoinFlip from '@/components/tools/CoinFlip';
import DailyTimePercentageCalculator from '@/components/tools/DailyTimePercentageCalculator';
import DiceRoller from '@/components/tools/DiceRoller';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import QRCodeGenerator from '@/components/tools/QRCodeGenerator';
import RandomNumberGenerator from '@/components/tools/RandomNumberGenerator';
import SimpleGradeCalculator from '@/components/tools/SimpleGradeCalculator';
import TipCalculator from '@/components/tools/TipCalculator';
import VisionTest from '@/components/tools/VisionTest';
import WaterIntakeCalculator from '@/components/tools/WaterIntakeCalculator';

import CombinationCalculator from '@/components/tools/CombinationCalculator';
import CreditCardValidator from '@/components/tools/CreditCardValidator';
import CurrencyConverter from '@/components/tools/CurrencyConverter';
import DepreciationCalculator from '@/components/tools/DepreciationCalculator';
import EisenhowerMatrix from '@/components/tools/EisenhowerMatrix';
import InvestmentReturnCalculator from '@/components/tools/InvestmentReturnCalculator';
import IpWhoisTool from '@/components/tools/IpWhoisTool';
import NetworkCalculator from '@/components/tools/NetworkCalculator';
import NumerologyCalculator from '@/components/tools/NumerologyCalculator';
import NutritionTracker from '@/components/tools/NutritionTracker';
import PasswordEntropyCalculator from '@/components/tools/PasswordEntropyCalculator';
import TextUtility from '@/components/tools/TextUtility';
import WeatherTool from '@/components/tools/WeatherTool';
import WorldClock from '@/components/tools/WorldClock';
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
    id: 'water-intake',
    name: 'Water Intake Calculator',
    description: 'Estimate your daily water intake based on weight and activity level.',
    icon: IoWaterOutline,
    component: WaterIntakeCalculator,
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
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes from text or URLs.',
    icon: FaQrcode,
    component: QRCodeGenerator,
  },
  {
    id: 'vision-test',
    name: 'Vision Test',
    description: 'Perform a basic Snellen eye chart test.',
    icon: FaEye,
    component: VisionTest,
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
    id: 'ip-whois',
    name: 'IP Geolocation Lookup',
    description: 'Look up information about an IP address.',
    icon: FaGlobe,
    component: IpWhoisTool,
  },
  {
    id: 'grade-calculator',
    name: 'Simple Grade Calculator',
    description: 'Calculate your average grade based on scores and weights.',
    icon: FaGraduationCap,
    component: SimpleGradeCalculator,
  },
  {
    id: 'currency-converter',
    name: 'Currency Converter',
    description: 'Convert currencies using real-time exchange rates.',
    icon: FaMoneyBillWave,
    component: CurrencyConverter,
  },
  {
    id: 'weather-tool',
    name: 'Weather Tool',
    description: 'Get current weather information for multiple locations.',
    icon: FaCloudSun,
    component: WeatherTool,
  },
  {
    id: 'daily-time-percentage',
    name: 'Daily Time Percentage',
    description: 'Calculate what percentage of a day a certain amount of time represents.',
    icon: FaClock,
    component: DailyTimePercentageCalculator,
  },
  {
    id: 'nutrition-tracker',
    name: 'Nutrition Tracker',
    description: 'Track your daily nutrition intake and reach your health goals.',
    icon: GiWeightLiftingUp,
    component: NutritionTracker,
  },
  {
    id: 'world-clock',
    name: 'World Clock',
    description: 'Track time across multiple time zones and find the best meeting times.',
    icon: FiGlobe,
    component: WorldClock,
  },
  {
    id: 'password-entropy',
    name: 'Password Entropy Calculator',
    description: 'Measure your password strength and security.',
    icon: FaKey,
    component: PasswordEntropyCalculator,
  },
  {
    id: 'eisenhower-matrix',
    name: 'Eisenhower Matrix',
    description: 'Prioritize your tasks based on urgency and importance.',
    icon: FaTasks,
    component: EisenhowerMatrix,
  },
  {
    id: 'investment-return-calculator',
    name: 'Investment Return Calculator',
    description: 'Project the future value of your investments.',
    icon: FaChartLine,
    component: InvestmentReturnCalculator,
  },
  {
    id: 'depreciation-calculator',
    name: 'Depreciation Calculator',
    description: 'Calculate asset depreciation using various methods.',
    icon: FaChartLine,
    component: DepreciationCalculator,
  },
  {
    id: 'combination-calculator',
    name: 'Combinations & Permutations',
    description: 'Calculate combinations and permutations with options for order and repetition.',
    icon: FaCalculator,
    component: CombinationCalculator,
  },
  {
    id: 'numerology-calculator',
    name: 'Numerology Calculator',
    description: 'Calculate your destiny, soul urge, and personality numbers.',
    icon: FaCalculator,
    component: NumerologyCalculator,
  },
  {
    id: 'credit-card-validator',
    name: 'Credit Card Validator',
    description: 'Validate credit card numbers and identify card types.',
    icon: FiCreditCard,
    component: CreditCardValidator,
  },
  {
    id: 'network-calculator',
    name: 'Network Calculator',
    description: 'Calculate network details from IP address and subnet mask/CIDR.',
    icon: FaGlobe,
    component: NetworkCalculator,
  },
  {
    id: 'hash-calculator',
    name: 'Hash Calculator',
    description: 'Calculate MD5, SHA-1, SHA-256, SHA-512, and RIPEMD-160 hashes.',
    icon: FaCalculator,
    component: HashCalculator,
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder/Decoder',
    description: 'Encode and decode text using Base64.',
    icon: FaCode,
    component: Base64Converter,
  },
  {
    id: 'url-anatomy-tool',
    name: 'URL Anatomy Tool',
    description: 'Break down a URL into its constituent parts.',
    icon: FaGlobe,
    component: UrlAnatomyTool,
  },
  {
    id: 'data-sorter',
    name: 'Data Sorter',
    description: 'Sort a list of numbers or alphanumeric data in ascending or descending order.',
    icon: FaSortNumericUp,
    component: NumberSorter,
  },
  {
    id: 'text-extractor',
    name: 'Text Extractor',
    description:
      'Extract IP addresses, hashtags, URLs, emails, phone numbers, numbers, and names from text.',
    icon: FaFileAlt,
    component: TextExtractor,
  },

  {
    id: 'area-converter',
    name: 'Area Converter',
    description:
      'Convert between various area units like square meters, acres, and traditional Indian units.',
    icon: FaRulerCombined,
    component: AreaConverter,
  },
  {
    id: 'length-converter',
    name: 'Length Converter',
    description: 'Convert between various length units like meters, feet, and astronomical units.',
    icon: FaRulerHorizontal,
    component: LengthConverter,
  },
  {
    id: 'cagr-calculator',
    name: 'CAGR Calculator',
    description: 'Calculate the Compound Annual Growth Rate of an investment.',
    icon: FaChartLine,
    component: CAGRCalculator,
  },
  {
    id: 'ebitda-calculator',
    name: 'EBITDA Calculator',
    description: 'Calculate Earnings Before Interest, Taxes, Depreciation, and Amortization.',
    icon: FaCalculator,
    component: EBITDACalculator,
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    description: 'Calculate the Return on Investment for a given profit and cost.',
    icon: FaPercent,
    component: ROICalculator,
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode JWT tokens to inspect header and payload.',
    icon: FaCode,
    component: JWTDecoder,
  },
  {
    id: 'saving-minutes-calculator',
    name: 'Saving Minutes Calculator',
    description: 'Calculate potential savings by saving minutes per day.',
    icon: FaClock,
    component: SavingMinutesCalculator,
  },
  {
    id: 'guid-generator',
    name: 'GUID Generator',
    description: 'Generate a new Globally Unique Identifier (GUID).',
    icon: FaKey,
    component: GUIDGenerator,
  },
  {
    id: 'house-build-cost-calculator',
    name: 'House Build Cost Calculator',
    description: 'Estimate your home construction costs with detailed breakdowns.',
    icon: FaHome,
    component: HouseBuildCostCalculator,
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
