// app/login/page.tsx
'use client';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FiUser, FiDownload } from 'react-icons/fi';
import { firebaseService } from '@/services/firebaseService'; // Import the firebaseService instance
import { localStorageService } from '@/services/localStorageService'; // Import the localStorageService instance
import ToastMessage from '@/components/ToastMessage';
// Import ConfirmationModalProps from its own file, as it's no longer in '@/types'
import ConfirmationModal from '@/components/ConfirmationModal';
import { FirebaseServiceError, LocalStorageError } from '@/utils/errors'; // Import custom error classes

// Since ConfirmationModalProps is now defined within ConfirmationModal.tsx,
// we need to infer its type directly from the component's props if we want to use it here.
// For simplicity, we can define a local interface that matches what ConfirmationModal expects,
// or just pass the objects directly if we don't need a specific type for the state.
// For now, I'll use a local type definition that aligns with the ConfirmationModal's props,
// to maintain type safety when setting confirmation modal state.
interface LoginPageConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title: string;
  confirmButton: { text: string; onClick: () => void; className?: string; icon?: React.ReactNode };
  cancelButton: { text: string; onClick: () => void; className?: string; icon?: React.ReactNode };
  actionDelayMs?: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationModalProps, setConfirmationModalProps] = useState<
    Omit<LoginPageConfirmationModalProps, 'isOpen' | 'onClose'>
  >({
    title: '',
    message: '',
    confirmButton: { text: '', onClick: () => {} },
    cancelButton: { text: '', onClick: () => {} },
    actionDelayMs: 0,
  });

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    // Auto-clear message after toast duration (5 seconds + buffer)
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  }, []);

  // Confirmation Modal handlers
  const openConfirmationModal = useCallback(
    (props: Omit<LoginPageConfirmationModalProps, 'isOpen' | 'onClose'>) => {
      setConfirmationModalProps(props);
      setIsConfirmationModalOpen(true);
    },
    []
  );

  const closeConfirmationModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setConfirmationModalProps({
      title: '',
      message: '',
      confirmButton: { text: '', onClick: () => {} },
      cancelButton: { text: '', onClick: () => {} },
      actionDelayMs: 0,
    });
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      const guestData = localStorageService.loadLocalState();
      if (guestData) {
        const dataStr = JSON.stringify(guestData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `one-goal-guest-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showMessage('Guest data exported successfully!', 'success');
      } else {
        showMessage('No guest data to export.', 'info');
      }
    } catch (exportError: unknown) {
      const message =
        exportError instanceof LocalStorageError
          ? exportError.message
          : `Failed to export guest data: ${(exportError as Error).message || 'Unknown error'}`;
      showMessage(message, 'error');
    }
    // Do NOT close modal here. User still needs to choose next action (guest or google)
  }, [showMessage]);

  const handleSignInWithGoogleAndClearGuestData = useCallback(async () => {
    try {
      localStorageService.clearLocalState(); // Clear guest data
      localStorageService.clearAppModeFromLocalStorage(); // Clear guest mode flag from local storage
    } catch (error: unknown) {
      const message =
        error instanceof LocalStorageError
          ? error.message
          : `Error clearing guest data: ${(error as Error).message || 'Unknown error'}. Proceeding with sign-in.`;
      showMessage(message, 'error');
    }

    try {
      await firebaseService.signInWithGoogle(); // Use the class instance
      localStorageService.setAppModeInLocalStorage('google'); // Set mode to google in local storage
      router.push('/dashboard'); // Redirect on successful Firebase sign-in
    } catch (signInError: unknown) {
      let errorMessage = 'Sign-in failed. Please try again.';
      if (signInError instanceof FirebaseServiceError) {
        // Check for specific Firebase error code if wrapped by our custom error
        const originalFirebaseError = (signInError.originalError as any)?.code;
        if (originalFirebaseError === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled. Please try again.';
        } else {
          errorMessage = signInError.message; // Use the message from our custom error
        }
      } else if (signInError instanceof Error) {
        errorMessage = signInError.message;
      }
      showMessage(errorMessage, 'error');
    } finally {
      closeConfirmationModal(); // Ensure modal closes regardless of sign-in success/failure
    }
  }, [showMessage, router, closeConfirmationModal]);

  const handleContinueAsGuestFromModal = useCallback(() => {
    localStorageService.setAppModeInLocalStorage('guest'); // Set mode to guest in local storage
    closeConfirmationModal(); // Close modal
    router.push('/dashboard'); // Redirect to dashboard, which will load local data
  }, [router, closeConfirmationModal]);

  const handleGoogleSignInAttempt = useCallback(async () => {
    try {
      // Check if current app mode is 'guest' to determine if guest data might be active
      if (localStorageService.getAppModeFromLocalStorage() === 'guest') {
        openConfirmationModal({
          title: 'Guest Data Detected',
          message:
            'You have unsaved data from a previous guest session. If you sign in with Google, this data will be overwritten by your cloud data. Please choose an option:',
          cancelButton: {
            text: 'Continue as Guest', // This will be the "Cancel" button
            onClick: handleContinueAsGuestFromModal,
            className:
              'bg-white/[0.02] backdrop-blur-sm border border-white/10 text-white hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300',
            icon: <FiUser className="w-5 h-5" />,
          },
          confirmButton: {
            // This will be the timed action button
            text: 'Continue with Google',
            onClick: handleSignInWithGoogleAndClearGuestData,
            className:
              'bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-200',
            icon: <FcGoogle size={20} />,
          },
          actionDelayMs: 3000, // 3-second delay for the confirm button
        });
      } else {
        // No guest data detected based on app mode, proceed directly with Google Sign-in
        await firebaseService.signInWithGoogle(); // Use the class instance
        localStorageService.setAppModeInLocalStorage('google'); // Set mode to google in local storage
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      // Differentiate between Firebase and LocalStorage errors for more precise messaging
      let errorMessage = 'An unexpected error occurred during sign-in process.';
      if (error instanceof FirebaseServiceError) {
        const originalFirebaseError = (error.originalError as any)?.code;
        if (originalFirebaseError === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in cancelled. Please try again.';
        } else {
          errorMessage = error.message; // Use the message from our custom FirebaseServiceError
        }
      } else if (error instanceof LocalStorageError) {
        errorMessage = error.message; // Use the message from our custom LocalStorageError
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  }, [
    openConfirmationModal,
    showMessage,
    router,
    handleContinueAsGuestFromModal,
    handleSignInWithGoogleAndClearGuestData,
  ]);

  const handleContinueAsGuest = useCallback(() => {
    try {
      localStorageService.setAppModeInLocalStorage('guest'); // Use the class instance
      router.push('/dashboard'); // Redirect to dashboard
    } catch (error: unknown) {
      const message =
        error instanceof LocalStorageError
          ? error.message
          : `Failed to set guest mode: ${(error as Error).message || 'Unknown error'}`;
      showMessage(message, 'error');
    }
  }, [router, showMessage]);

  return (
    <div className="flex overflow-hidden relative flex-col justify-center items-center p-6 min-h-screen text-white bg-black font-poppins">
      {/* Toast Message */}
      <ToastMessage message={toastMessage} type={toastType} duration={5000} />
      {/* Confirmation Modal for Guest Data */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        title={confirmationModalProps.title}
        message={confirmationModalProps.message}
        confirmButton={confirmationModalProps.confirmButton}
        cancelButton={confirmationModalProps.cancelButton}
        actionDelayMs={confirmationModalProps.actionDelayMs}
      />
      {/* Main Card - using glassmorphism like landing page */}
      <div className="relative z-10 p-8 sm:p-10 w-full max-w-md text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
        <h2 className="mb-6 text-3xl font-bold text-white">Join Your Journey</h2>
        <p className="mb-8 leading-relaxed text-white/70">
          Sign in to save your goals across devices or continue as a guest for temporary tracking.
        </p>
        <div className="space-y-4">
          {/* Google Sign In Button - matching landing page CTA style */}
          <button
            onClick={handleGoogleSignInAttempt}
            className="inline-flex gap-3 justify-center items-center px-6 py-4 w-full text-lg font-semibold text-black bg-white rounded-full transition-all duration-200 group hover:bg-white/90 hover:scale-105 hover:shadow-xl"
          >
            <FcGoogle size={24} />
            Sign In with Google
          </button>
          {/* Guest Button - using glassmorphism style */}
          <button
            onClick={handleContinueAsGuest}
            className="inline-flex gap-3 justify-center items-center px-6 py-4 w-full text-lg font-semibold text-white bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-full transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20 hover:scale-105"
          >
            <FiUser size={24} />
            Continue as Guest
          </button>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Your journey to focused productivity starts here.
        </p>
      </div>
    </div>
  );
}
