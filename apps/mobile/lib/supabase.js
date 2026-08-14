import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ygmjsualluwltbwkawhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWpzdWFsbHV3bHRid2thd2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjMxNzcsImV4cCI6MjEwMjAzOTE3N30.kHY6axy6kI1oPP4Pm0c7l7Hsr_DO8XfVemsSvs9p_c0';

// In-memory fallback map for environments where AsyncStorage is unavailable or throws native errors
const memoryStorage = new Map();

const safeStorage = {
  getItem: async (key) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn('AsyncStorage getItem fallback:', e?.message || e);
    }
    return memoryStorage.get(key) || null;
  },
  setItem: async (key, value) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('AsyncStorage setItem fallback:', e?.message || e);
    }
    memoryStorage.set(key, value);
  },
  removeItem: async (key) => {
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('AsyncStorage removeItem fallback:', e?.message || e);
    }
    memoryStorage.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
