// Level 12 — The Shrine of Bastet. Final boss. An octagonal arena: eight gilded pillars to break her
// line of sight, four bone alcoves holding the only water in the room, four gates onto a ring corridor
// that runs the whole way around. Her congregation sleeps in that ring. The last door is at the back.
// Doom systems: two niches in the outer ring (north-east bowl, south-west tuna) far from where Bastet's
// faithful materialise beside her; three litter boxes in the gaps of her orbit, where her own hairballs will
// set them off — the blast hurts her summons and turns them on her.
CatDoom.registerLevel({
  n: 12,
  name: 'The Shrine of Bastet',
  subtitle: 'Nine lives, one door, and a bottle that was never going to be enough.',
  theme: { walls: ['brick', 'bone', 'gold'], border: 'brick', sky: '#1b1206', floor: '#4a3510', fog: 0.4 },
  start: { dir: 'S' },
  par: 300,   // 45 + 9x15 placed cats + 120 for Bastet
  rows: [
    '############################',
    '#............S..........#$W#',
    '#.......................#?##',
    '#........####..####........#',
    '#.......#..........#.......#',
    '#......#............#......#',
    '#.....#@.....==.....@#.....#',
    '#....#.......==.......#....#',
    '#...#@W..............W@#...#',
    '#..#.....==......==.....#..#',
    '#s.#.....==..!...==.....#.s#',
    '#..#....................#..#',
    '#..#....................#..#',
    '#T....==.....B......==....T#',
    '#.....==............==.....#',
    '#..#......!.....!.......#..#',
    '#..#....................#..#',
    '#..#.....==......==.....#..#',
    '#..#.....==......==.....#..#',
    '#...#@.w............w.@#...#',
    '#.z..#W......==......W#..z.#',
    '#.....#@.....==.....@#.....#',
    '#......G............G......#',
    '#.......#..........#.......#',
    '#........####..####........#',
    '##?#g..................g...#',
    '#T$#....z..c.T..c..z.......#',
    '#############E##############',
  ],
  triggers: [
    { when: 'enter', x: 12, y: 4, w: 4, h: 2, say: 'BASTET DOES NOT RISE. SHE HAS BEEN WAITING SINCE THE HALLWAY.' },
    { when: 'kills', count: 6, water: 25, say: 'THE OFFERING BOWLS REFILL THEMSELVES' },
    { when: 'kills', count: 12, water: 25, say: 'THE OFFERING BOWLS REFILL THEMSELVES' },
    { when: 'enter', x: 10, y: 25, w: 8, h: 2, say: 'THE LAST DOOR. SOMETHING HEAVY IS SITTING IN FRONT OF IT.' },
  ],
  awake: [[13, 13]],
});
