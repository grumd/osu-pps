export const truncateFloat = (number: number, factor = 100) => Math.round(number * factor) / factor;

export const secondsToFormatted = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${`0${seconds % 60}`.slice(-2)}`;
