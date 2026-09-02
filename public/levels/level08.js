// Level 8 — The Attic. Rafters cut the floor into 1-wide staircase corridors; zoomies ricochet down them.
// A perimeter crawl loops the whole map, the chimney is the only landmark, and the Chonk owns the exit room.
// Doom systems: hidey-holes inside the chimney itself (? on its north face, tuna) and in the cavity behind the
// exit-room wall (catnip, reached through the pointless-looking alcove the void sits in); litter boxes below
// the chimney, on the bottom run the trigger zoomies charge down, and in the Chonk's room.
CatDoom.registerLevel({
  n: 8,
  name: 'The Attic',
  subtitle: 'Insulation, boxes of photographs, and something very fast.',
  par: 230,
  theme: { walls: ['wood', 'wallpaper', 'stone'], border: 'wood', sky: '#1d1610', floor: '#3b2d1f', fog: 0.3 },
  start: { dir: 'E' },
  rows: [
    '##########################',
    '#.........t..............#',
    '#.S.....@..@..@.....@.t@.#',
    '#.....@..@..@.....@..@...#',
    '#......@..@z....@.....@.t#',
    '#.@..@..@.....@.....@..@.#',
    '#..@z.@.....@..@v....@...#',
    '#...@.....@..@..@..@..@..#',
    '#t@.....@..@..@..@..@z.@.#',
    '#.....@v.@..=?=@..@..@...#',
    '#...@..@..@W=$=.@..@.....#',
    '#.@..@..@..@=T=..@.....@.#',
    '#.z@..@..@..@=.@.....@.z.#',
    '#......@z.@..@.!...@..@.W#',
    '#.@.....@..@.....@.v@..@.#',
    '#..@.....@...z.@..@?$@...#',
    '#t..@..@.....@..@..@N#####',
    '#.@..@v....@..@.z@..#....#',
    '#W.@.....@..@..@..@...c..E',
    '#......@..@..@..@.T@#..!.#',
    '#............t.!.....#####',
    '##########################',
  ],
  triggers: [
    { when: 'pickup', x: 18, y: 19, spawn: [{ x: 12, y: 20, type: 'z' }, { x: 8, y: 20, type: 'z' }], say: 'SOMETHING RICOCHETS OFF THE RAFTERS BEHIND YOU' },
  ],
  awake: [[22, 18]],
});
