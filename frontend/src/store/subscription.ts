import { create } from 'zustand';

interface Usage {
  repositories: { current: number; limit: number };
  analyses: { current: number; limit: number };
  exports: { current: number; limit: number };
}

interface SubscriptionStore {
  usage: Usage | null;
  setUsage: (usage: Usage) => void;
  updateUsage: (type: keyof Usage, current: number) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  usage: null,
  setUsage: (usage) => set({ usage }),
  updateUsage: (type, current) => 
    set((state) => ({
      usage: state.usage
        ? { ...state.usage, [type]: { ...state.usage[type], current } }
        : null,
    })),
}));
