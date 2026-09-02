// Level 2 — The Kitchen. Introduces the void cat. Two island counters make a figure-eight;
// the tuna sits in the notch between them and springs two voids from both ends of the aisle.
// Doom systems: a hidey-hole hollowed inside each island (? at 4,7 and 16,12 — catnip left, bowl right);
// litter boxes in the south funnel to the tuna and in the aisle on the way to the exit.
CatDoom.registerLevel({
  n: 2,
  difficulty: { dmg: 0.8 },   // onboarding: cats hit softer in the first rooms
  name: 'The Kitchen',
  subtitle: 'Something is on the counter. It was not there a moment ago.',
  theme: { walls: ['tile', 'wood', 'metal'], border: 'tile', sky: '#c7d4dc', floor: '#6e757b', fog: 0.1 },
  start: { dir: 'E' },
  par: 150,
  rows: [
    '######################',
    '#S....t.........t....#',
    '#....................#',
    '#..====....W....====.#',
    '#..====.........====.#',
    '#..........t.........#',
    '#....................#',
    '#..@?@@@@@..@@@@@@@..#',
    '#t.@$.N@@@..@@@@@@@.t#',
    '#..@@@@@......@@@@@..#',
    '#..@@@@@..T...@@@@@..#',
    '#..@@@@@@@..@@@.$W@..#',
    '#..@@@@@@@.!@@@@?@@..#',
    '#..v.......t......v..#',
    '#.........W..........#',
    '#..==.........==.....#',
    '#..==....T....==!....#',
    '#..t.............W..tE',
    '#..W.................#',
    '######################',
  ],
  triggers: [
    {
      when: 'pickup', x: 10, y: 10,
      spawn: [{ x: 10, y: 6, type: 'v' }, { x: 11, y: 16, type: 'v' }],
      say: 'SOMETHING KNOCKED A GLASS OFF THE COUNTER',
    },
  ],
});
