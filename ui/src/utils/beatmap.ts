import { color, interpolateRgb, scaleLinear } from 'd3';

// Stolen from https://github.com/ppy/osu-web/blob/master/resources/assets/lib/utils/beatmap-helper.ts
// Copyright (c) ppy Pty Ltd <contact@ppy.sh>. Licensed under the GNU Affero General Public License v3.0.
const colors = [
  '#4290FB',
  '#4FC0FF',
  '#4FFFD5',
  '#7CFF4F',
  '#F6F05C',
  '#FF8068',
  '#FF4E6F',
  '#C645B8',
  '#6563DE',
  '#18158E',
  // '#000000',
];
const colorSpectrum = scaleLinear<string>()
  .domain([0.011, 0.138, 0.222, 0.277, 0.366, 0.466, 0.544, 0.644, 0.744, 0.855 /*, 1*/])
  .clamp(true)
  .range(colors)
  .interpolate(interpolateRgb.gamma(2.2));

export function getDiffColour(rating: number, opacity: number) {
  // if (rating < 0.1) return '#AAAAAA';
  const clr = color(colorSpectrum(rating / 9));
  clr && (clr.opacity = opacity);
  return clr?.toString();
}

export function getLengthColour(length: number, opacity: number) {
  const value = (length - 20) / 530; // range 0:20 -> 9:00
  const clr = color(colorSpectrum(value));
  console.log();
  clr && (clr.opacity = opacity);
  return clr?.toString();
}

export function getBpmColour(bpm: number, opacity: number) {
  const value = (bpm - 130) / 170; // range 120 -> 300
  const clr = color(colorSpectrum(value));
  clr && (clr.opacity = opacity);
  return clr?.toString();
}
