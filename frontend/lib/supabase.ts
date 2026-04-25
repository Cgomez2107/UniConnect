import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// En desarrollo usamos AsyncStorage (más rápido con Tunnel)
// En producción usamos SecureStore (más seguro)
const isDevelopment = Constants.expoConfig?.extra?.isDev || __DEV__;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const AsyncStorageAdapter = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isWeb = Platform.OS === 'web';
const authStorage = isWeb ? undefined : (isDevelopment ? AsyncStorageAdapter : ExpoSecureStoreAdapter);

export const supabase = createClient(url, key, {
  auth: {
    // En web dejamos la persistencia gestionada por el navegador/supabase-js.
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});