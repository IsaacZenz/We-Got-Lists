// The meadow scene as pure maths: given a time, where is every critter?
// No drawing here, so it can be unit-tested. Meadow.tsx turns this into pixels.
import { chickenGrid, cowGrid, PTERO, type Grid } from "./sprites";

/** Tuning numbers for the scene. */
export const MEADOW = {
  px: 3,                 // size of one sprite pixel on screen
  cycleSeconds: 20,      // one pterodactyl raid every this many seconds
  grabAt: 13,            // seconds into a cycle when the grab happens
  respawnAt: 17,         // seconds into a cycle when a new victim wanders in
  victimSpeed: 15,       // pixels per second
};

export type Critter = "cow" | "chicken";
export interface Sprite { grid: Grid; x: number; y: number; flip: boolean }
export interface SceneSize { width: number; ground: number } // ground = y of the critters' feet

/** Picks who gets taken in a given cycle. The app passes a random picker. */
export type VictimPicker = (cycle: number) => Critter;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const ease = (u: number) => u * u * (3 - 2 * u);
const mod = (a: number, n: number) => ((a % n) + n) % n;

function victimX(t: number) {
  const { cycleSeconds, respawnAt, victimSpeed } = MEADOW;
  return -60 + victimSpeed * mod(t - respawnAt, cycleSeconds);
}

/** Where the pterodactyl is at cycle-time t, or null when it is off stage. */
export function pteroAt(t: number, size: SceneSize): { x: number; y: number; flip: boolean } | null {
  const { grabAt, px } = MEADOW;
  const grabX = victimX(grabAt);
  const grabY = size.ground - 11 * px - 4;
  const keys: [number, number, number][] = [
    [grabAt - 4, size.width + 40, 6],
    [grabAt - 2.4, size.width * 0.6, 24],
    [grabAt - 1.6, size.width * 0.3, 4],
    [grabAt - 0.5, grabX + 40, grabY - 50],
    [grabAt, grabX - 2, grabY - 26],
    [grabAt + 2.6, -90, -60],
  ];
  const pos = (tt: number) => {
    if (tt < keys[0][0] || tt > keys[keys.length - 1][0]) return null;
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, x0, y0] = keys[i];
      const [t1, x1, y1] = keys[i + 1];
      if (tt <= t1) {
        const u = ease((tt - t0) / (t1 - t0));
        return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) };
      }
    }
    return null;
  };
  const p = pos(t);
  if (!p) return null;
  const before = pos(Math.max(keys[0][0], t - 0.05)) ?? p;
  return { ...p, flip: p.x > before.x }; // the sprite faces left; mirror it when flying right
}

function critterGrid(kind: Critter, step: number, head = false): Grid {
  return kind === "cow" ? cowGrid(step, head) : chickenGrid(step, head);
}

/** Every sprite to draw at time T (seconds since the scene started), back to front. */
export function sceneAt(T: number, size: SceneSize, pickVictim: VictimPicker): Sprite[] {
  const { px, cycleSeconds, grabAt, respawnAt } = MEADOW;
  const { width: W, ground: G } = size;
  const cycle = Math.floor(T / cycleSeconds);
  const t = mod(T, cycleSeconds);
  const step = Math.floor(T * 4) % 2;
  const cowH = 11 * px;
  const out: Sprite[] = [];

  // Back row: a grazing cow shuffling back and forth, and a pecking chicken.
  out.push({ grid: cowGrid(Math.floor(T * 2), Math.floor(T / 2.5) % 2 === 0), x: W * 0.68 + Math.sin(T * 0.5) * 14, y: G - cowH - 14, flip: Math.cos(T * 0.5) < 0 });
  out.push({ grid: chickenGrid(Math.floor(T * 5), Math.floor(T * 1.3) % 3 === 0), x: W * 0.15 + Math.sin(T * 0.8) * 30, y: G - 9 * px - 20, flip: Math.cos(T * 0.8) < 0 });

  // The victim walks right. After respawnAt, the next cycle's victim is already walking in.
  const walking = t >= respawnAt ? pickVictim(cycle + 1) : pickVictim(cycle);
  const vy = (k: Critter) => (k === "cow" ? G - cowH : G - cowH + 10);
  if (!(t >= grabAt && t < respawnAt)) out.push({ grid: critterGrid(walking, step), x: victimX(t), y: vy(walking), flip: false });

  // Front row: a cow wandering left (so mirrored) and a chicken trotting right.
  out.push({ grid: cowGrid(step + 1), x: W + 20 - mod(T * 16, W + 100), y: G - cowH + 6, flip: true });
  out.push({ grid: chickenGrid(Math.floor(T * 6)), x: mod(T * 30 + 200, W + 80) - 40, y: G - 9 * px + 8, flip: false });

  const p = pteroAt(t, size);
  if (p) {
    if (t >= grabAt) out.push({ grid: critterGrid(pickVictim(cycle), 0), x: p.x + 4, y: p.y + 24, flip: true });
    out.push({ grid: PTERO[Math.floor(t * 5) % 2], x: p.x, y: p.y, flip: p.flip });
  }
  return out;
}
