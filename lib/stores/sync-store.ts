import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncState {
  lastProductSync: Date | null;
  setLastProductSync: (date: Date) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastProductSync: null,
      setLastProductSync: (date: Date) => set({ lastProductSync: date }),
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

