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

/** Cow: `step` picks the leg frame, `graze` lowers the head. */
export function cowGrid(step: number, graze = false): Grid {
  const body = graze ? COW_BODY.map((r, i) => (i < 2 ? "" : r)) : COW_BODY;
  return body.concat(COW_LEGS[step % 2]);
}

/** Chicken: `step` picks the leg frame, `peck` dips the head. */
export function chickenGrid(step: number, peck = false): Grid {
  const body = peck
    ? CHICKEN_BODY.map((r, i) => (i < 3 ? "" : i === 3 ? "k....kwwwyy" : r))
    : CHICKEN_BODY;
  return body.concat(CHICKEN_LEGS[step % 2]);
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
