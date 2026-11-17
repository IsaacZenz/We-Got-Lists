// Animated meadow critters for the mockup: cows wander the grass, and every so often
// a pterodactyl swoops down and carries one off. Original sprites, drawn as pixel grids.
(() => {
  const PAL = { k: "#3b2410", w: "#fffaf0", s: "#3b2410", p: "#ff9ec0", h: "#e6cf98",
                b: "#8a4fbf", m: "#c78ae8", y: "#ffcf3a", c: "#e8323e", g: "#4aa82e" };
  const COW_BODY = [
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
  const COW_LEGS = [
    ["..kwk....kwk.......", "..kkk....kkk......."],
    [".kwk......kwk......", ".kk.......kkk......"],
  ];
  const PTERO = [
    [ // wings up
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
    [ // wings down
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
  const PX = 3;
  function draw(ctx, rows, x, y, flip) {
    const w = Math.max(...rows.map(r => r.length));
    rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === ".") return;
      ctx.fillStyle = PAL[ch];
      const cx = flip ? (w - 1 - rx) : rx;
      ctx.fillRect(Math.round(x) + cx * PX, Math.round(y) + ry * PX, PX, PX);
    }));
  }
  const cow = (ctx, x, y, flip, step, graze) => {
    const body = graze ? COW_BODY.map((r, i) => i < 2 ? "" : r) : COW_BODY;
    draw(ctx, body.concat(COW_LEGS[step]), x, y + (graze ? 4 : 0), flip);
  };

  const phone = document.querySelector(".phone");
  const cv = document.createElement("canvas");
  cv.className = "critters";
  phone.prepend(cv);
  const W = phone.clientWidth, H = phone.clientHeight;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const LOOP = 14;
  const scene = phone.querySelector(".scene");
  const HORIZON = scene.offsetTop + 30;           // where sky meets grass
  phone.style.setProperty("--h", HORIZON + "px");
  const G = scene.offsetTop + scene.offsetHeight - 4; // cows' feet line
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = u => u * u * (3 - 2 * u);
  const COWH = 11 * PX;

  // Cow 0 is the unlucky one: walks in from the left, gets grabbed at t=7, a new one wanders in at t=11.
  const cow0x = t => -60 + 24 * (((t - 11) % LOOP + LOOP) % LOOP);
  const GRAB_T = 7;
  const grab = { x: cow0x(GRAB_T), y: G - COWH - 4 };
  const KEYS = [[3, W + 40, 6], [4.6, 230, 24], [5.4, 120, 4], [6.5, grab.x + 40, grab.y - 50],
                [GRAB_T, grab.x - 2, grab.y - 26], [9.6, -90, -60]];
  function pteroPos(t) {
    if (t < KEYS[0][0] || t > KEYS[KEYS.length - 1][0]) return null;
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [t0, x0, y0] = KEYS[i], [t1, x1, y1] = KEYS[i + 1];
      if (t <= t1) { const u = ease((t - t0) / (t1 - t0)); return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) }; }
    }
  }
  function cloud(x, y) {
    ctx.fillStyle = "#ffffff";
    [[0, 6, 36, 9], [6, 0, 18, 9], [20, 3, 12, 6]].forEach(([a, b, w, h]) => ctx.fillRect(x + a * 2, y + b * 2, w * 2, h * 2));
  }
  function render(t) {
    t = ((t % LOOP) + LOOP) % LOOP;
    ctx.clearRect(0, 0, W, H);
    cloud(((t * 6) % (W + 160)) - 80, 18);
    cloud(W - ((t * 4 + 120) % (W + 160)), 50);
    const step = Math.floor(t * 4) % 2;
    // back to front: grazing cow, unlucky cow, wandering cow
    cow(ctx, 270 + Math.sin(t * 0.5) * 14, G - COWH - 14, Math.cos(t * 0.5) < 0, Math.floor(t * 2) % 2, Math.floor(t / 2.5) % 2 === 0);
    if (!(t >= GRAB_T && t < 11)) cow(ctx, cow0x(t), grab.y + 4, true, step, false);
    cow(ctx, W + 20 - ((t * 16) % (W + 100)), G - COWH + 2, false, (step + 1) % 2, false);
    const p = pteroPos(t);
    if (p) {
      const prev = pteroPos(Math.max(KEYS[0][0], t - 0.05)) || p;
      const flip = p.x > prev.x;                   // sprite faces left; flip when flying right
      if (t >= GRAB_T) cow(ctx, p.x + 4, p.y + 24, true, 0, false);
      draw(ctx, PTERO[Math.floor(t * 5) % 2], p.x, p.y, flip);
    }
  }
  window.renderCritters = render;
  if (location.hash !== "#capture") {
    const start = performance.now();
    const loop = now => { render((now - start) / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
})();
