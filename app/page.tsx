// app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaCode, FaGithub, FaLinkedin, FaPencil, FaUserGraduate } from 'react-icons/fa6';
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiGlobe,
  FiGrid,
  FiInfo,
  FiMail,
  FiMinus,
  FiPlus,
  FiShare2,
  FiTarget,
} from 'react-icons/fi';
import { MdRocketLaunch } from 'react-icons/md';
// REMOVED: import { firebaseService } from '@/services/firebaseService'; // No longer using this
import { User } from 'firebase/auth';

// NEW: Import the specific auth service function
import { onAuthChange } from '@/services/authService';

// --- Data for Features Section ---
const featuresData = [
  {
    icon: <FiTarget className="w-6 h-6 text-white" />,
    title: 'Single Goal Clarity',
    description:
      'Cut through the clutter. Define your one overarching goal and keep it front and center.',
  },
  {
    icon: <FiCheckCircle className="w-6 h-6 text-white" />,
    title: 'Distraction Control',
    description: "Identify and track 'What Not To Do' items. Actively avoid time-wasting habits.",
  },
  {
    icon: <FiClock className="w-6 h-6 text-white" />,
    title: 'Progress Feedback',
    description: 'Integrated stopwatch for focused work sprints and live countdown to deadlines.',
  },
  {
    icon: <FiShare2 className="w-6 h-6 text-white" />,
    title: 'Secure & Flexible',
    description: 'Save progress securely with Google Sign-in. Export/import data easily.',
  },
  {
    icon: <FiInfo className="w-6 h-6 text-white" />,
    title: 'Clean Design',
    description:
      'Minimalist, distraction-free interface that works beautifully across all devices.',
  },
  {
    icon: <FiCheckCircle className="w-6 h-6 text-white" />,
    title: 'Contextual Insights',
    description: 'Record past successes, key learnings, and relevant notes to inform your journey.',
  },
];

// --- Data for How It Works Section ---
const howItWorksData = [
  {
    icon: <FiTarget className="w-8 h-8 text-blue-400" />,
    title: 'Define Your Mission',
    description: 'Set one clear, ambitious goal. This is your north star.',
  },
  {
    icon: <FiEye className="w-8 h-8 text-green-400" />,
    title: 'Track Your Journey',
    description: 'Log daily satisfaction and effort in seconds to stay mindful of your progress.',
  },
  {
    icon: <FiBarChart2 className="w-8 h-8 text-red-400" />,
    title: 'Visualize & Adapt',
    description: 'Use insightful graphs to stay motivated and adapt your strategy as you go.',
  },
];

// --- Data for Use Cases Section ---
const useCasesData = [
  {
    icon: <FaUserGraduate className="w-10 h-10 text-white" />,
    persona: 'The Student',
    goal: 'Ace the final exams.',
    description:
      'Breaks down study sessions, tracks challenging subjects, and visualizes progress to stay motivated and avoid cramming.',
  },
  {
    icon: <FaCode className="w-10 h-10 text-white" />,
    persona: 'The Developer',
    goal: 'Ship the new feature.',
    description:
      'Manages a high-stakes project by setting a clear deadline and tracking daily effort to ensure timely delivery and client satisfaction.',
  },
  {
    icon: <FaPencil className="w-10 h-10 text-white" />,
    persona: 'The Freelancer',
    goal: 'Launch a new client project.',
    description:
      'Manages a high-stakes project by setting a clear deadline and tracking daily effort to ensure timely delivery and client satisfaction.',
  },
];

// --- Data for FAQ Section ---
const faqData = [
  {
    question: 'Is my data private and secure?',
    answer:
      'Yes. Your data is your own. We use secure Google Firebase authentication, and your data is stored in your own private Firestore database instance. You can also export your data at any time.',
  },
  {
    question: 'Why can I only have one goal at a time?',
    answer:
      "This is the core philosophy of the app. By focusing on a single objective, you eliminate context-switching and channel all your energy into what's most important, leading to better and faster results.",
  },
  {
    question: 'Is the app free to use?',
    answer:
      'Yes, One Goal is completely free to use. It was created as a tool to help people focus and achieve their most important objectives without a paywall.',
  },
  {
    question: 'Can I use this app on my phone?',
    answer:
      "Absolutely. One Goal is designed to be fully responsive and works beautifully on any device, whether it's your desktop, tablet, or smartphone.",
  },
  {
    question: "What happens when my goal's deadline passes?",
    answer:
      'The countdown will stop, but all your data, including daily progress and lists, will remain exactly as it was. You can then review your journey and decide whether to set a new goal, which will reset the application.',
  },
  {
    question: "Can I edit my goal after I've set it?",
    answer:
      "Yes! You can edit your goal's name, description, and even extend the deadline at any time from the dashboard. This allows you to adapt as your priorities or timelines change.",
  },
  {
    question: 'What kind of insights can I get from the graphs?',
    answer:
      'The graphs help you visualize your journey. You can see how your satisfaction trends over time, identify which days of the week are most productive, and understand the relationship between the time you invest and how you feel about your progress.',
  },
];

// --- Data for Developer Social Links ---
const socialLinksData = [
  {
    href: 'mailto:aadil.mugal.dev@gmail.com',
    label: 'Email',
    icon: <FiMail size={18} />,
    isExternal: false,
  },
  {
    href: 'https://www.linkedin.com/in/dev-aadil',
    label: 'LinkedIn',
    icon: <FaLinkedin size={18} />,
    isExternal: true,
  },
  {
    href: 'https://github.com/aadilmughal786',
    label: 'GitHub',
    icon: <FaGithub size={18} />,
    isExternal: true,
  },
  {
    href: 'https://aadilmughal786.github.io/portfolio-new/',
    label: 'Portfolio',
    icon: <FiGlobe size={18} />,
    isExternal: true,
  },
];

// --- Reusable Components ---

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
    <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
    <p className="leading-relaxed text-white/60">{description}</p>
  </div>
);

const SocialLink = ({
  href,
  label,
  icon,
  isExternal,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isExternal: boolean;
}) => (
  <a
    href={href}
    target={isExternal ? '_blank' : '_self'}
    rel={isExternal ? 'noopener noreferrer' : ''}
    className="p-2 rounded-lg transition-colors cursor-pointer bg-white/5 hover:bg-white/10 hover:scale-110"
    aria-label={label}
  >
    {icon}
  </a>
);

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-2">
      <button
        className="flex justify-between items-center px-4 py-4 w-full text-lg font-semibold text-left text-white rounded-lg transition-colors duration-300 cursor-pointer group hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="transition-colors duration-300 group-hover:text-blue-400">{question}</span>
        {isOpen ? <FiMinus className="text-white/70" /> : <FiPlus className="text-white/70" />}
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100 grid-rows-[1fr]' : 'opacity-0 grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-2 pr-10 pb-4 leading-relaxed text-white/80">{answer}</div>
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // NEW: Use onAuthChange from authService
    const unsubscribe = onAuthChange(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  const renderCtaButton = () => {
    if (authLoading) {
      return (
        <button
          disabled
          className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full opacity-60 cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 text-black animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </button>
      );
    }

    if (currentUser) {
      return (
        <Link
          href="/dashboard"
          className="inline-flex gap-3 items-center py-2 pr-6 pl-2 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
        >
          {currentUser.photoURL ? (
            <Image
              src={currentUser.photoURL}
              alt="Your profile picture"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <span className="flex justify-center items-center w-8 h-8 bg-gray-200 rounded-full">
              <FiGrid size={20} />
            </span>
          )}
          <span className="mx-2">Go to Dashboard</span>
          <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      );
    }

    return (
      <Link
        href="/login"
        className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
      >
        <FiTarget size={20} />
        Get Started
        <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    );
  };

  return (
    <div className="relative z-10 px-6 mx-auto max-w-6xl sm:px-8 lg:px-12">
      {/* Hero Section */}
      <section className="pt-20 pb-32 text-center fade-in">
        <div className="mb-8">
          <div className="inline-flex justify-center items-center mb-8 w-20 h-20 rounded-full border backdrop-blur-sm bg-white/5 border-white/10">
            <MdRocketLaunch className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          One Goal
        </h1>
        <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed sm:text-xl lg:text-2xl text-white/70">
          Your singular focus in a world of distractions. Achieve clarity, drive action, and conquer
          your most important objectives.
        </p>
        <div className="flex flex-col gap-4 justify-center items-center h-16 sm:flex-row">
          {renderCtaButton()}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/60">
            Achieve your goals in three simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {howItWorksData.map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex justify-center items-center mb-6 w-16 h-16 rounded-full border backdrop-blur-sm bg-white/5 border-white/10">
                {step.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{step.title}</h3>
              <p className="leading-relaxed text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-3xl font-bold text-center sm:text-4xl">
            Why Focus? Why One Goal?
          </h2>
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <div className="space-y-6 text-lg leading-relaxed text-white/80">
              <p>
                In today&apos;s fast-paced world, constant demands pull us in countless directions.
                We often fall into the trap of multitasking, believing it makes us more productive.
                However, true impact and innovation rarely come from juggling many tasks at once.
              </p>
              <p>
                <strong className="text-white">One Goal</strong> is built on the principle of deep,
                sustained focus. It&apos;s your antidote to digital noise, providing a crystal-clear
                space to define, track, and conquer your most significant aspirations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Features Designed for Your Success
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/60">
            Everything you need to maintain laser focus and achieve your goals
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Who Is This For?</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/60">
            Anyone with a goal that demands focus.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {useCasesData.map((useCase, index) => (
            <div
              key={index}
              className="p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              <div className="inline-flex justify-center items-center mb-6 w-16 h-16 rounded-full bg-white/5">
                {useCase.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{useCase.persona}</h3>
              <p className="mb-4 font-medium text-blue-400">&quot;{useCase.goal}&quot;</p>
              <p className="leading-relaxed text-white/70">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-8">
            {faqData.map((item, index) => (
              <AccordionItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20" id="about-developer">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-3xl font-bold text-center sm:text-4xl">Meet the Creator</h2>
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col gap-8 justify-center items-center md:flex-row">
              <div className="flex-shrink-0 text-center md:text-left">
                <Image
                  src="https://aadilmughal786.github.io/portfolio-new/images/aadil.png"
                  alt="Developer Pic"
                  width={144}
                  height={144}
                  className="mx-auto mb-4 w-32 h-32 rounded-full border-2 border-cyan-100"
                />
                <h3 className="mb-1 text-2xl font-bold">Aadil Mughal</h3>
                <p className="mb-4 text-white/60">Full Stack Developer</p>
                <div className="flex gap-4 justify-center md:justify-start">
                  {socialLinksData.map((link, index) => (
                    <SocialLink
                      key={index}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      isExternal={link.isExternal}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-grow space-y-4 leading-relaxed text-white/80">
                <p>
                  As a developer, I&apos;ve always been drawn to creating tools that simplify
                  complexity. The idea for <span className="font-medium text-white">One Goal</span>{' '}
                  emerged from a personal struggle with information overload and the constant push
                  to do more, faster.
                </p>
                <p>
                  I realized that true productivity isn&apos;t about juggling tasks; it&apos;s about
                  the profound impact of singular, unwavering focus. This app is a testament to the
                  belief that focused effort yields extraordinary outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 text-center">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Ready to Focus?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
            Stop juggling priorities and start achieving them. Your most important goal is waiting.
          </p>
          <div className="flex flex-col gap-4 justify-center items-center h-16 sm:flex-row">
            {renderCtaButton()}
          </div>
        </div>
      </section>
    </div>
  );
}
