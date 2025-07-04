// app/store/useWellnessStore.ts
import * as wellnessService from '@/services/wellnessService';
import { ReminderSetting, ReminderType, WellnessSettings } from '@/types';
import * as Tone from 'tone';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface WellnessState {
  settings: WellnessSettings | null;
  activeTimers: Record<string, number>;
  reminderQueue: ReminderType[];
  isInitialized: boolean;
  synth: Tone.Synth | null;

  initialize: (settings: WellnessSettings) => void;
  updateSetting: (type: ReminderType, newSetting: ReminderSetting) => void;
  triggerReminder: (type: ReminderType) => void;
  dismissReminder: () => void;
  stopAllTimers: () => void;
  startTimers: (settings: WellnessSettings) => void;
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  settings: null,
  activeTimers: {},
  reminderQueue: [],
  isInitialized: false,
  synth: null,

  initialize: settings => {
    const { isInitialized, startTimers, stopAllTimers } = get();
    if (isInitialized) {
      stopAllTimers();
    }
    const synth = new Tone.Synth().toDestination();
    set({ settings, isInitialized: true, synth });
    startTimers(settings);
  },

  updateSetting: async (type, newSetting) => {
    const { settings, stopAllTimers, startTimers } = get();
    if (!settings) return;

    const newSettings = { ...settings, [type]: newSetting };
    set({ settings: newSettings });

    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;

    if (currentUser && activeGoalId) {
      try {
        await wellnessService.updateWellnessSettings(currentUser.uid, activeGoalId, newSettings);
        stopAllTimers();
        startTimers(newSettings);
      } catch {
        useNotificationStore.getState().showToast('Failed to save reminder settings.', 'error');
        set({ settings }); // Revert optimistic update
        stopAllTimers();
        startTimers(settings); // Restart with old settings
      }
    }
  },

  triggerReminder: type => {
    const { reminderQueue, synth } = get();
    if (reminderQueue.length === 0 && synth) {
      synth.triggerAttackRelease('C4', '8n');
    }
    if (!reminderQueue.includes(type)) {
      set(state => ({ reminderQueue: [...state.reminderQueue, type] }));
    }
  },

  dismissReminder: () => {
    set(state => ({ reminderQueue: state.reminderQueue.slice(1) }));

    const { reminderQueue, synth } = get();
    if (reminderQueue.length > 0 && synth) {
      synth.triggerAttackRelease('C4', '8n', Tone.now() + 0.1);
    }
  },

  stopAllTimers: () => {
    const { activeTimers } = get();
    Object.values(activeTimers).forEach(timerId => clearInterval(timerId));
    set({ activeTimers: {} });
  },

  startTimers: settings => {
    const { triggerReminder } = get();
    const newActiveTimers: Record<string, number> = {};

    (Object.keys(settings) as Array<keyof WellnessSettings>).forEach(key => {
      const setting = settings[key];
      if (setting.enabled) {
        const intervalId = window.setInterval(
          () => {
            triggerReminder(key as ReminderType);
          },
          setting.frequency * 60 * 1000
        );
        newActiveTimers[key] = intervalId;
      }
    });
    set({ activeTimers: newActiveTimers });
  },
}));
