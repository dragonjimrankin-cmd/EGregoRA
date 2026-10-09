export const TRACKS = [
  { id: '3413453685', title: "Everyone's Their Own Worst Enemy", ep: 'War of Babylon', epSku: 'ep-wob', file: 'everyones-their-own-worst-enemy.mp3', duration: '2:44' },
  { id: '1615521413', title: 'Fingertips', ep: 'War of Babylon', epSku: 'ep-wob', file: 'fingertips.mp3', duration: '4:44' },
  { id: '2052994429', title: 'Oblivion', ep: 'War of Babylon', epSku: 'ep-wob', file: 'oblivion.mp3', duration: '3:51' },
  { id: '1660080195', title: 'No Sympathy', ep: 'Babylon Whore', epSku: 'ep-bw', file: 'no-sympathy.mp3', duration: '4:23' },
  { id: '1967165273', title: 'As You Crossed Over', ep: 'Babylon Whore', epSku: 'ep-bw', file: 'as-you-crossed-over.mp3', duration: '3:22' },
  { id: '1604999032', title: "It's Easy", ep: 'Babylon Whore', epSku: 'ep-bw', file: 'its-easy.mp3', duration: '3:17' },
  { id: '2507721487', title: 'Raising the Dead', ep: 'Raising the Dead', epSku: 'ep-rtd', file: 'raising-the-dead.mp3', duration: '3:24' },
  { id: '3081387241', title: 'So You Wanna Be a Pirate?', ep: 'Raising the Dead', epSku: 'ep-rtd', file: 'so-you-wanna-be-a-pirate.mp3', duration: '3:00' },
  { id: '858126594', title: 'Underneath My Bed', ep: 'Raising the Dead', epSku: 'ep-rtd', file: 'underneath-my-bed.mp3', duration: '3:36' },
  { id: '2927720339', title: 'When You Cry', ep: 'When You Cry', epSku: 'ep-wyc', file: 'when-you-cry.mp3', duration: '3:34' },
  { id: '158581195', title: "And It's True", ep: 'When You Cry', epSku: 'ep-wyc', file: 'and-its-true.mp3', duration: '3:44' },
  { id: '2841057639', title: 'Must There Be', ep: 'When You Cry', epSku: 'ep-wyc', file: 'must-there-be-an-answer.mp3', duration: '3:20' },
];

export const EPS = [
  { sku: 'ep-wob', name: 'War of Babylon', n: '01' },
  { sku: 'ep-bw', name: 'Babylon Whore', n: '02' },
  { sku: 'ep-rtd', name: 'Raising the Dead', n: '03' },
  { sku: 'ep-wyc', name: 'When You Cry', n: '04' },
];

export const CATALOG = {
  collection: { name: 'ShakRa — complete collection (4 EPs)', pence: 3000 },
  'ep-wob': { name: 'War of Babylon EP', pence: 1300 },
  'ep-bw': { name: 'Babylon Whore EP', pence: 1300 },
  'ep-rtd': { name: 'Raising the Dead EP', pence: 1300 },
  'ep-wyc': { name: 'When You Cry EP', pence: 1300 },
};

TRACKS.forEach(function (t) {
  CATALOG['track-' + t.id] = { name: t.title, pence: 600 };
});

export function tracksForSku(sku) {
  if (sku === 'collection') return TRACKS.map(function (t) { return t.id; });
  if (sku && sku.indexOf('ep-') === 0) {
    return TRACKS.filter(function (t) { return t.epSku === sku; }).map(function (t) { return t.id; });
  }
  if (sku && sku.indexOf('track-') === 0) return [sku.slice(6)];
  return [];
}

export function trackById(id) {
  id = String(id);
  for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i];
  return null;
}