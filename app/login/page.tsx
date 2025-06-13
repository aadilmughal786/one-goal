// app/login/page.tsx
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { firebaseService } from '@/services/firebaseService';
import ToastMessage from '@/components/ToastMessage';
import { FirebaseServiceError } from '@/utils/errors';
import { User } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // On component mount, check the user's authentication state.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange((user: User | null) => {
      if (user) {
        // If the user is already logged in, redirect them to the dashboard.
        router.replace('/dashboard');
      } else {
        // If there's no user, stop the loading state and show the login page.
        setIsLoading(false);
      }
    });

    // Clean up the subscription when the component unmounts.
    return () => unsubscribe();
  }, [router]);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await firebaseService.signInWithGoogle();
      // The `onAuthChange` listener will automatically handle the redirect upon successful sign-in.
    } catch (signInError: unknown) {
      let errorMessage = 'Sign-in failed. Please try again.';
      if (signInError instanceof FirebaseServiceError) {
        const originalFirebaseError = (signInError.originalError as { code?: string })?.code;
        if (originalFirebaseError === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled.';
        } else {
          errorMessage = signInError.message;
        }
      } else if (signInError instanceof Error) {
        errorMessage = signInError.message;
      }
      showMessage(errorMessage, 'error');
      setIsSigningIn(false);
    }
  }, [showMessage]);

  // While checking the authentication state, display a loading indicator.
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center p-6 min-h-screen text-white bg-black font-poppins">
        <div className="relative z-10 p-8 w-full max-w-md text-center sm:p-10">
          <svg
            className="mx-auto w-10 h-10 text-white animate-spin"
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
          <p className="mt-4 text-white/70">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Once the auth check is complete and there's no user, show the login form.
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
            disabled={isSigningIn}
            className="inline-flex gap-3 justify-center items-center px-6 py-4 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <>
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
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <FcGoogle size={24} />
                <span>Sign In with Google</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Your journey to focused productivity starts here.
        </p>
      </div>
    </div>
  );
}
