// app/(root)/list/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { firebaseService } from '@/services/firebaseService';
import { ListItem } from '@/types';
import ListComponent from '@/components/List'; // Corrected import path
import ToastMessage from '@/components/ToastMessage';
import { RiAlarmWarningLine } from 'react-icons/ri';
import { FiBookOpen } from 'react-icons/fi';

const ListsPageSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
        <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
        <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
        <div className="mb-6 w-3/4 h-4 rounded-lg bg-white/10"></div>
        <div className="space-y-3">
          <div className="w-full h-12 rounded-lg bg-white/5"></div>
          <div className="w-full h-12 rounded-lg bg-white/5"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function ListsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [notToDoList, setNotToDoList] = useState<ListItem[]>([]);
  const [contextList, setContextList] = useState<ListItem[]>([]);

  // State for editing
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService.getUserData(user.uid).then(data => {
          setNotToDoList(data.notToDoList || []);
          setContextList(data.contextList || []);
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const addToList = useCallback(
    async (listType: 'notToDoList' | 'contextList', text: string) => {
      if (!text.trim()) {
        showMessage('Item cannot be empty.', 'error');
        return;
      }
      if (!currentUser) return;
      const newItem: ListItem = { text: text.trim(), id: Date.now() + Math.random() };

      if (listType === 'notToDoList') {
        setNotToDoList(prev => [...prev, newItem]);
      } else {
        setContextList(prev => [...prev, newItem]);
      }
      await firebaseService.addItemToList(currentUser.uid, listType, newItem);
    },
    [currentUser, showMessage]
  );

  const removeFromList = useCallback(
    async (listType: 'notToDoList' | 'contextList', id: number) => {
      if (!currentUser) return;
      if (listType === 'notToDoList') {
        setNotToDoList(prev => prev.filter(item => item.id !== id));
      } else {
        setContextList(prev => prev.filter(item => item.id !== id));
      }
      await firebaseService.removeItemFromList(currentUser.uid, listType, id);
    },
    [currentUser]
  );

  const updateItem = useCallback(
    async (listType: 'notToDoList' | 'contextList', id: number, text: string) => {
      if (!text.trim()) {
        showMessage('Item cannot be empty.', 'error');
        return;
      }
      if (!currentUser) return;

      if (listType === 'notToDoList') {
        setNotToDoList(prev =>
          prev.map(item => (item.id === id ? { ...item, text: text.trim() } : item))
        );
      } else {
        setContextList(prev =>
          prev.map(item => (item.id === id ? { ...item, text: text.trim() } : item))
        );
      }

      await firebaseService.updateItemInList(currentUser.uid, listType, id, { text: text.trim() });
      setEditingItemId(null);
      setEditText('');
    },
    [currentUser, showMessage]
  );

  if (isLoading) {
    return (
      <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
        <ToastMessage message={toastMessage} type={toastType} />
        <div className="container flex-grow p-4 mx-auto max-w-4xl">
          <section className="py-8">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Supporting Lists</h2>
            </div>
            <ListsPageSkeletonLoader />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Your Supporting Lists
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Your main goal is the target, but these lists provide the crucial guardrails and
              knowledge to keep you on track.
            </p>
          </div>

          <div className="space-y-12">
            <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <div className="flex gap-3 items-center mb-2">
                <RiAlarmWarningLine size={24} className="text-red-400" />
                <h3 className="text-2xl font-bold text-white">What Not To Do</h3>
              </div>
              <p className="mb-6 text-white/60">
                Success is defined as much by what you don&apos;t do as by what you do. Use this
                list to identify and consciously avoid distractions and time-wasting habits.
              </p>
              <ListComponent
                list={notToDoList}
                addToList={text => addToList('notToDoList', text)}
                removeFromList={id => removeFromList('notToDoList', id)}
                updateItem={(id, text) => updateItem('notToDoList', id, text)}
                placeholder="Add a distraction to avoid..."
                themeColor="red"
                editingItemId={editingItemId}
                setEditingItemId={setEditingItemId}
                editText={editText}
                setEditText={setEditText}
              />
            </div>

            <div className="p-8 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <div className="flex gap-3 items-center mb-2">
                <FiBookOpen size={22} className="text-blue-400" />
                <h3 className="text-2xl font-bold text-white">Contextual Notes & Learnings</h3>
              </div>
              <p className="mb-6 text-white/60">
                This is your knowledge base. Jot down important insights, key learnings, useful
                links, or past successes to build momentum and inform your journey.
              </p>
              <ListComponent
                list={contextList}
                addToList={text => addToList('contextList', text)}
                removeFromList={id => removeFromList('contextList', id)}
                updateItem={(id, text) => updateItem('contextList', id, text)}
                placeholder="Add a note or learning..."
                themeColor="blue"
                editingItemId={editingItemId}
                setEditingItemId={setEditingItemId}
                editText={editText}
                setEditText={setEditText}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
