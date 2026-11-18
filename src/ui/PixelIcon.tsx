// Small pixel-art UI icons drawn as SVG squares. Original art.
const ICONS = {
  star: ["....kk....", "...kyyk...", "...kyyk...", "kkkkyykkkk", "kyyyywyyyk", ".kyyyyyyk.", "..kyyyyk..", ".kyyookyk.", ".kyok.koyk", ".kkk...kkk"],
  starOff: ["....kk....", "...kggk...", "...kggk...", "kkkkggkkkk", "kggggggggk", ".kggggggk.", "..kggggk..", ".kggkkggk.", ".kgk..kgk.", ".kk....kk."],
  people: ["..kkk...kkk..", ".kwwwk.kwwwk.", ".kwwwk.kwwwk.", "..kkk...kkk..", ".kcccckcccck.", "kcccccccccck", "kcccccccccck", "kkkkkkkkkkkk"],
  trash: ["...kkkk...", "kkkkkkkkkk", "kwwwwwwwwk", ".kgwgwgwk.", ".kgwgwgwk.", ".kgwgwgwk.", ".kgwgwgwk.", ".kkkkkkkk."],
  grip: ["gg.gg", "gg.gg", ".....", "gg.gg", "gg.gg", ".....", "gg.gg", "gg.gg"],
  check: ["......ww", ".....www", "ww..www.", "wwwwww..", ".wwww...", "..ww...."],
  plus: ["..kkk..", "..kwk..", "kkkwkkk", "kwwwwwk", "kkkwkkk", "..kwk..", "..kkk.."],
  back: ["....kk", "...kyk", "..kyyk", ".kyyyk", "kyyyyk", ".kyyyk", "..kyyk", "...kyk", "....kk"],
  dots: ["kk.kk.kk", "kk.kk.kk"],
  refresh: ["...kkkkk.k.", "..kcccccckk", ".kcckkkkcck", "kcck...kkkk", "kck........", "kck.....kck", "kkkk...kcck", "kcckkkkcck.", "kkcccccck..", ".k.kkkkk..."],
  heart: [".kk...kk.", "krrk.krrk", "krwrkrrrk", "krrrrrrrk", ".krrrrrk.", "..krrrk..", "...krk...", "....k...."],
  heartPink: [".kk...kk.", "kppk.kppk", "kpppkpppk", "kpppppppk", ".kpppppk.", "..kpppk..", "...kpk...", "....k...."],
  heartOff: [".kk...kk.", "k..k.k..k", "k.......k", "k.......k", ".k.....k.", "..k...k..", "...k.k...", "....k...."],
} as const;
const COLORS: Record<string, string> = { k: "#3b2410", y: "#ffcf3a", o: "#d77a00", w: "#fffaf0", c: "#38a8ff", g: "#b49a6a", r: "#e8323e", p: "#ffc2cc" };

export type IconName = keyof typeof ICONS;

export function PixelIcon({ name, px = 3 }: { name: IconName; px?: number }) {
  const rows: readonly string[] = ICONS[name];
  const w = Math.max(...rows.map(r => r.length));
  return (
    <svg width={w * px} height={rows.length * px} viewBox={`0 0 ${w} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((ch, x) => ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch]} />))}
    </svg>
  );
}
