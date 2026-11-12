// Draws the gamefowl explorer as layered SVG. Bird faces left in a 420x400 box.
// Every tappable part carries data-id matching an entry in STRUCTURES.
(function () {
  const P = (id, d, extra = "") => {
    const m = extra.match(/class="([^"]*)"/);
    const cls = m ? m[1].replace(/\bpart\b/, "").trim() : "";
    return `<path class="part ${cls}" data-id="${id}" d="${d}" ${extra.replace(/class="[^"]*"/, "")}/>`;
  };

  // ---------- shared silhouette (used as ghost under skeleton/muscles) ----------
  const SIL = {
    farLeg: "M222,282 L230,284 L226,342 L218,342 Z",
    farToes: "M222,341 L192,346 M222,342 L200,352 M224,342 L240,346",
    neck: "M100,90 C104,122 118,150 140,172 L208,168 C192,138 164,108 152,84 C146,70 136,62 124,62 Z",
    body: "M140,170 C120,200 128,242 172,259 C210,273 252,262 280,232 C296,214 298,190 284,176 C260,160 225,158 205,165 Z",
    head: "M96,74 C96,62 108,58 120,60 C130,62 134,72 132,82 C130,92 120,96 108,94 C100,92 96,84 96,74 Z",
    beak: "M98,72 C90,72 82,76 79,84 C86,82 92,84 98,86 Z",
    thigh: "M214,236 C208,260 220,284 240,286 C256,284 260,262 254,236 Z",
    shank: "M235,286 L246,288 L242,345 L232,345 Z",
    toes: "M236,344 L198,350 M236,345 L208,360 M240,345 L258,350",
    tail: "M282,176 C298,150 308,122 314,94 L328,98 C326,128 316,160 298,186 Z"
  };
  const sickle1 = "M286,172 C300,120 330,86 352,96 C372,106 378,140 372,182";
  const sickle2 = "M290,176 C306,132 326,108 344,114 C360,120 364,146 360,176";
  const covert = "M288,180 C302,150 316,136 330,140 C342,144 346,160 344,182";

  function ghost() {
    return `<g class="ghost">
      <path d="${SIL.farLeg}"/><path d="${SIL.tail}"/><path d="${sickle1}" class="g-stroke"/><path d="${sickle2}" class="g-stroke"/>
      <path d="${SIL.neck}"/><path d="${SIL.body}"/><path d="${SIL.head}"/><path d="${SIL.beak}"/>
      <path d="${SIL.thigh}"/><path d="${SIL.shank}"/><path d="${SIL.toes}" class="g-stroke"/>
    </g>`;
  }

  // ---------- EXTERIOR ----------
  function exterior() {
    return `<g class="sys-exterior">
      <path class="shade" d="${SIL.farLeg}"/><path class="shade-stroke" d="${SIL.farToes}"/>
      ${P("tail", SIL.tail, 'fill="#14231f"')}
      ${P("sickles", covert, 'class="part stroke" stroke="#1d3a33" stroke-width="7"')}
      ${P("sickles", sickle2, 'class="part stroke" stroke="#1a302b" stroke-width="8"')}
      ${P("sickles", sickle1, 'class="part stroke" stroke="#22413a" stroke-width="9"')}
      ${P("breast", SIL.body, 'fill="#15151a"')}
      ${P("thigh", SIL.thigh, 'fill="#1b1b20"')}
      ${P("saddle", "M205,165 C232,150 268,152 292,170 C288,188 262,194 240,190 C222,186 208,178 205,165 Z", 'fill="#b5532a"')}
      ${P("wingbow", "M166,182 C190,170 238,172 262,184 C250,192 220,192 196,192 C180,192 168,190 166,182 Z", 'fill="#8e2f1c"')}
      ${P("wingbar", "M168,190 C192,194 238,194 266,188 C272,194 274,200 272,204 C240,208 200,206 176,200 Z", 'fill="#1c2b35"')}
      ${P("wingbay", "M176,200 C206,207 244,208 272,204 C286,210 292,218 288,224 C262,228 220,224 194,216 C182,212 176,206 176,200 Z", 'fill="#7a4a2a"')}
      ${P("hackles", SIL.neck, 'fill="#d07a2e"')}
      <path class="hackle-lines" d="M118,80 C126,110 140,140 160,166 M130,72 C142,104 158,132 182,162 M142,78 C154,104 170,130 196,164"/>
      ${P("hock", "M240,288 m-8,0 a8,7 0 1,0 16,0 a8,7 0 1,0 -16,0", 'fill="#d4bd6e"')}
      ${P("shankx", SIL.shank, 'fill="#cdb460"')}
      ${P("spur", "M244,316 L266,311 L244,326 Z", 'fill="#e8dcb4"')}
      ${P("foot", SIL.toes, 'class="part stroke" stroke="#cdb460" stroke-width="5"')}
      ${P("comb", "M100,64 C100,52 106,50 108,58 C110,48 116,46 117,56 C120,46 126,47 126,57 C130,52 134,56 130,64 C122,62 108,62 100,64 Z", 'fill="#c8262c"')}
      <path class="part" data-id="beak" d="${SIL.beak}" fill="#d9c27a"/>
      <path d="${SIL.head}" fill="#c8302f"/>
      ${P("wattles", "M98,88 C96,96 98,106 104,108 C110,106 112,96 108,90 Z", 'fill="#b8202a"')}
      ${P("earlobe", "M120,84 m-5,0 a5,6 0 1,0 10,0 a5,6 0 1,0 -10,0", 'fill="#d33a36"')}
      ${P("eye", "M108,75 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0", 'fill="#f0a020" stroke="#111" stroke-width="1"')}
      <circle cx="108" cy="75" r="1.6" fill="#111" pointer-events="none"/>
    </g>`;
  }

  // ---------- SKELETON ----------
  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [0, 1].map(i => u*u*u*p0[i] + 3*u*u*t*p1[i] + 3*u*t*t*p2[i] + t*t*t*p3[i]);
  }
  function neckVertebrae() {
    const p0 = [124, 92], p1 = [158, 112], p2 = [126, 150], p3 = [190, 170];
    let s = "";
    for (let i = 0; i < 14; i++) {
      const t = (i + 0.5) / 14, a = bezier(p0, p1, p2, p3, t - 0.02), b = bezier(p0, p1, p2, p3, t + 0.02);
      const [x, y] = bezier(p0, p1, p2, p3, t);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      s += `<rect x="${(x - 3.6).toFixed(1)}" y="${(y - 2.6).toFixed(1)}" width="7.2" height="5.2" rx="1.6" transform="rotate(${ang.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return `<g class="part bone" data-id="cervical">${s}<path d="M124,92 C158,112 126,150 190,170" class="hit"/></g>`;
  }
  function skeleton() {
    const ribs = [0, 1, 2, 3, 4, 5].map(i => {
      const x = 196 + i * 9;
      return `M${x},170 C${x - 10},190 ${x - 8 + i},212 ${x - 14 + i * 2},${226 + i * 3}`;
    }).join(" ");
    const unc = [0, 1, 2, 3, 4].map(i => { const x = 192 + i * 9; return `M${x},188 l9,4`; }).join(" ");
    return `${ghost()}<g class="sys-skeleton">
      <path class="bone-far" d="M226,248 L222,284 L220,342 M220,342 L194,347 M220,342 L240,346"/>
      ${P("ribs", ribs + " " + unc, 'class="part bone-stroke" stroke-width="3"')}
      ${P("keel", "M156,204 C160,236 196,262 252,244 C238,252 214,256 196,250 C176,242 162,226 156,204 Z M160,212 C176,236 210,248 246,242 L250,236 C214,240 182,230 166,206 Z", 'class="part bone"')}
      ${P("scapula", "M184,170 C204,166 226,164 246,166 L246,170 C226,170 206,172 186,176 Z", 'class="part bone"')}
      ${P("notarium", "M190,166 L224,162 L226,170 L192,174 Z", 'class="part bone"')}
      ${P("synsacrum", "M222,160 C248,154 272,160 286,170 C282,186 276,200 268,210 C258,198 248,190 240,186 C232,180 226,174 222,170 Z", 'class="part bone"')}
      <path class="hole" d="M248,178 m-6,0 a6,5 0 1,0 12,0 a6,5 0 1,0 -12,0" pointer-events="none"/>
      ${P("pygostyle", "M284,170 L292,166 L298,162 L304,148 L312,150 L306,170 L296,176 Z", 'class="part bone"')}
      ${P("coracoid", "M178,178 L186,180 L168,208 L160,206 Z", 'class="part bone"')}
      ${P("furcula", "M176,176 C164,188 158,198 156,206 C162,198 170,188 182,178 Z", 'class="part bone furc"')}
      ${P("humerus", "M182,180 L232,196 L230,202 L180,187 Z", 'class="part bone"')}
      ${P("forearm", "M232,198 L192,206 L192,212 L234,203 Z M232,202 L194,215", 'class="part bone"')}
      ${P("hand", "M190,210 L256,216 L262,222 L254,221 L192,214 Z", 'class="part bone"')}
      ${P("femur", "M246,212 L254,216 L232,250 L224,246 Z", 'class="part bone"')}
      ${P("skull", "M96,76 C96,62 110,58 122,61 C132,64 134,74 132,84 C128,94 116,96 106,93 C100,90 96,84 96,76 Z M98,73 C90,73 82,77 79,84 C86,82 92,84 98,86 Z", 'class="part bone"')}
      <path class="hole" d="M109,75 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0" pointer-events="none"/>
      ${neckVertebrae()}
      ${P("tibiotarsus", "M226,246 L234,248 L245,286 L237,289 Z", 'class="part bone"')}
      ${P("fibula", "M222,252 L226,252 L230,272 Z", 'class="part bone"')}
      ${P("shank", "M237,289 L245,288 L241,344 L234,344 Z M244,318 L258,314 L244,324 Z", 'class="part bone"')}
      ${P("toes", "M236,345 L224,346 M222,346 L212,347 M210,347 L200,349 M236,346 L226,352 M224,353 L214,357 M238,346 L246,348 M248,348 L256,350", 'class="part bone-stroke" stroke-width="4"')}
      <circle class="bone joint" cx="229" cy="248" r="3.4" pointer-events="none"/>
    </g>`;
  }

  // ---------- MUSCLES ----------
  const MUSCLES = {
    superficial: [
      ["complexus", "M126,64 C140,72 152,90 166,112 L156,118 C144,98 132,82 120,72 Z"],
      ["latissimus", "M194,166 C214,158 240,160 254,168 L244,178 C226,174 208,176 196,180 Z"],
      ["deltoideus", "M180,170 C196,166 208,176 204,188 C194,194 180,190 176,182 Z"],
      ["pectoralis", "M150,178 C132,206 142,242 180,254 C212,264 242,252 252,238 C236,222 210,202 184,184 C172,178 160,176 150,178 Z"],
      ["iliotibialis", "M232,204 C262,198 276,224 262,250 L232,256 C220,240 220,220 232,204 Z"],
      ["gastrocnemius", "M230,250 C252,252 254,272 244,288 C236,282 228,268 230,250 Z"]
    ],
    intermediate: [
      ["biceps", "M184,184 L232,198 L230,206 L184,194 Z"],
      ["triceps", "M186,176 C204,176 226,184 240,194 L232,198 C218,190 202,186 184,184 Z"],
      ["iliofibularis", "M236,212 C258,218 262,240 248,258 L232,252 C228,238 230,224 236,212 Z"],
      ["fibularis", "M224,252 C220,266 226,280 238,286 L234,262 C232,256 228,252 224,252 Z"]
    ],
    deep: [
      ["supracoracoideus", "M158,198 C164,224 188,240 216,242 C200,226 182,208 170,192 Z"],
      ["caudofemoralis", "M302,166 C286,186 262,206 250,216 L244,208 C262,194 282,176 296,160 Z"],
      ["tibialis", "M222,252 C220,266 228,278 236,288 L240,286 C232,272 230,262 228,250 Z"],
      ["flexors", "M244,292 L248,292 L244,342 L240,342 Z"]
    ]
  };
  const ORDER = ["superficial", "intermediate", "deep"];
  function muscles(layer) {
    const idx = ORDER.indexOf(layer);
    let out = ghost() + `<g class="bones-under">${skeleton().replace(/class="part /g, 'class="').replace(/data-id="[^"]*"/g, "")}</g>`;
    // deepest first so shallower layers paint on top
    for (let i = ORDER.length - 1; i >= idx; i--) {
      const cls = i === idx ? "muscle active-layer" : "muscle under-layer";
      out += `<g class="${cls}">` + MUSCLES[ORDER[i]].map(([id, d]) =>
        i === idx ? `<path class="part muscle-part" data-id="${id}" d="${d}"/>` : `<path d="${d}"/>`).join("") + "</g>";
    }
    return out;
  }

  window.BirdSVG = {
    render(system, layer) {
      const inner = system === "skeleton" ? skeleton() : system === "muscles" ? muscles(layer) : exterior();
      return `<svg viewBox="66 40 324 322" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gamefowl ${system}">
        <defs><radialGradient id="floor" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#c9a24a" stop-opacity=".18"/><stop offset="1" stop-color="#c9a24a" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="230" cy="352" rx="90" ry="12" fill="url(#floor)"/>
        ${inner}</svg>`;
    },
    // small decorative skeleton for the home card
    mini() { return this.render("skeleton"); }
  };
})();
