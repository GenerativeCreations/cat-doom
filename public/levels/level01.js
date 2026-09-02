// Level 1 — The Hallway. Reference level: the original hand-built map, trimmed to 8 tabbies as a warm-up.
// Doom systems: the right alcove is sealed into a hidey-hole (? at 14,5, water inside); one litter box in the
// tuna corridor with a tabby standing behind it, so the first stray spray teaches what a full box does.
CatDoom.registerLevel({
  n: 1,
  difficulty: { dmg: 0.6 },   // onboarding: cats hit softer in the first rooms
  name: 'The Hallway',
  subtitle: 'The house has been overrun. Only the spray bottle remains.',
  theme: { walls: ['brick', 'wood', 'stone'], border: 'stone', sky: '#2a2226', floor: '#4a3a2c', fog: 0 },
  start: { dir: 'E' },
  par: 105,
  rows: [
    '####################',
    '#S.......#.......t.#',
    '#.##.##..#..#####..#',
    '#.#...#t....#.W.#..#',
    '#.#...#..#..#.$.#..#',
    '#.##.##..#..##?##..#',
    '#W.......#.t...!t.T#',
    '####.#######.#######',
    '#........@........W#',
    '#.t@@@...@...@@@...#',
    '#..@.....@..t..@...#',
    '#..@..@@@@@.@..@...#',
    '#..@...t.....@.....#',
    '#..@@@@@@.@@@@.....#',
    '#........@W........#',
    '#.@@@@@@.@.@@@@@@@.#',
    '#.@......@.......E.#',
    '#.@.@@@@.@.@@@@@.@.#',
    '#T.......@...t.....#',
    '####################',
  ],
});
