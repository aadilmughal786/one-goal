// app/login/page.tsx
'use client';

import FloatingThemeToggle from '@/components/common/FloatingThemeToggle'; // Import the new component
import { onAuthChange, signInWithGoogle } from '@/services/authService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const showToast = useNotificationStore(state => state.showToast);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (signInError: unknown) {
      let errorMessage = 'Sign-in failed. Please try again.';
      if (signInError instanceof ServiceError) {
        if (
          signInError.code === ServiceErrorCode.AUTH_SIGN_IN_FAILED &&
          (signInError.originalError as { code?: string })?.code === 'auth/popup-closed-by-user'
        ) {
          errorMessage = 'Sign-in cancelled.';
        } else {
          errorMessage = signInError.message;
        }
      } else if (signInError instanceof Error) {
        errorMessage = signInError.message;
      }
      showToast(errorMessage, 'error');
      setIsSigningIn(false);
    }
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="flex overflow-hidden relative flex-col justify-center items-center p-6 min-h-screen text-text-primary bg-bg-primary font-poppins">
        <div className="relative z-10 p-8 w-full max-w-md text-center rounded-2xl border backdrop-blur-sm sm:p-10 bg-bg-secondary border-border-primary">
          <div className="animate-pulse">
            <div className="mx-auto mb-6 w-3/4 h-8 rounded-md bg-bg-tertiary"></div>
            <div className="mx-auto mb-2 w-full h-4 rounded-md bg-bg-tertiary"></div>
            <div className="mx-auto mb-8 w-5/6 h-4 rounded-md bg-bg-tertiary"></div>
            <div className="mx-auto mb-8 w-full h-16 rounded-full bg-bg-tertiary"></div>
            <div className="mx-auto w-1/2 h-4 rounded-md bg-bg-tertiary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingThemeToggle />
      <div className="flex overflow-hidden relative flex-col justify-center items-center p-6 min-h-screen text-text-primary bg-bg-primary font-poppins">
        <div className="relative z-10 p-8 w-full max-w-md text-center rounded-2xl border backdrop-blur-sm transition-all duration-300 sm:p-10 bg-bg-secondary border-border-primary hover:bg-bg-tertiary hover:border-border-secondary">
          <h2 className="mb-6 text-3xl font-bold text-text-primary">Join Your Journey</h2>
          <p className="mb-8 leading-relaxed text-text-secondary">
            Sign in to save your goals across devices.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleSignInWithGoogle}
              disabled={isSigningIn}
              className="inline-flex gap-3 justify-center items-center px-6 py-4 w-full text-lg font-semibold rounded-full transition-all duration-200 cursor-pointer text-bg-primary bg-text-primary group hover:opacity-90 hover:shadow-xl disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
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
          <p className="mt-8 text-sm text-text-tertiary">
            Your journey to focused productivity starts here.
          </p>
        </div>
      </div>
    </>
  );
}
