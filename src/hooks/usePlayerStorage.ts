import { useCallback, useMemo, useRef } from 'react';
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
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const prefix = storageKey ? `${storageKey}_` : STORAGE_PREFIX;

  const getStoredValue = useCallback(
    <T>(key: string, defaultValue: T): T => {
      const fullKey = `${prefix}${key}`;
      const saved = storageRef.current.getItem(fullKey);
      if (!saved) return defaultValue;

      return JSON.parse(saved) as T;
    },
    [prefix]
  );

  const setStoredValue = useCallback(
    <T>(key: string, value: T) => {
      const fullKey = `${prefix}${key}`;
      storageRef.current.setItem(fullKey, JSON.stringify(value));
    },
    [prefix]
  );

  return useMemo(
    () => ({
      getStoredValue,
      setStoredValue,
    }),
    [getStoredValue, setStoredValue]
  );
}
