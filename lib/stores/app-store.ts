import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  pendingSyncCount: number;
  lastSyncAt: Date | null;
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setPendingSyncCount: (count: number) => void;
  setLastSyncAt: (date: Date) => void;
  resetSyncState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  isSyncing: false,
  syncProgress: 0,
  pendingSyncCount: 0,
  lastSyncAt: null,
  
  setOnlineStatus: (isOnline) => set({ isOnline }),
  
  setSyncing: (isSyncing) => set({ isSyncing }),
  
  setSyncProgress: (syncProgress) => set({ syncProgress }),
  
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  
  resetSyncState: () =>
    set({
      isSyncing: false,
      syncProgress: 0,
      pendingSyncCount: 0,
    }),
}));

