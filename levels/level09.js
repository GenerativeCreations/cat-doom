// Level 9 — The Crawlspace. A true 1-wide maze under the floorboards, near-black.
// Ghosts (G) are bricked into the walls between the corridors and walk straight out of them;
// the four stone-rimmed pockets are dead ends: two hold water, two hold a sphynx.
// The timber crawl duct along the bottom-right is the only loop, and the exit is at the end of it.
CatDoom.registerLevel({
  n: 9,
  name: 'The Crawlspace',
  subtitle: 'The walls here are load-bearing and also full of cats.',
  theme: { walls: ['bone', 'stone', 'wood'], border: 'stone', sky: '#07070a', floor: '#6f6555', fog: 0.55 },
  start: { dir: 'E' },
  rows: [
    '##########################',
    '#S......#.............#.##',
    '#.#####.#.#.#.@@@.#.#.#.##',
    '#.....G.#...#..WG...#v..##',
    '#.###.#.#.#.#.@@@.#####.##',
    '#...#...#.....#..x#.....##',
    '###.########@.@.###.###.##',
    '#...#x......@WG.......#.##',
    '#.###.#####.@@@.###.###.##',
    '#.#.#...#T.v..#.....#...##',
    '#.#.#.#.#####.###.###.@.@#',
    '#.#v..#.....G.#.....#.@s@#',
    '#.#.#.#####.#.#.###.#.@@@#',
    '#...#.#..x..#...#...#...##',
    '###.#.#.###.#.#.#.###.#.=#',
    '#...#.#.#...#...#.....G..#',
    '#.#.###.#.#.#########.#..#',
    '#.......G.#...#....x#....#',
    '#########.#.#.#.###.@@@..#',
    '#......v..#.#.#.#.#..s@..#',
    '#.#########.###.#.#.@@@..#',
    '#.................=......#',
    '################=........#',
    '########################E#',
  ],
  triggers: [
    { when: 'pickup', x: 9, y: 9, spawn: [{ x: 8, y: 9, type: 'g' }, { x: 12, y: 7, type: 'g' }], say: 'THE WALLS ON BOTH SIDES OF YOU EXHALE' },
  ],
});
