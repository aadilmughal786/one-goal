'use client';

import React from 'react';
import Link from 'next/link';
import { MdRocketLaunch } from 'react-icons/md';
import {
  FiTarget,
  FiCheckCircle,
  FiShare2,
  FiInfo,
  FiMail,
  FiClock,
  FiArrowRight,
} from 'react-icons/fi';
import Image from 'next/image';
import { FaGithub, FaLinkedin } from 'react-icons/fa6';

export default function LandingPage() {
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

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center sm:flex-row">
          <Link
            href="/login"
            className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
          >
            <FiTarget size={20} />
            Get Started
            <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
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
          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiTarget className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Single Goal Clarity</h3>
            <p className="leading-relaxed text-white/60">
              Cut through the clutter. Define your one overarching goal and keep it front and
              center.
            </p>
          </div>

          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Distraction Control</h3>
            <p className="leading-relaxed text-white/60">
              Identify and track &apos;What Not To Do&apos; items. Actively avoid time-wasting
              habits.
            </p>
          </div>

          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiClock className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Progress Feedback</h3>
            <p className="leading-relaxed text-white/60">
              Integrated stopwatch for focused work sprints and live countdown to deadlines.
            </p>
          </div>

          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiShare2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Secure & Flexible</h3>
            <p className="leading-relaxed text-white/60">
              Save progress securely with Google Sign-in or explore as guest. Export/import data
              easily.
            </p>
          </div>

          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiInfo className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Clean Design</h3>
            <p className="leading-relaxed text-white/60">
              Minimalist, distraction-free interface that works beautifully across all devices.
            </p>
          </div>

          <div className="group p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:scale-105">
            <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-lg bg-white/5">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Contextual Insights</h3>
            <p className="leading-relaxed text-white/60">
              Record past successes, key learnings, and relevant notes to inform your journey.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-3xl font-bold text-center sm:text-4xl">Meet the Creator</h2>

          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
            <div className="flex flex-col gap-8 justify-center items-center md:flex-row">
              <div className="flex-shrink-0 text-center md:text-left">
                <Image
                  src="https://aadilmughal786.github.io/portfolio-new/images/aadil.png" // Grayscale placeholder, larger
                  alt="Developer Pic"
                  width={144}
                  height={144}
                  className="mx-auto mb-4 w-32 h-32 rounded-full border-2 border-cyan-100"
                />
                <h3 className="mb-1 text-2xl font-bold">Aadil Mughal</h3>
                <p className="mb-4 text-white/60">Full Stack Developer</p>

                <div className="flex gap-4 justify-center md:justify-start">
                  <a
                    href="mailto:aadil.mugal.dev@gmail.com"
                    className="p-2 rounded-lg transition-colors bg-white/5 hover:bg-white/10 hover:scale-110"
                  >
                    <FiMail size={18} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/dev-aadil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors bg-white/5 hover:bg-white/10 hover:scale-110"
                  >
                    <FaLinkedin size={18} />
                  </a>
                  <a
                    href="https://github.com/aadilmughal786"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors bg-white/5 hover:bg-white/10 hover:scale-110"
                  >
                    <FaGithub size={18} />
                  </a>
                </div>
              </div>

              <div className="flex-grow space-y-4 leading-relaxed text-white/80">
                <p>
                  As a developer, I&apos;ve always been drawn to creating tools that simplify
                  complexity. The idea for &quot;One Goal&quot; emerged from a personal struggle
                  with information overload and the constant push to do more, faster.
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
    </div>
  );
}
