// Level 3 — The Laundry Room. Introduces the tuxedo. Four banks of machines with 1-wide aisles
// between them; every aisle row is open end to end so a tuxedo can be circled instead of shoved past.
// Doom systems: hidey-holes in the north cupboard (? at 12,2, yarn) and in the laundry block (? at 4,18 — the
// tuna is now a stash); litter boxes behind the first tuxedo and inside the flap; the back room is split, so the
// collar tag sits in the left half and the cat flap (15,16) holds the exit half shut until you fetch it.
CatDoom.registerLevel({
  n: 3,
  difficulty: { dmg: 0.9 },   // onboarding: cats hit softer in the first rooms
  name: 'The Laundry Room',
  subtitle: 'The dryer is still warm. Nothing has been washed in weeks.',
  theme: { walls: ['wallpaper', 'metal', 'wood'], border: 'wood', sky: '#4a3524', floor: '#5d4632', fog: 0.15 },
  start: { dir: 'E' },
  par: 180,
  rows: [
    '######################',
    '#S...t....#Y$#.......#',
    '#.........##?#t......#',
    '#................v...#',
    '#.@@.@@.@@.@@.@@.@@..#',
    '#.@@.@@.@@.@@.@@.@@t.#',
    '#.........x!.......W.#',
    '#..@@.@@..@@.@@.@@...#',
    '#..@@.@@..@@.@@.@@...#',
    '#v..................v#',
    '#.@@.@@..==.@@.@@.@@.#',
    '#.@@.@@..==.@@.@@.@@.#',
    '#.W..........x.......#',
    '#..@@.@@.@@..@@.@@...#',
    '#..@@.@@.@@..@@.@@...#',
    '#...x..v...........T.#',
    '####.##########L######',
    '#..t....#.....t.!....#',
    '#..@?@@.#..@@@@......#',
    '#..@$T@.#t.W..t...t..#',
    '#K.@@@@.#............#',
    '##################E###',
  ],
  triggers: [
    {
      when: 'pickup', x: 19, y: 15,
      spawn: [{ x: 16, y: 12, type: 'v' }],
      say: 'SOMETHING MOVED IN THE DRYER',
    },
  ],
});
