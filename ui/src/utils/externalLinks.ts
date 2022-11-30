export const getBeatmapUrl = (id: number) => `https://osu.ppy.sh/beatmaps/${id}`;
export const getMapsetUrl = (id: number) => `https://osu.ppy.sh/beatmapsets/${id}`;
export const getUserUrl = (id: number) => `https://osu.ppy.sh/users/${id}`;
export const getScoreUrl = (mode: 'osu' | 'taiko' | 'fruits' | 'mania', id: number) =>
  `https://osu.ppy.sh/scores/${mode}/${id}`;
