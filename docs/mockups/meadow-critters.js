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
  const CHICK_BODY = [
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
  const CHICK_LEGS = [["...y.y.....", "..yy.yy...."], ["....yy.....", "...yy.y...."]];
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
  // Sprites face right, so flip them when they walk left.
  const chicken = (ctx, x, y, flip, step, peck) => {
    const body = peck ? CHICK_BODY.map((r, i) => i < 3 ? "" : i === 3 ? "k....kwwwyy" : r) : CHICK_BODY;
    draw(ctx, body.concat(CHICK_LEGS[step]), x, y + (peck ? 2 : 0), flip);
  };
  const critter = (type, ...a) => (type === "cow" ? cow : chicken)(ctx, ...a);
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

  // The "unlucky" critter walks in from the left; at t=7 the pterodactyl grabs it; a new one wanders in at t=11.
  // Each loop the pterodactyl picks a cow or a chicken (alternating here so the GIF shows both;
  // the real app will pick at random).
  const victimX = t => -60 + 24 * (((t - 11) % LOOP + LOOP) % LOOP);
  const GRAB_T = 7;
  const grab = { x: victimX(GRAB_T), y: G - COWH - 4 };
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
  function render(T) {
    const loopNo = Math.floor(T / LOOP);
    const t = ((T % LOOP) + LOOP) % LOOP;
    // The victim that gets grabbed this loop; after t=11 the next loop's victim is walking in.
    const victim = (n) => (n % 2 === 0 ? "cow" : "chicken");
    const vNow = victim(t >= 11 ? loopNo + 1 : loopNo);
    ctx.clearRect(0, 0, W, H);
    cloud(((T * 6) % (W + 160)) - 80, 18);
    cloud(W - ((T * 4 + 120) % (W + 160)), 50);
    const step = Math.floor(T * 4) % 2;
    // back row: grazing cow drifting back and forth, two chickens pecking about
    const gx = 270 + Math.sin(T * 0.5) * 14, gdir = Math.cos(T * 0.5) < 0;
    cow(ctx, gx, G - COWH - 14, gdir, Math.floor(T * 2) % 2, Math.floor(T / 2.5) % 2 === 0);
    const h1 = 60 + Math.sin(T * 0.8) * 30;
    chicken(ctx, h1, G - 9 * PX - 20, Math.cos(T * 0.8) < 0, Math.floor(T * 5) % 2, Math.floor(T * 1.3) % 3 === 0);
    // the victim walks right (faces right, no flip)
    const vy = vNow === "cow" ? grab.y + 4 : grab.y + 14;
    if (!(t >= GRAB_T && t < 11)) critter(vNow, victimX(t), vy, false, step, false);
    // front: a cow wandering left (flipped so it faces left), and a chicken trotting right
    cow(ctx, W + 20 - ((T * 16) % (W + 100)), G - COWH + 2, true, (step + 1) % 2, false);
    chicken(ctx, ((T * 30 + 200) % (W + 80)) - 40, G - 9 * PX + 4, false, Math.floor(T * 6) % 2, false);
    const p = pteroPos(t);
    if (p) {
      const prev = pteroPos(Math.max(KEYS[0][0], t - 0.05)) || p;
      const flip = p.x > prev.x;                   // ptero sprite faces left; flip when flying right
      if (t >= GRAB_T) critter(victim(loopNo), p.x + 4, p.y + 24, true, 0, false);
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
