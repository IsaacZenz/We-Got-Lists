// Original pixel-art sprites for the meadow. Each sprite is a grid of characters;
// each character is a colour from PALETTE, and "." is transparent.
// Every sprite faces RIGHT; the renderer mirrors it when the critter walks left.

export const PALETTE: Record<string, string> = {
  k: "#3b2410", // outline
  w: "#fffaf0", // white
  s: "#3b2410", // cow spots
  p: "#ff9ec0", // cow nose
  h: "#e6cf98", // horns
  b: "#8a4fbf", // pterodactyl body
  m: "#c78ae8", // pterodactyl wing
  y: "#ffcf3a", // beak / legs
  c: "#e8323e", // comb / crest
};

export type Grid = string[];

const COW_BODY: Grid = [
  "............h...h..",
  "...........kkkkkk..",
  ".kkkkkkkkkkkwwwwwk.",
  "kwwsswwwwwwkwkwwwk.",
  "kwsssswwwsswwwwpppk",
  "kwsswwwwsssswwwpkpk",
  "kwwwwwwwwswwkkkpppk",
  "kwwwwwwwwwwwk..kkk.",
  ".kkkkkkkkkkkk......",
];
const COW_LEGS: Grid[] = [
  ["..kwk....kwk.......", "..kkk....kkk......."],
  [".kwk......kwk......", ".kk.......kkk......"],
];
const CHICKEN_BODY: Grid = [
  "......cc...",
  ".....kwwk..",
  ".....kwkwyy",
  "k....kwwwk.",
  "kwk..kwwk..",
  "kwwkkwwwk..",
  "kwwwwwwwk..",
  ".kwwwwwk...",
  "..kkkkk....",
];
const CHICKEN_LEGS: Grid[] = [
  ["...y.y.....", "..yy.yy...."],
  ["....yy.....", "...yy.y...."],
];

// Grazing: the same cow with its head (everything right of the neck) lowered 2 pixels.
// (The old version deleted the top rows instead, which cut the head off.)
const HEAD_COL = 12;
const COW_GRAZE: Grid = COW_BODY.map((row, y) => {
  const body = y < 2 ? ".".repeat(HEAD_COL) : row.slice(0, HEAD_COL);
  const head = y >= 2 ? COW_BODY[y - 2].slice(HEAD_COL) : ".".repeat(row.length - HEAD_COL);
  return body + head;
});

/** Cow: `step` picks the leg frame, `graze` lowers the head. */
export function cowGrid(step: number, graze = false): Grid {
  return (graze ? COW_GRAZE : COW_BODY).concat(COW_LEGS[step % 2]);
}

// Pecking: the head (right of column 5) dips down one pixel. Whole head, nothing cut off.
const CHICKEN_PECK: Grid = CHICKEN_BODY.map((row, y) =>
  y < 4 ? row.slice(0, 5) + (y === 0 ? ".".repeat(row.length - 5) : CHICKEN_BODY[y - 1].slice(5)) : row);

/** Chicken: `step` picks the leg frame, `peck` dips the head. */
export function chickenGrid(step: number, peck = false): Grid {
  return (peck ? CHICKEN_PECK : CHICKEN_BODY).concat(CHICKEN_LEGS[step % 2]);
}

/** Pterodactyl. This one faces LEFT in the grid (it flies left by default). */
export const PTERO: Grid[] = [
  [
    "kk..............kk..",
    "kmk............kmk..",
    ".kmk..........kmmk..",
    "..kmk...cc...kmmk...",
    "...kmk.kbbk.kmmk....",
    "kyyykbkbbbbkbmk.....",
    ".kkkkbbbbbbbbbbkkk..",
    ".....kkbbbbbkkk..kbk",
    ".......k.k.k......k.",
  ],
  [
    "....................",
    "........cc..........",
    ".......kbbk.........",
    "kyyyk.kbbbbk........",
    ".kkkkkbbbbbbbbbkkk..",
    "...kmmmbbbbbbmmmk.kb",
    "..kmmmk.kkkk.kmmmk.k",
    ".kmmk........kmmk...",
    ".kk............kk...",
  ],
];

export const gridHeight = (g: Grid) => g.length;
