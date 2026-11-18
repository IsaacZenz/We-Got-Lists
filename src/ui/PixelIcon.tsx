// Small pixel-art UI icons drawn as SVG squares. Original art.
const ICONS: Record<string, string[]> = {
  star: ["....kk....", "...kyyk...", "...kyyk...", "kkkkyykkkk", "kyyyywyyyk", ".kyyyyyyk.", "..kyyyyk..", ".kyyookyk.", ".kyok.koyk", ".kkk...kkk"],
  people: ["..kkk...kkk..", ".kwwwk.kwwwk.", ".kwwwk.kwwwk.", "..kkk...kkk..", ".kcccckcccck.", "kcccccccccck", "kcccccccccck", "kkkkkkkkkkkk"],
};
const COLORS: Record<string, string> = { k: "#3b2410", y: "#ffcf3a", o: "#d77a00", w: "#fffaf0", c: "#38a8ff" };

export function PixelIcon({ name, px = 3 }: { name: keyof typeof ICONS; px?: number }) {
  const rows = ICONS[name];
  const w = Math.max(...rows.map(r => r.length));
  return (
    <svg width={w * px} height={rows.length * px} viewBox={`0 0 ${w} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((ch, x) => ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch]} />))}
    </svg>
  );
}
