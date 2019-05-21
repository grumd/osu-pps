export const overweightnessCalcFromMode = {
  age: item => +item.x / +item.h,
  total: item => +item.x,
  playcount: item => +item.x / +item.p,
  adjusted: item =>
    +item.x / Math.pow(item.adj || 1, 0.65) / Math.pow(+item.p, 0.2) / Math.pow(+item.h, 0.5),
};
