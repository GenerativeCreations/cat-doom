// Level 6 — The Garage. Introduces the Hairball Hurler. Three long 4-wide bays give
// 20-tile sightlines; the concrete "cars" alternate top/bottom every ~4 tiles so the only
// way down a bay is a weave, and each weave is a piece of hairball cover. Water is out
// in the open lanes on purpose.
// Doom systems: hidey-holes inside the bay-1 and bay-3 cars (tuna, yarn); litter boxes parked in the
// bay-2, bay-3 and bay-4 firing lines, each within a hairball of a hurler's own friends.
CatDoom.registerLevel({
  n: 6,
  name: 'The Garage',
  subtitle: 'Something in the third bay is clearing its throat.',
  par: 195,
  theme: { walls: ['metal', 'stone', 'wood'], border: 'metal', sky: '#20242a', floor: '#3a3d42', fog: 0.25 },
  start: { dir: 'E' },
  rows: [
    '##########################',
    '#S..@@@@..........@@@....#',
    '#...@$T@....W.....@@@....#',
    '#...@?@@.@@@...@@@.....h.#',
    '#........@@@.v.@@@.......#',
    '#=..========x.========..=#',
    '#......@@@.........@@@..h#',
    '#...v..@@@.........@@@...#',
    '#.........W..@@@..!......#',
    '#............@@@..v......#',
    '#=..=====x.===========..=#',
    '#..........@@@.@@@.....h.#',
    '#.h.@?@@v!.@@@.@@@..T....#',
    '#...@$Y@W.........@@@....#',
    '#...@@@@.......v..@@@....#',
    '#=======..=====x.=====..=#',
    '#....@@............@@....#',
    '#..v.@@.....h......@@.h..E',
    '#...............!........#',
    '##########################',
  ],
  triggers: [
    { when: 'enter', x: 15, y: 1, w: 8, h: 4, say: 'IT IS NOT CHARGING. IT IS WINDING UP.' },
    {
      when: 'pickup', x: 20, y: 12,
      spawn: [{ x: 2, y: 7, type: 'h' }, { x: 2, y: 18, type: 'v' }],
      say: 'THE FAR BAY DOOR ROLLS OPEN BEHIND YOU',
    },
  ],
});
