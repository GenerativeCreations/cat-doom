// Level 7 — The Basement. Introduces the Sphynx. fog 0.6 means ~5 tiles of vision:
// 1-wide corridors, three metal-walled rooms, and four dead-end pockets that the route
// walks straight past — so the first sphynx is met on the way back, not on the way in.
CatDoom.registerLevel({
  n: 7,
  name: 'The Basement',
  subtitle: 'Down here the dark only moves when you look away.',
  theme: { walls: ['stone', 'metal', 'wood'], border: 'stone', sky: '#07070a', floor: '#17151a', fog: 0.6 },
  start: { dir: 'E' },
  rows: [
    '########################',
    '#S.....................#',
    '#.###.###########.####.#',
    '#.@@@.@@@@###@@@@.@@@@.#',
    '#.@......@###@.......@.#',
    '#.@..v...@###@....vT.@.#',
    '#........@###@.........#',
    '#.@.W........@.......@.#',
    '#.@......@##.@.......@.#',
    '#.@@@@@@@s...@@@.@@@@@.#',
    '#.##########.###.#####.#',
    '#...s#######.....#####.#',
    '#.##############x#####.#',
    '#.##############...s##.#',
    '#.###@@@@@@@@@...#####.#',
    '#.###@.........@######.#',
    '#.###@.........@###s...#',
    '#..x.....==....@######.#',
    '#.###@...==........###.#',
    '#.###@..v.W....@##.###.#',
    '#.###@.s....T..@##.###.E',
    '#.###@@@@@@@@@@@##.###.#',
    '#..........v...........#',
    '########################',
  ],
  triggers: [
    { when: 'enter', x: 3, y: 4, w: 6, h: 5, say: 'THE FURNACE IS COLD. SOMETHING ELSE IN HERE IS NOT.' },
    {
      when: 'pickup', x: 19, y: 5,
      spawn: [{ x: 17, y: 3, type: 's' }],
      say: 'YOU DID NOT HEAR IT ARRIVE',
    },
  ],
});
