// Level 9 — The Crawlspace. A true 1-wide maze under the floorboards, near-black.
// Ghosts (G) are bricked into the walls between the corridors and walk straight out of them;
// the four stone-rimmed pockets are dead ends: two hold water, two hold a sphynx.
// The timber crawl duct along the bottom-right is the only loop, and the exit is at the end of it.
// Doom systems: two corridors that look like dead ends are hidey-holes (? at 23,2 — yarn; ? at 5,13 — a bowl,
// worth the walk this deep in the dark); litter boxes at the duct's north junction and in the last 2-wide run;
// the cat flap (L) is at the end of the duct and the collar tag (K) is in the sphynx's stone-rimmed pocket.
CatDoom.registerLevel({
  n: 9,
  name: 'The Crawlspace',
  subtitle: 'The walls here are load-bearing and also full of cats.',
  par: 230,
  theme: { walls: ['bone', 'stone', 'wood'], border: 'stone', sky: '#07070a', floor: '#6f6555', fog: 0.55 },
  start: { dir: 'E' },
  rows: [
    '##########################',
    '#S......#.............#$Y#',
    '#.#####.#.#.#.@@@.#.#.#?##',
    '#.....G.#...#..WG...#v..##',
    '#.###.#.#.#.#.@@@.#####.##',
    '#...#...#.....#..x#.....##',
    '###.########@.@.###.###.##',
    '#...#x......@WG.......#.##',
    '#.###.#####.@@@.###.###.##',
    '#.#.#...#T.v..#.....#...##',
    '#.#.#.#.#####.###.###.@K@#',
    '#.#v..#.....G.#.....#.@s@#',
    '#.#.#.#####.#.#.###.#.@@@#',
    '#...#?#..x..#...#...#...##',
    '###.#$#.###.#.#.#.###.#.=#',
    '#...#W#.#...#...#.....G..#',
    '#.#.###.#.#.#########.#..#',
    '#.......G.#...#....x#..!.#',
    '#########.#.#.#.###.@@@..#',
    '#......v..#.#.#.#.#..s@..#',
    '#.#########.###.#.#.@@@..#',
    '#.................=.....=#',
    '################=....!.L.#',
    '########################E#',
  ],
  triggers: [
    { when: 'pickup', x: 9, y: 9, spawn: [{ x: 8, y: 9, type: 'g' }, { x: 12, y: 7, type: 'g' }], say: 'THE WALLS ON BOTH SIDES OF YOU EXHALE' },
  ],
});
