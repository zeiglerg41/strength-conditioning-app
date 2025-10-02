import { create } from 'zustand';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppSettings {
  units: 'metric' | 'imperial';
  defaultTrainingTime: string;
  notifications: {
    workoutReminders: boolean;
    programUpdates: boolean;
    achievements: boolean;
  };
  privacy: {
    shareLocation: boolean;
    anonymousAnalytics: boolean;
  };
}

interface ProfileSettingsState {
  profilePhoto: string | null;
  appSettings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateProfilePhoto: (uri: string | null) => Promise<void>;
  updateAppSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  updateNotificationSetting: (key: keyof AppSettings['notifications'], value: boolean) => Promise<void>;
  updatePrivacySetting: (key: keyof AppSettings['privacy'], value: boolean) => Promise<void>;
  exportUserData: () => Promise<string>;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  units: 'imperial',
  defaultTrainingTime: 'morning',
  notifications: {
    workoutReminders: true,
    programUpdates: true,
    achievements: true,
  },
  privacy: {
    shareLocation: false,
    anonymousAnalytics: true,
  },
};

export const useProfileSettingsStore = create<ProfileSettingsState>((set, get) => ({
  profilePhoto: null,
  appSettings: defaultSettings,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      // Load from AsyncStorage for quick access
      const storedSettings = await AsyncStorage.getItem('appSettings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        set({ appSettings: { ...defaultSettings, ...settings } });
      }

      // Load profile photo from AsyncStorage
      const storedPhoto = await AsyncStorage.getItem('profilePhoto');
      if (storedPhoto) {
        set({ profilePhoto: storedPhoto });
      }

      // TODO: Sync with backend when user preferences table is ready
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ error: 'Failed to load settings' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfilePhoto: async (uri: string | null) => {
    try {
      set({ profilePhoto: uri });
      if (uri) {
        await AsyncStorage.setItem('profilePhoto', uri);
      } else {
        await AsyncStorage.removeItem('profilePhoto');
      }
      // TODO: Upload to Supabase storage when ready
    } catch (error) {
      console.error('Failed to update profile photo:', error);
      set({ error: 'Failed to update profile photo' });
    }
  },

  updateAppSetting: async (key, value) => {
    const { appSettings } = get();
    const updatedSettings = { ...appSettings, [key]: value };

    set({ appSettings: updatedSettings });

    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      // TODO: Sync with backend
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  updateNotificationSetting: async (key, value) => {
    const { appSettings } = get();
    const updatedSettings = {
      ...appSettings,
      notifications: {
        ...appSettings.notifications,
        [key]: value,
      },
    };

    set({ appSettings: updatedSettings });

    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  },

  updatePrivacySetting: async (key, value) => {
    const { appSettings } = get();
    const updatedSettings = {
      ...appSettings,
      privacy: {
        ...appSettings.privacy,
        [key]: value,
      },
    };

    set({ appSettings: updatedSettings });

    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  },

  exportUserData: async () => {
    // TODO: Implement data export
    // This will gather all user data and create a JSON export
    return JSON.stringify({
      settings: get().appSettings,
      exportDate: new Date().toISOString(),
    });
  },

  resetSettings: () => {
    set({
      profilePhoto: null,
      appSettings: defaultSettings,
      error: null,
    });
    AsyncStorage.removeItem('appSettings');
    AsyncStorage.removeItem('profilePhoto');
  },
}));