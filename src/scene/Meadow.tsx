import { useEffect, useRef } from "react";
import { MEADOW, sceneAt, type Critter } from "./meadow";
import { PALETTE, type Grid } from "./sprites";

/** The animated meadow strip: cows and chickens wander; a pterodactyl raids now and then. */
export function Meadow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    // Remember each raid's victim so it doesn't change mid-flight.
    const victims = new Map<number, Critter>();
    const pick = (cycle: number) => {
      if (!victims.has(cycle)) victims.set(cycle, Math.random() < 0.5 ? "cow" : "chicken");
      return victims.get(cycle)!;
    };
    const draw = (g: Grid, x: number, y: number, flip: boolean) => {
      const px = MEADOW.px;
      const w = Math.max(...g.map(r => r.length));
      g.forEach((row, ry) => [...row].forEach((ch, rx) => {
        if (ch === ".") return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(Math.round(x) + (flip ? w - 1 - rx : rx) * px, Math.round(y) + ry * px, px, px);
      }));
    };
    const cloud = (x: number, y: number) => {
      ctx.fillStyle = "#ffffff";
      [[0, 6, 36, 9], [6, 0, 18, 9], [20, 3, 12, 6]].forEach(([a, b, w, h]) => ctx.fillRect(x + a * 2, y + b * 2, w * 2, h * 2));
    };
    // Start mid-cycle so there's something to see right away.
    const start = performance.now() - 4000;
    let frame = 0;
    const tick = (now: number) => {
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const T = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      cloud(((T * 6) % (W + 160)) - 80, 10);
      cloud(W - ((T * 4 + 120) % (W + 160)), 38);
      for (const s of sceneAt(T, { width: W, ground: H - 4 }, pick)) draw(s.grid, s.x, s.y, s.flip);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} className="meadow-canvas" aria-hidden="true" />;
}
