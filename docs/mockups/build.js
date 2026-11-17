// Generates the three mockup pages from one shared layout so only the style differs.
const fs = require("fs");
const items = [
  { t: "Eggs (dozen)", by: "IZ", h: 2, mine: true },
  { t: "Sourdough bread", by: "JM", h: 0 },
  { t: "Bananas", by: "IZ", h: 1 },
  { t: "Hot sauce", by: "AL", h: 3, mine: true },
  { t: "Oat milk", by: "JM", h: 0 },
];
const done = [{ t: "Coffee beans", by: "AL" }, { t: "Paper towels", by: "IZ" }];

const body = (theme) => `
<div class="phone">
  <div class="status"><span>9:41</span><span>▮▮▮ ▰</span></div>
  <header class="top">
    <div class="logo">${theme.logo}</div>
    <div class="coins"><span data-icon="people" data-px="2"></span> 3</div>
  </header>
  <nav class="tabs">
    <button class="tab">MY LISTS</button>
    <button class="tab on">SHARED</button>
  </nav>
  <section class="win">
    <div class="win-head">
      <span class="star" data-icon="star" data-px="3"></span>
      <h1>GROCERIES</h1>
      <span class="refresh" data-icon="refresh" data-px="3"></span>
    </div>
    <div class="members"><span class="av a1">IZ</span><span class="av a2">JM</span><span class="av a3">AL</span><span class="live">● LIVE</span></div>
    <div class="add"><span class="add-in">Add an item…</span><span class="add-btn" data-icon="plus" data-px="3"></span></div>
    <ul class="items">
      ${items.map(i => `<li><span class="box"></span><span class="txt">${i.t}</span><span class="by">${i.by}</span><span class="heart">${`<span data-icon="${i.h ? "heart" : "heartOff"}" data-px="2"></span>`}${i.h ? `<b>${i.h}</b>` : ""}</span></li>`).join("")}
      <li class="sep">— GOT IT! (2) —</li>
      ${done.map(i => `<li class="done"><span class="box on"><span data-icon="check" data-px="2"></span></span><span class="txt">${i.t}</span><span class="by">${i.by}</span><span class="trash" data-icon="trash" data-px="2"></span></li>`).join("")}
    </ul>
    <div class="clear">
      <button class="btn b1">CLEAR GOT IT</button>
      <button class="btn b2">CLEAR ALL</button>
    </div>
  </section>
</div>
<div class="caption">${theme.caption}</div>`;

const shared = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#111;}
body{display:flex;flex-direction:column;align-items:center;padding:24px;font-family:'Pixelify Sans',monospace;}
.phone{width:390px;height:844px;border-radius:44px;overflow:hidden;position:relative;border:10px solid #000;}
.status{display:flex;justify-content:space-between;padding:14px 26px 4px;font-family:'Press Start 2P';font-size:10px}
.top{display:flex;justify-content:space-between;align-items:center;padding:8px 16px}
.logo{font-family:'Press Start 2P';line-height:1.25}
.coins{display:flex;align-items:center;gap:6px;font-family:'Press Start 2P';font-size:11px;padding:6px 8px}
.tabs{display:flex;gap:8px;padding:6px 16px}
.tab{flex:1;font-family:'Press Start 2P';font-size:11px;padding:12px 0;border:none;cursor:pointer}
.win{margin:10px 12px;padding:12px;position:relative}
.win-head{display:flex;align-items:center;gap:10px}
.win-head h1{flex:1;font-family:'Press Start 2P';font-size:16px}
.members{display:flex;gap:6px;align-items:center;margin:10px 0}
.av{width:26px;height:26px;display:grid;place-items:center;font-family:'Press Start 2P';font-size:8px}
.live{margin-left:auto;font-family:'Press Start 2P';font-size:8px}
.add{display:flex;gap:8px;margin-bottom:10px}
.add-in{flex:1;padding:10px;font-size:18px}
.add-btn{display:grid;place-items:center;width:44px}
.items{list-style:none}
.items li{display:flex;align-items:center;gap:10px;padding:8px 6px;font-size:20px}
.box{width:28px;height:28px;display:grid;place-items:center;flex:none}
.txt{flex:1}
.by{font-family:'Press Start 2P';font-size:7px;padding:4px}
.heart{display:flex;align-items:center;gap:3px;width:38px;font-family:'Press Start 2P';font-size:9px}
.trash{width:38px;display:flex}
.sep{justify-content:center;font-family:'Press Start 2P';font-size:9px !important;padding:12px 0 6px !important}
.done .txt{text-decoration:line-through;text-decoration-thickness:2px;opacity:.85}
.clear{display:flex;gap:8px;margin-top:12px}
.btn{flex:1;font-family:'Press Start 2P';font-size:9px;padding:12px 4px;border:none}
.caption{color:#ddd;font-family:'Press Start 2P';font-size:11px;margin-top:16px;text-align:center;line-height:1.6}
`;

const themes = {
  "a-quest-log": {
    logo: `<span style="font-size:15px;color:#ffd34a;text-shadow:3px 3px 0 #7a2a00">WE GOT</span><br><span style="font-size:20px;color:#fff;text-shadow:3px 3px 0 #3a3aa0">LISTS!</span>`,
    caption: "A · QUEST LOG<br>RPG menu windows, night sky",
    pal: { k: "#0b0b2a", y: "#ffd34a", o: "#e08a1e", w: "#ffffff", g: "#6d6da8", r: "#ff3f5e", c: "#6fe3ff" },
    css: `
.phone{background:#1a1650 repeating-linear-gradient(0deg,#1a1650 0 4px,#1d1958 4px 8px);color:#fff}
.phone::before{content:"";position:absolute;inset:0;background-image:radial-gradient(#fff 1px,transparent 1.5px),radial-gradient(#9cf 1px,transparent 1.5px);background-size:57px 61px,83px 79px;background-position:5px 9px,31px 40px;opacity:.5;pointer-events:none}
.coins{background:#0b0b2a;border:3px solid #fff;box-shadow:0 0 0 3px #0b0b2a}
.tab{background:#2b2a7a;color:#9b9bd8;border:3px solid #0b0b2a;box-shadow:inset 0 -4px 0 #1e1d5c}
.tab.on{background:#3d5cff;color:#fff;box-shadow:inset 0 4px 0 #7f95ff,inset 0 -4px 0 #2333aa;text-shadow:2px 2px 0 #0b0b2a}
.win{background:linear-gradient(#2433b8,#141a72);border:4px solid #fff;box-shadow:0 0 0 4px #0b0b2a,0 0 0 8px #8a8ad0,8px 12px 0 8px rgba(0,0,0,.35);border-radius:6px}
.win-head h1{color:#fff;text-shadow:3px 3px 0 #0b0b2a}
.av{border:2px solid #0b0b2a;color:#0b0b2a}.a1{background:#ffd34a}.a2{background:#6fe3ff}.a3{background:#ff8fd0}
.live{color:#7dff8a;text-shadow:0 0 6px #7dff8a}
.add-in{background:#0b0b2a;color:#8a8ad0;border:3px solid #8a8ad0}
.add-btn{background:#ffb000;border:3px solid #0b0b2a;box-shadow:inset -3px -3px 0 #c06800,inset 3px 3px 0 #ffe27a}
.items li{border-bottom:2px dashed #4a55c8}
.items li:first-child::before{content:"▶";color:#ffd34a;position:absolute;left:-2px;font-size:14px}
.items li:first-child{position:relative;background:rgba(255,255,255,.08)}
.box{background:#0b0b2a;border:3px solid #fff}.box.on{background:#2fbf4a}
.by{background:#0b0b2a;color:#9b9bd8}
.heart b{color:#ff8fa3}
.sep{color:#ffd34a;border:none !important}
.done{color:#7b80c8}
.b1{background:#2fbf4a;color:#fff;box-shadow:inset -3px -3px 0 #167a2a,inset 3px 3px 0 #8af59a;border:3px solid #0b0b2a;text-shadow:2px 2px 0 #0b0b2a}
.b2{background:#e8304f;color:#fff;box-shadow:inset -3px -3px 0 #8a1027,inset 3px 3px 0 #ff8fa3;border:3px solid #0b0b2a;text-shadow:2px 2px 0 #0b0b2a}
.status{color:#fff}
`,
  },
  "b-arcade-pop": {
    logo: `<span style="font-size:22px;color:#fff;-webkit-text-stroke:0;text-shadow:3px 0 #1b0033,-3px 0 #1b0033,0 3px #1b0033,0 -3px #1b0033,5px 6px 0 #ff2e88">WE GOT</span><br><span style="font-size:22px;color:#ffe600;text-shadow:3px 0 #1b0033,-3px 0 #1b0033,0 3px #1b0033,0 -3px #1b0033,5px 6px 0 #00d5ff">LISTS</span>`,
    caption: "B · ARCADE POP<br>Loud colours, checkerboard, chunky shadows",
    pal: { k: "#1b0033", y: "#ffe600", o: "#ff9a00", w: "#ffffff", g: "#c9b8e8", r: "#ff2e88", c: "#00d5ff" },
    css: `
.phone{background:conic-gradient(#ff5fb0 25%,#ff86c6 0 50%,#ff5fb0 0 75%,#ff86c6 0) 0 0/32px 32px;color:#1b0033}
.status{color:#1b0033}
.coins{background:#ffe600;border:4px solid #1b0033;box-shadow:4px 4px 0 #1b0033}
.tab{background:#fff;color:#1b0033;border:4px solid #1b0033;box-shadow:4px 4px 0 #1b0033}
.tab.on{background:#00d5ff;transform:translate(2px,2px);box-shadow:2px 2px 0 #1b0033}
.win{background:#fff;border:4px solid #1b0033;box-shadow:8px 8px 0 #1b0033}
.win-head{background:#7b2cff;margin:-12px -12px 0;padding:12px;border-bottom:4px solid #1b0033}
.win-head h1{color:#ffe600;text-shadow:3px 3px 0 #1b0033}
.av{border:3px solid #1b0033;color:#1b0033}.a1{background:#ffe600}.a2{background:#00d5ff}.a3{background:#7dff5a}
.live{color:#fff;background:#ff2e88;padding:4px 6px;border:3px solid #1b0033}
.add-in{background:#f3ecff;color:#8a78b0;border:4px solid #1b0033}
.add-btn{background:#7dff5a;border:4px solid #1b0033;box-shadow:3px 3px 0 #1b0033}
.items li{border-bottom:3px solid #eadcff}
.items li:nth-child(odd):not(.sep){background:#fbf7ff}
.box{background:#fff;border:4px solid #1b0033}.box.on{background:#7dff5a}
.by{background:#1b0033;color:#fff}
.heart b{color:#ff2e88}
.sep{color:#7b2cff;border:none !important;background:none !important}
.done{color:#a594c6}
.btn{border:4px solid #1b0033;box-shadow:4px 4px 0 #1b0033;color:#1b0033}
.b1{background:#7dff5a}.b2{background:#ff2e88;color:#fff}
`,
  },
  "c-meadow": {
    logo: `<span style="font-size:16px;color:#fff6d8;text-shadow:3px 3px 0 #2e4a12">WE GOT</span><br><span style="font-size:21px;color:#ffcf3a;text-shadow:3px 3px 0 #7a3b00">LISTS</span>`,
    caption: "C · MEADOW<br>Bright overworld + parchment scroll",
    pal: { k: "#3b2410", y: "#ffcf3a", o: "#d77a00", w: "#fffaf0", g: "#b49a6a", r: "#e8323e", c: "#38a8ff" },
    css: `
.phone{background:linear-gradient(#7cd0ff 0 120px,#5cc23c 120px);color:#3b2410;position:relative}
.phone::before{content:"";position:absolute;left:0;right:0;top:120px;bottom:0;background-image:radial-gradient(#4aa82e 2px,transparent 2.5px),radial-gradient(#8de060 2px,transparent 2.5px);background-size:24px 24px,36px 36px;background-position:0 0,12px 18px;pointer-events:none}
.phone>*{position:relative}
.status{color:#1d3a5c}
.coins{background:#fff6d8;border:3px solid #3b2410;box-shadow:inset -3px -3px 0 #d8c08a}
.tab{background:#b5742a;color:#ffe9b8;border:3px solid #3b2410;box-shadow:inset 3px 3px 0 #dc9a4c,inset -3px -3px 0 #7a4612}
.tab.on{background:#ffcf3a;color:#3b2410;box-shadow:inset 3px 3px 0 #fff0a0,inset -3px -3px 0 #c98a00}
.win{background:#fff3d2;border:4px solid #3b2410;box-shadow:inset 0 0 0 4px #e6cf98,6px 6px 0 rgba(30,60,10,.5);}
.win::before,.win::after{content:"";position:absolute;left:-10px;right:-10px;height:14px;background:#c98a3a;border:4px solid #3b2410;border-radius:8px}
.win::before{top:-14px}.win::after{bottom:-14px}
.win-head h1{color:#7a3b00;text-shadow:2px 2px 0 #ffcf3a}
.av{border:3px solid #3b2410;color:#3b2410}.a1{background:#ffcf3a}.a2{background:#7cd0ff}.a3{background:#ff9ec0}
.live{color:#2e8a12}
.add-in{background:#fffaf0;color:#b49a6a;border:3px solid #3b2410;box-shadow:inset 3px 3px 0 #e6cf98}
.add-btn{background:#38a8ff;border:3px solid #3b2410;box-shadow:inset -3px -3px 0 #1a6ab0,inset 3px 3px 0 #a8dcff}
.items li{border-bottom:2px dotted #c9ae78}
.box{background:#fffaf0;border:3px solid #3b2410}.box.on{background:#5cc23c}
.by{background:#e6cf98;color:#3b2410}
.heart b{color:#e8323e}
.sep{color:#2e8a12;border:none !important}
.done{color:#a89468}
.btn{border:3px solid #3b2410;color:#fff;text-shadow:2px 2px 0 #3b2410}
.b1{background:#5cc23c;box-shadow:inset 3px 3px 0 #a8f080,inset -3px -3px 0 #2e7a12}
.b2{background:#e8323e;box-shadow:inset 3px 3px 0 #ff9ea4,inset -3px -3px 0 #8a1018}
`,
  },
};

const fonts = `<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;600&display=swap" rel="stylesheet">`;
for (const [name, th] of Object.entries(themes)) {
  fs.writeFileSync(`${name}.html`, `<!doctype html><html><head><meta charset="utf-8"><title>We Got Lists mockup ${name}</title>${fonts}<style>${shared}${th.css}</style></head><body>${body(th)}<script>window.PAL=${JSON.stringify(th.pal)}</script><script src="pixel-icons.js"></script></body></html>`);
}
console.log("ok");
