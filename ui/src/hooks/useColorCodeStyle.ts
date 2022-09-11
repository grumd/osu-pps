import create from 'zustand';
import { persist } from 'zustand/middleware';

export enum ColorCodeStyle {
  None = 'None',
  Background = 'Background',
  Underline = 'Underline',
  TextColor = 'TextColor',
  Border = 'Border',
}

export const opacityByStyle: Record<ColorCodeStyle, number> = {
  [ColorCodeStyle.Background]: 0.3,
  [ColorCodeStyle.Border]: 0.6,
  [ColorCodeStyle.TextColor]: 0.8,
  [ColorCodeStyle.Underline]: 0.65,
  [ColorCodeStyle.None]: 1,
};

const initialStyle = ColorCodeStyle.Background;

export const useColorCodeStyleStore = create<{
  style: ColorCodeStyle;
  setStyle: (style: ColorCodeStyle) => void;
}>()(
  persist(
    (set) => ({
      style: initialStyle,
      setStyle: (style) => set((state) => ({ ...state, style })),
    }),
    {
      name: 'color-code-style-storage',
      partialize: (state) => ({ style: state.style }),
      version: 1,
    }
  )
);

export const useColorCodeStyle = (): ColorCodeStyle =>
  useColorCodeStyleStore((state) => state.style);
