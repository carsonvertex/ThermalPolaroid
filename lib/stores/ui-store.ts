import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  theme: 'light' | 'dark' | 'auto';
  hideThermalPolaroidName: boolean;

  // Actions
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setHideThermalPolaroidName: (hide: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isModalOpen: false,
  modalContent: null,
  theme: 'light',
  hideThermalPolaroidName: false,

  showToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };
    
    set((state) => ({ toasts: [...state.toasts, toast] }));
    
    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  openModal: (content) => {
    set({ isModalOpen: true, modalContent: content });
  },
  
  closeModal: () => {
    set({ isModalOpen: false, modalContent: null });
  },
  
  setTheme: (theme) => set({ theme }),
  setHideThermalPolaroidName: (hide) => set({ hideThermalPolaroidName: hide }),
}));

