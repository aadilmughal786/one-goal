// app/login/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { firebaseService } from '@/services/firebaseService';
import ToastMessage from '@/components/ToastMessage';
import { FirebaseServiceError } from '@/utils/errors';

export default function LoginPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      await firebaseService.signInWithGoogle();
      router.push('/dashboard');
    } catch (signInError: unknown) {
      let errorMessage = 'Sign-in failed. Please try again.';
      if (signInError instanceof FirebaseServiceError) {
        const originalFirebaseError = (signInError.originalError as any)?.code;
        if (originalFirebaseError === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled. Please try again.';
        } else {
          errorMessage = signInError.message;
        }
      } else if (signInError instanceof Error) {
        errorMessage = signInError.message;
      }
      showMessage(errorMessage, 'error');
    }
  }, [showMessage, router]);

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center p-6 min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      <div className="relative z-10 p-8 sm:p-10 w-full max-w-md text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
        <h2 className="mb-6 text-3xl font-bold text-white">Join Your Journey</h2>
        <p className="mb-8 leading-relaxed text-white/70">
          Sign in to save your goals across devices.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleSignInWithGoogle}
            className="inline-flex gap-3 justify-center items-center px-6 py-4 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
          >
            <FcGoogle size={24} />
            Sign In with Google
          </button>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Your journey to focused productivity starts here.
        </p>
      </div>
    </div>
  );
}
