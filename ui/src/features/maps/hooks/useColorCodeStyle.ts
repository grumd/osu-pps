export enum ColorCodeStyle {
  None,
  Background,
  Underline,
  TextColor,
  Border,
}

export const useColorCodeStyle = (): ColorCodeStyle => {
  return ColorCodeStyle.Background;
};
