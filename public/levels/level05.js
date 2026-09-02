// Level 5 — The Living Room. Introduces the Chonk. A wide pillared room to kite in,
// wrapped in a 3-wide ring corridor so voids can flank you while you back-pedal.
// Doom systems: hidey-holes behind the two diagonal armchairs (box ammo NW, tuna SE); litter boxes beside
// the lower armchairs the Chonks lumber past and mid bottom-corridor; the cat flap (L) seals the exit
// vestibule and the collar tag (K) sits at the head of the dead-end west hall, off the main loop.
CatDoom.registerLevel({
  n: 5,
  name: 'The Living Room',
  subtitle: 'Two of the armchairs are breathing.',
  par: 190,
  theme: { walls: ['wallpaper', 'brick', 'wood'], border: 'brick', sky: '#33262a', floor: '#5c4034', fog: 0.2 },
  start: { dir: 'E' },
  rows: [
    '########################',
    '#S.....................#',
    '#......W....==....t....#',
    '#......................#',
    '#.x.#######..#######...#',
    '#...#..............#...#',
    '#...#.t@?@.......t.#...#',
    '#...#..@$@.T...@@..#.v.#',
    '#.v.#..@O@.....@@..#...#',
    '#......@@@.........#.=.#',
    '####...............#...#',
    '#K..#......==......#...#',
    '#.=.#......==......#.x.#',
    '#.T.#..................#',
    '#...#......W..@@@......#',
    '#...#.!@@.....@T@!.#...#',
    '#...#..@@.....@$@..#...#',
    '#.t.#.c.......@?@c.#.v.#',
    '#...#..............#...#',
    '#...#######..#######...#',
    '#.W....................#',
    '#....t..==.v.!..t....###',
    '#...................L..E',
    '########################',
  ],
  awake: [[6, 17], [17, 17]],
  triggers: [
    { when: 'enter', x: 5, y: 5, w: 14, h: 14, say: 'TWO OF THE ARMCHAIRS JUST STOOD UP' },
    {
      when: 'pickup', x: 11, y: 7,
      spawn: [{ x: 2, y: 11, type: 'v' }, { x: 21, y: 11, type: 'v' }],
      say: 'SOMETHING BLACK SLIPS INTO THE SIDE HALLS',
    },
  ],
});
