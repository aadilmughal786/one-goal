// app/components/tools/ChatCalculator.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { all, create } from 'mathjs';
import Image from 'next/image'; // Import the Next.js Image component
import React, { useEffect, useRef, useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import { FiSend, FiTrash2, FiUser } from 'react-icons/fi';

// Configure mathjs
const math = create(all);

interface Message {
  text: string;
  type: 'user' | 'bot';
}

const LOCAL_STORAGE_KEY = 'one-goal-chat-calculator-messages';

const ChatCalculator: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const currentUser = useGoalStore(state => state.currentUser);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMessages && JSON.parse(storedMessages).length > 0) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([
          {
            text: "Hello! I'm a scientific calculator. You can ask me things like `(2+3)*4` or `sin(45 deg)`.",
            type: 'bot',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage', error);
      setMessages([
        {
          text: "Hello! I'm a scientific calculator. You can ask me things like `(2+3)*4` or `sin(45 deg)`.",
          type: 'bot',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    try {
      // Only save if there's more than the initial bot message
      if (messages.length > 1 || (messages.length === 1 && !messages[0].text.startsWith('Hello'))) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Failed to save messages to localStorage', error);
    }
  }, [messages]);

  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Updated function with better error handling
  const calculateExpression = (expression: string): string => {
    try {
      const result = math.evaluate(expression);
      if (typeof result === 'function') {
        return "I can't display a function, but I can calculate expressions for you!";
      }
      return `The result is: ${math.format(result, { precision: 14 })}`;
    } catch {
      // Return a more user-friendly error message
      return "Sorry, I couldn't understand that calculation. Please check the syntax (e.g., 'sqrt(16)' or '5 * (2+3)').";
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { text: input, type: 'user' };
    const botResponseText = calculateExpression(input);
    const botMessage: Message = { text: botResponseText, type: 'bot' };
    setMessages([...messages, userMessage, botMessage]);
    setInput('');
  };

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setMessages([{ text: 'History cleared. Ask me a new problem!', type: 'bot' }]);
  };

  const handleClearHistoryWithConfirmation = () => {
    showConfirmation({
      title: 'Clear Chat History?',
      message:
        'Are you sure you want to delete this entire conversation? This action cannot be undone.',
      action: handleClearHistory,
    });
  };

  return (
    <div ref={chatContainerRef} className="mx-auto w-full max-w-4xl">
      <div className="pb-40 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'bot' && (
              <FaRobot className="w-8 h-8 p-1.5 rounded-full bg-blue-500 text-white flex-shrink-0 mt-1" />
            )}
            <div
              className={`max-w-lg p-4 rounded-2xl shadow-md ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white/10 text-white/90 rounded-bl-none'
              }`}
            >
              <p className="text-white whitespace-pre-wrap">{msg.text}</p>
            </div>
            {/* Conditional rendering for user avatar */}
            {msg.type === 'user' &&
              (currentUser?.photoURL ? (
                <Image
                  src={currentUser.photoURL}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="flex-shrink-0 mt-1 w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 p-1.5 rounded-full bg-white/10 text-white flex-shrink-0 mt-1 flex items-center justify-center">
                  <FiUser />
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="fixed right-0 bottom-0 left-16 z-20 p-4 border-t backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex gap-2 items-center mx-auto max-w-3xl">
          <button
            onClick={handleClearHistoryWithConfirmation}
            className="p-3 text-red-400 rounded-full transition-colors bg-white/5 hover:bg-red-500/20"
            aria-label="Clear chat history"
          >
            <FiTrash2 size={20} />
          </button>
          <div className="relative flex-grow">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="e.g., (2 + 1) * 3 or sin(45 deg)"
              className="p-4 pr-14 w-full text-base text-white rounded-xl border border-white/20 bg-black/20 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="absolute right-3 top-1/2 p-2 text-white bg-blue-500 rounded-lg transition-colors -translate-y-1/2 hover:bg-blue-600 disabled:opacity-50"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCalculator;
