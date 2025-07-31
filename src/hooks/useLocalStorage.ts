import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Note: For Claude artifacts, we'll use memory storage instead of localStorage
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // In a real app, you would use localStorage here:
      // localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error storing value for key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
