export const modes = {
  osu: { text: 'osu', id: 0 },
  taiko: { text: 'taiko', id: 1 },
  fruits: { text: 'fruits', id: 2 },
  mania: { text: 'mania', id: 3 },
} as const;

export type ModeName = keyof typeof modes;
export type Mode = (typeof modes)[ModeName];
export type RulesetId = Mode['id'];

export const allModes: readonly Mode[] = [modes.osu, modes.mania, modes.taiko, modes.fruits];
