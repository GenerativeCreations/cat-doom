// Level 10 — The Cat Tree. A 14x14 carpeted arena with the tree in the middle and four alcoves of water.
// Four waves: the six tabbies on the floor are wave one; `kills` triggers at 6, 14 and 24 open the rest.
// Every wave from the second on carries wailers — leave one alive and the next wave lands on top of you.
CatDoom.registerLevel({
  n: 10,
  name: 'The Cat Tree',
  subtitle: 'Sixty pounds of carpeted plywood, and everything that lives on it.',
  theme: { walls: ['wood', 'wallpaper', 'brick'], border: 'wood', sky: '#241a1e', floor: '#5b2f36', fog: 0.2 },
  start: { dir: 'N' },
  rows: [
    '########################',
    '#####=====######E#######',
    '#####=...=#####...######',
    '#####=.W.=#####...######',
    '#####=...=#####...######',
    '#####..............#####',
    '#====....t.......T.#####',
    '#=............t....#####',
    '#=.W.............@.#####',
    '#=.......@..T.@....#####',
    '#====...........t..#####',
    '#####.@....@@......====#',
    '#####......@@.........=#',
    '#####...t...........W.=#',
    '#####....@....@..t....=#',
    '#####..............====#',
    '#####.......t......#####',
    '#####.S............#####',
    '#####..............#####',
    '##############=...=#####',
    '##############=.W.=#####',
    '##############=...=#####',
    '##############=====#####',
    '########################',
  ],
  triggers: [
    {
      when: 'kills', count: 6, say: 'SECOND WAVE — THE WAILERS',
      spawn: [
        { x: 5, y: 5, type: 'z' }, { x: 18, y: 5, type: 'z' }, { x: 11, y: 5, type: 'z' },
        { x: 5, y: 18, type: 'z' }, { x: 18, y: 18, type: 'z' }, { x: 11, y: 18, type: 'z' },
        { x: 5, y: 11, type: 'w' }, { x: 18, y: 12, type: 'w' },
      ],
    },
    {
      when: 'kills', count: 14, say: 'THIRD WAVE — THE HEAVY BRANCH', water: 30,
      spawn: [
        { x: 6, y: 5, type: 'x' }, { x: 17, y: 5, type: 'x' }, { x: 6, y: 18, type: 'x' }, { x: 17, y: 18, type: 'x' },
        { x: 5, y: 8, type: 'h' }, { x: 18, y: 9, type: 'h' }, { x: 5, y: 15, type: 'h' }, { x: 18, y: 15, type: 'h' },
        { x: 4, y: 8, type: 'w' }, { x: 16, y: 19, type: 'w' },
      ],
    },
    {
      when: 'kills', count: 24, say: 'FOURTH WAVE — THE TOP OF THE TREE',
      spawn: [
        { x: 5, y: 6, type: 'c' }, { x: 18, y: 17, type: 'c' },
        { x: 9, y: 5, type: 'k' }, { x: 11, y: 5, type: 'k' }, { x: 13, y: 5, type: 'k' },
        { x: 9, y: 18, type: 'k' }, { x: 11, y: 18, type: 'k' }, { x: 13, y: 18, type: 'k' },
      ],
    },
  ],
});
