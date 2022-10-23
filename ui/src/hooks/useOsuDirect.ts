import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useUseDirectStore = create<{
  direct: boolean;
  setDirect: (direct: boolean) => void;
}>()(
  persist(
    (set) => ({
      direct: true,
      setDirect: (direct) => set((state) => ({ ...state, direct })),
    }),
    {
      name: 'use-direct-storage',
      partialize: (state) => ({ direct: state.direct }),
      version: 1,
    }
  )
);

export const useOsuDirect = (): boolean => useUseDirectStore((state) => state.direct);
