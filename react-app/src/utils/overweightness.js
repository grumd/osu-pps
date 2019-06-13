export const overweightnessCalcFromMode = {
  age: item => +item.x / +item.h,
  total: item => +item.x,
  playcount: item => +item.x / +item.p,
  adjusted: item => +item.x / Math.pow(item.adj || 1, 0.65) / Math.pow(+item.h || 1, 0.35),
  // adjusted1: item => +item.x / +item.adj,
};
