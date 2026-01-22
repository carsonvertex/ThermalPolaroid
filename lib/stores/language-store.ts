import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Language = "en" | "zh";

 
interface LanguageState {
  language: Language;
  _hasHydrated: boolean;

  // Actions
  setLanguage: (language: Language) => void;
  setHasHydrated: (value: boolean) => void;
  
  // Get translation
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      _hasHydrated: false,
      
      setLanguage: (language: Language) => set({ language }),
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
      
    
    }),
    {
      name: "language-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
