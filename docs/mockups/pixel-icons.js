// Tiny pixel-art icon renderer for the mockups. Each icon is a grid of characters;
// each character maps to a colour from the palette passed in. '.' is transparent.
const ICONS = {
  star: [
    "....kk....",
    "...kyyk...",
    "...kyyk...",
    "kkkkyykkkk",
    "kyyyywyyyk",
    ".kyyyyyyk.",
    "..kyyyyk..",
    ".kyyookyk.",
    ".kyok.koyk",
    ".kkk...kkk",
  ],
  starOff: [
    "....kk....",
    "...kggk...",
    "...kggk...",
    "kkkkggkkkk",
    "kggggggggk",
    ".kggggggk.",
    "..kggggk..",
    ".kggkkggk.",
    ".kgk..kgk.",
    ".kk....kk.",
  ],
  heart: [
    ".kk...kk.",
    "krrk.krrk",
    "krwrkrrrk",
    "krrrrrrrk",
    ".krrrrrk.",
    "..krrrk..",
    "...krk...",
    "....k....",
  ],
  heartOff: [
    ".kk...kk.",
    "k..k.k..k",
    "k.......k",
    "k.......k",
    ".k.....k.",
    "..k...k..",
    "...k.k...",
    "....k....",
  ],
  refresh: [
    "...kkkkk.k.",
    "..kcccccckk",
    ".kcckkkkcck",
    "kcck...kkkk",
    "kck........",
    "kck.....kck",
    "kkkk...kcck",
    "kcckkkkcck.",
    "kkcccccck..",
    ".k.kkkkk...",
  ],
  trash: [
    "...kkkk...",
    "kkkkkkkkkk",
    "kwwwwwwwwk",
    ".kgwgwgwk.",
    ".kgwgwgwk.",
    ".kgwgwgwk.",
    ".kgwgwgwk.",
    ".kkkkkkkk.",
  ],
  plus: [
    "..kkk..",
    "..kwk..",
    "kkkwkkk",
    "kwwwwwk",
    "kkkwkkk",
    "..kwk..",
    "..kkk..",
  ],
  check: [
    "......ww",
    ".....www",
    "ww..www.",
    "wwwwww..",
    ".wwww...",
    "..ww....",
  ],
  people: [
    "..kkk...kkk..",
    ".kwwwk.kwwwk.",
    ".kwwwk.kwwwk.",
    "..kkk...kkk..",
    ".kcccckcccck.",
    "kcccccccccck",
    "kcccccccccck",
    "kkkkkkkkkkkk",
  ],
  grip: [
    "kk.kk",
    "kk.kk",
    ".....",
    "kk.kk",
    "kk.kk",
    ".....",
    "kk.kk",
    "kk.kk",
  ],
  coin: [
    "..kkkk..",
    ".kyyyyk.",
    "kyywyyok",
    "kywyyyok",
    "kyyyyyok",
    "kyyyyyok",
    ".kyoook.",
    "..kkkk..",
  ],
};
function pixelIcon(name, palette, px = 3) {
  const rows = ICONS[name];
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  let rects = "";
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const col = palette[ch] || palette[ch.toLowerCase()];
    if (ch !== "." && col) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`;
  }));
  return `<svg width="${w * px}" height="${h * px}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}
document.querySelectorAll("[data-icon]").forEach(el => {
  const pal = JSON.parse(el.dataset.pal || "{}");
  el.innerHTML = pixelIcon(el.dataset.icon, Object.assign({}, window.PAL, pal), +(el.dataset.px || 3));
});
