// app/store/useNotificationStore.ts
import { create } from 'zustand';

/**
 * @file app/store/useNotificationStore.ts
 * @description Zustand store for managing global UI notifications.
 *
 * This store centralizes the state and logic for components that need to be
 * displayed globally, such as toast messages and confirmation modals. This avoids
 * prop drilling and allows any component in the application to trigger a notification.
 */

/**
 * Defines the options required to show a confirmation modal.
 */
interface ConfirmationOptions {
  title: string;
  message: string;
  action: () => void | Promise<void>; // The function to execute on confirmation.
  actionDelayMs?: number;
}

/**
 * Defines the shape of the notification store's state and actions.
 */
interface NotificationState {
  // --- STATE ---
  toast: {
    key: number; // A key to re-trigger animations for consecutive toasts.
    message: string | null;
    type: 'info' | 'success' | 'error';
  };
  confirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void | Promise<void>;
    actionDelayMs?: number;
  };

  // --- ACTIONS ---
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  showConfirmation: (options: ConfirmationOptions) => void;
  hideConfirmation: () => void;
}

/**
 * The Zustand store for managing global notifications.
 * Any component can import this hook to access the state or trigger actions.
 */
export const useNotificationStore = create<NotificationState>(set => ({
  // --- INITIAL STATE ---
  toast: { key: 0, message: null, type: 'info' },
  confirmation: { isOpen: false, title: '', message: '', action: () => {}, actionDelayMs: 0 },

  // --- ACTION IMPLEMENTATIONS ---

  /**
   * Triggers a toast message to be displayed.
   * Increments a `key` to ensure that even if the same message is sent twice,
   * the toast component's animation will re-trigger.
   */
  showToast: (message, type = 'info') => {
    set(state => ({
      toast: {
        key: state.toast.key + 1,
        message,
        type,
      },
    }));
  },

  /**
   * Sets the properties for a confirmation modal and makes it visible.
   */
  showConfirmation: options => {
    set({ confirmation: { ...options, isOpen: true } });
  },

  /**
   * Hides the confirmation modal.
   */
  hideConfirmation: () => {
    set(state => ({ confirmation: { ...state.confirmation, isOpen: false } }));
  },
}));
