import { create } from 'zustand';

interface UploadProgressState {
  isUploading: boolean;
  progress: number; // 0-1
  current: number;
  total: number;
  successCount: number;
  failCount: number;
  
  // Actions
  startUpload: (total: number) => void;
  updateProgress: (current: number, success: number, fail: number) => void;
  completeUpload: () => void;
  cancelUpload: () => void;
}

export const useUploadProgressStore = create<UploadProgressState>((set) => ({
  isUploading: false,
  progress: 0,
  current: 0,
  total: 0,
  successCount: 0,
  failCount: 0,
  
  startUpload: (total) => set({
    isUploading: true,
    progress: 0,
    current: 0,
    total,
    successCount: 0,
    failCount: 0,
  }),
  
  updateProgress: (current, success, fail) => set((state) => ({
    current,
    progress: current / (state.total || 1),
    successCount: success,
    failCount: fail,
  })),
  
  completeUpload: () => set({
    isUploading: false,
    progress: 1,
  }),
  
  cancelUpload: () => set({
    isUploading: false,
  }),
}));

