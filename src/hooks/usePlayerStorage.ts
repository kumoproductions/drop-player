import { useCallback, useMemo } from 'react';
import type { StorageAdapter } from '../types';

// Storage key prefix
const STORAGE_PREFIX = 'drop_player_';

/**
 * Default localStorage adapter (SSR-safe: no-op when window is undefined)
 */
const defaultStorage: StorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

interface UsePlayerStorageOptions {
  storageKey?: string;
  storage?: StorageAdapter;
}

interface UsePlayerStorageReturn {
  getStoredValue: <T>(key: string, defaultValue: T) => T;
  setStoredValue: <T>(key: string, value: T) => void;
}

/**
 * Hook for player storage (preferences)
 */
export function usePlayerStorage(
  options: UsePlayerStorageOptions = {}
): UsePlayerStorageReturn {
  const { storageKey, storage = defaultStorage } = options;

  const prefix = storageKey ? `${storageKey}_` : STORAGE_PREFIX;

  const getStoredValue = useCallback(
    <T>(key: string, defaultValue: T): T => {
      const fullKey = `${prefix}${key}`;
      const saved = storage.getItem(fullKey);
      if (!saved) return defaultValue;

      return JSON.parse(saved) as T;
    },
    [storage, prefix]
  );

  const setStoredValue = useCallback(
    <T>(key: string, value: T) => {
      const fullKey = `${prefix}${key}`;
      storage.setItem(fullKey, JSON.stringify(value));
    },
    [storage, prefix]
  );

  return useMemo(
    () => ({
      getStoredValue,
      setStoredValue,
    }),
    [getStoredValue, setStoredValue]
  );
}
