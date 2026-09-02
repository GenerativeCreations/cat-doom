// Level 4 — The Nursery. Introduces the kitten. One big pillared play room with three cribs off it;
// each crib door is an `enter` trigger that lets a six-kitten pack out. A tabby dozes in two of the
// cribs so the roster cannot be cleared without opening every door.
// Doom systems: hidey-holes behind crib A's side panel (bag ammo) and inside the toy chest in the back-left
// room (tuna); litter boxes at the crib A and crib C doorways, where the kitten packs pour out.
CatDoom.registerLevel({
  n: 4,
  name: 'The Nursery',
  subtitle: 'Three cribs. Nobody has slept here in a very long time.',
  par: 190,
  theme: { walls: ['wallpaper', 'tile', 'wood'], border: 'wallpaper', sky: '#e3d3e8', floor: '#8e809e', fog: 0.1 },
  start: { dir: 'S' },
  rows: [
    '########################',
    '#..t....#..S...#....t..#',
    '#.@@@@..#......#..@@@@.#',
    '#.?$P@..#......#..@@@@.#',
    '#.@@@@..#......#.......#',
    '#.W.....#......#.....W.#',
    '####.####......####.####',
    '#....!.................#',
    '#..@@......@@......@@..#',
    '#..@@......@@......@@..#',
    '#......................#',
    '#.....t..........t.....#',
    '#......................#',
    '#..==......==......==..#',
    '#..==......==......==..#',
    '#.......W......T...!...#',
    '#............#####.#####',
    '#......=?=...#.........#',
    '#....T.=$=...#..@@@@...#',
    '#......=T=...#...W.....E',
    '#......===...#.........#',
    '########################',
  ],
  triggers: [
    {
      when: 'enter', x: 4, y: 5, w: 1, h: 3,
      spawn: [
        { x: 1, y: 2, type: 'k' }, { x: 7, y: 2, type: 'k' },
        { x: 1, y: 4, type: 'k' }, { x: 7, y: 4, type: 'k' },
        { x: 3, y: 5, type: 'k' }, { x: 6, y: 5, type: 'k' },
      ],
      say: 'MEW MEW MEW MEW MEW MEW',
    },
    {
      when: 'enter', x: 19, y: 5, w: 1, h: 3,
      spawn: [
        { x: 16, y: 2, type: 'k' }, { x: 22, y: 2, type: 'k' },
        { x: 16, y: 4, type: 'k' }, { x: 22, y: 4, type: 'k' },
        { x: 17, y: 5, type: 'k' }, { x: 20, y: 5, type: 'k' },
      ],
      say: 'MEW MEW MEW MEW MEW MEW',
    },
    {
      when: 'enter', x: 18, y: 15, w: 1, h: 3,
      spawn: [
        { x: 15, y: 17, type: 'k' }, { x: 21, y: 17, type: 'k' },
        { x: 22, y: 18, type: 'k' }, { x: 14, y: 19, type: 'k' },
        { x: 15, y: 20, type: 'k' }, { x: 20, y: 20, type: 'k' },
      ],
      say: 'MEW MEW MEW MEW MEW MEW',
    },
  ],
});
