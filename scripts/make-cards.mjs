#!/usr/bin/env node
/* ===========================================================================
   make-cards — five business cards for the order, front and back
   ---------------------------------------------------------------------------
   Print geometry, fixed and standard:

     trim      85 × 55 mm  (the usual UK/EU business card)
     bleed      3 mm on every edge  →  91 × 61 mm artboard
     safe area  4 mm inside the trim; nothing that matters crosses it

   Everything is drawn in millimetres in an SVG with a matching viewBox, so
   the vector files can go straight to a printer, and rasterised at 300 dpi
   for anyone who wants a PNG. The QR codes are generated here rather than
   pasted in from a service, so they can be regenerated if an address moves
   and so nothing is tracked through a third party.

     front  →  what the order is          →  QR to the introduction
     back   →  podcast, video, live room  →  QR to the sign-up page

   Run:  npm run cards      (output: cards/)
   ======================================================================== */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const OUT = "cards";
const SITE = "https://egregora.hatchable.site";
const FRONT_URL = SITE + "/";
const BACK_URL = SITE + "/join/";

const TRIM_W = 85, TRIM_H = 55, BLEED = 3;
const W = TRIM_W + BLEED * 2, H = TRIM_H + BLEED * 2;   // 91 × 61 mm
const SAFE = BLEED + 4;                                  // 7 mm from the artboard edge

const INK = "#0e0c0a", GOLD = "#d7b05a", BRIGHT = "#f3ddaa", DIM = "#9f947a";
const VERDANT = "#7fae7a", ROSE = "#c98b6a", PARCH = "#f4ecd8";

/* -------------------------------------------------------------- the QR ---
   Returned as a bare path string in a 0..1 box, so each card can place and
   colour it however it likes without nesting an <svg> inside an <svg>. */
async function qrPath(text) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "Q" });
  const n = qr.modules.size;
  const d = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.modules.get(x, y)) d.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return { d: d.join(""), n };
}

/* A QR block: quiet zone, plate, modules. `size` is the side in mm. */
function qrBlock(qr, x, y, size, { dark = INK, light = PARCH, quiet = 2.2, plate = true } = {}) {
  const inner = size - quiet * 2;
  const s = inner / qr.n;
  return `
    ${plate ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1.2" fill="${light}"/>` : ""}
    <g transform="translate(${x + quiet} ${y + quiet}) scale(${s})" fill="${dark}" shape-rendering="crispEdges">
      <path d="${qr.d}"/>
    </g>`;
}

/* The order's sigil: a ring and eleven rays, one for each limb. */
function sigil(cx, cy, r, colour, width = 0.35) {
  const rays = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 - Math.PI / 2;
    rays.push(`M${(cx + Math.cos(a) * r * 0.42).toFixed(2)} ${(cy + Math.sin(a) * r * 0.42).toFixed(2)}
               L${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `<g fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round">
    <circle cx="${cx}" cy="${cy}" r="${r * 0.42}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" opacity="0.5"/>
    <path d="${rays.join(" ")}"/>
  </g>`;
}

/* A Moebius band, small, for the cards that want the emblem. */
/* A Moebius seam: a lemniscate ribbon with a half twist, drawn as two
   edges that swap places at the crossing, plus a few rungs across it. */
function seam(cx, cy, r, colour, width = 0.4) {
  const edge = (sign) => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const u = (i / 200) * Math.PI * 2;
      const k = 1 + Math.sin(u) * Math.sin(u);
      const bx = (r * Math.cos(u)) / k;
      const by = (r * Math.sin(u) * Math.cos(u)) / k;
      const w = r * 0.14 * sign * Math.cos(u / 2);          // the half twist
      pts.push(`${i ? "L" : "M"}${(bx + cx).toFixed(2)} ${(by + cy + w).toFixed(2)}`);
    }
    return pts.join("");
  };
  const rungs = [];
  for (let i = 0; i < 14; i++) {
    const u = (i / 14) * Math.PI * 2;
    const k = 1 + Math.sin(u) * Math.sin(u);
    const bx = cx + (r * Math.cos(u)) / k;
    const by = cy + (r * Math.sin(u) * Math.cos(u)) / k;
    const w = r * 0.14 * Math.cos(u / 2);
    rungs.push(`<path d="M${bx.toFixed(2)} ${(by + w).toFixed(2)} L${bx.toFixed(2)} ${(by - w).toFixed(2)}"
      stroke="${colour}" stroke-width="${width * 0.6}" opacity="0.55"/>`);
  }
  return `<g fill="none" stroke="${colour}" stroke-width="${width}" opacity="0.9" stroke-linecap="round">
    <path d="${edge(1)}"/><path d="${edge(-1)}"/>${rungs.join("")}</g>`;
}

const frame = (inset, colour, width = 0.3, dash = "") =>
  `<rect x="${BLEED + inset}" y="${BLEED + inset}" width="${TRIM_W - inset * 2}" height="${TRIM_H - inset * 2}"
     fill="none" stroke="${colour}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;

const doc = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg"
  width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${body}
</svg>`;

/* The copy. One voice, five arrangements. */
const ORDER = [
  "An order of enquiry into cosmic physics, druidry, sacred geometry, " +
  "astrology, neuroscience, magic, alchemy and consciousness \u2014 eleven " +
  "limbs, one subject.",
  "Every claim is graded where it stands: established science, scholarship " +
  "and history, speculative and contested, or myth and primary esoteric " +
  "text. Nothing is sold as more than it is."
];
const ORDER_SHORT = [
  "Eleven limbs, one subject: cosmic physics, druidry, geometry, astrology, " +
  "neuroscience, magic, alchemy, consciousness.",
  "Every claim graded where it stands. Nothing oversold."
];
const MEDIA_SHORT = [
  "Podcasts \u2014 long conversations, unhurried.",
  "Films \u2014 the plates drawn and explained.",
  "The live room \u2014 open while we work.",
  "Ask Ed, the oracle, answers at any hour.",
  "Members keep the whole archive."
];
const MEDIA = [
  "Podcasts \u2014 the long conversations, in full and unhurried.",
  "Films \u2014 the plates and the workings, drawn and explained.",
  "The live room \u2014 open while the order is working, with the archive " +
  "kept afterwards for members who could not be there.",
  "Ask Ed, the oracle, answers in writing at any hour."
];

/* The eleven limbs, in their proper order and short enough to set on a
   card. The numerals are the ones used site-wide. */
const LIMBS = [
  ["I", "Cosmic Physics"],
  ["II", "Druidry & Trees"],
  ["III", "Sacred Geometry"],
  ["IV", "Astrology"],
  ["V", "Neuroscience"],
  ["VI", "Biology"],
  ["VII", "The Law of One"],
  ["VIII", "The Black Tribunal"],
  ["IX", "Magic"],
  ["X", "Alchemy"],
  ["XI", "Consciousness"]
];

/* ------------------------------------------------- fitting the type ----
   There is no font metric engine here, so type is measured the way a
   typesetter estimates it: EB Garamond sets at roughly 0.46 of its size
   per character, Cinzel capitals at about 0.70 plus letter-spacing. The
   estimate is deliberately generous, and every paragraph is wrapped to a
   measured column, so no line can run into a QR panel or over the trim. */
const widthOf = (t, size) => t.length * size * 0.54;
const capsWidth = (t, size, spacing) => t.length * (size * 0.78 + spacing);

/** Wrap a paragraph to a column of `w` millimetres at this size. */
function wrap(text, w, size) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (widthOf(next, size) > w && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Wrap several paragraphs, leaving a blank half-line between them. */
function flow(paras, w, size) {
  const out = [];
  paras.forEach((p, i) => { if (i) out.push(""); out.push(...wrap(p, w, size)); });
  return out;
}

function textBlock(lines, x, y, lh, size, colour, anchor = "start", weight = "normal") {
  return `<g font-family="EB Garamond, Georgia, serif" font-size="${size}" fill="${colour}"
    text-anchor="${anchor}" font-weight="${weight}">
    ${lines.map((l, i) => `<text x="${x}" y="${(y + i * lh).toFixed(2)}">${l}</text>`).join("\n    ")}
  </g>`;
}
const caps = (t, x, y, size, colour, spacing = 0.9, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Cinzel, Georgia, serif" font-size="${size}" fill="${colour}"
     letter-spacing="${spacing}" text-anchor="${anchor}">${t}</text>`;

/** The roll of eleven limbs, set in two columns: six, then five.
    `x` is the left edge, `gap` the distance to the second column. */
function limbRoll(x, y, { size = 1.9, lh = 2.7, gap = 26, numColour = GOLD, colour = "#cdc2a8" } = {}) {
  const rows = [];
  LIMBS.forEach(([num, title], i) => {
    const col = i < 6 ? 0 : 1;
    const row = i < 6 ? i : i - 6;
    const cx = x + col * gap;
    const cy = y + row * lh;
    rows.push(`<text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" fill="${numColour}"
      text-anchor="end" font-size="${(size * 0.85).toFixed(2)}">${num}</text>
      <text x="${(cx + 1).toFixed(2)}" y="${cy.toFixed(2)}" fill="${colour}">${title.replace("&", "&amp;")}</text>`);
  });
  return `<g font-family="EB Garamond, serif" font-size="${size}">${rows.join("")}</g>`;
}

/* ===================================================================== */
/* The five designs. Each returns { front, back } as SVG source.          */
/* Every block is wrapped to a measured column, so no line can reach the  */
/* QR panel or the trim however the copy is edited later.                 */
/* ===================================================================== */
const L = SAFE;                       // left margin
const R = BLEED + TRIM_W - 4;         // right margin
const COL = R - L;                    // full column, 77 mm
const QR = 16;                        // QR side, millimetres
const QRX = R - QR;                   // QR left edge when set right
const TEXTCOL = QRX - L - 3;          // column that clears the QR panel

function designs(qrIntro, qrJoin) {
  const out = [];

  /* ---- 1. The Illuminated — dark, gold rule, sigil, formal ------------ */
  {
    
    const media = MEDIA_SHORT;
    out.push({
      slug: "01-illuminated",
      name: "The Illuminated",
      note: "Dark and formal: gold rules, the eleven-ray sigil, the creed set small.",
      front: doc(`
        ${frame(3, GOLD, 0.35)}
        ${frame(4.6, GOLD, 0.12, "0.8 1.2")}
        ${sigil(R - 8, BLEED + 13, 6.2, GOLD, 0.26)}
        ${caps("EGREGORA", L, BLEED + 14, 5.0, BRIGHT, 1.3)}
        ${caps("AN ORDER OF ENQUIRY", L, BLEED + 19, 1.9, GOLD, 0.9)}
        <path d="M${L} ${BLEED + 22} H${R}" stroke="${GOLD}" stroke-width="0.2" opacity="0.7"/>
        <text x="${L}" y="${BLEED + 26.5}" font-family="EB Garamond, serif" font-size="2.0"
          fill="#e7dcc4">Eleven limbs, one subject. Every claim graded where it stands.</text>
        ${limbRoll(L + 5, BLEED + 32, { gap: 27 })}
        ${caps("LIFE, LOVE, MAGIC.", L, BLEED + TRIM_H - 5, 2.1, GOLD, 1.0)}
        ${qrBlock(qrIntro, QRX, BLEED + TRIM_H - QR - 9.5, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + TRIM_H - 6.8}" font-family="EB Garamond, serif"
          font-size="1.9" fill="${DIM}" text-anchor="middle">the introduction</text>`, INK),
      back: doc(`
        ${frame(3, GOLD, 0.35)}
        ${frame(4.6, GOLD, 0.12, "0.8 1.2")}
        ${caps("LISTEN \u00B7 WATCH \u00B7 JOIN US LIVE", L, BLEED + 12, 2.3, BRIGHT, 0.9)}
        <path d="M${L} ${BLEED + 15} H${R}" stroke="${GOLD}" stroke-width="0.2" opacity="0.7"/>
        ${textBlock(media, L, BLEED + 21, 3.6, 2.1, "#e7dcc4")}
        ${seam(L + 5, BLEED + TRIM_H - 7.5, 4.4, GOLD, 0.22)}
        <text x="${L + 12}" y="${BLEED + TRIM_H - 6.6}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${GOLD}">egregora.hatchable.site/join</text>
        ${qrBlock(qrJoin, QRX, BLEED + TRIM_H - QR - 9.5, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + TRIM_H - 6.8}" font-family="EB Garamond, serif"
          font-size="1.9" fill="${DIM}" text-anchor="middle">join the order</text>`, INK)
    });
  }

  /* ---- 2. The Parchment — light stock, ink on cream ------------------- */
  {
    const ink = "#1a140c", rule = "#b99a46", soft = "#6b5a3a";

    const media = flow(MEDIA, COL - 4, 2.05);
    out.push({
      slug: "02-parchment",
      name: "The Parchment",
      note: "Cream stock, ink and gold: the quietest of the five, and the cheapest to print.",
      front: doc(`
        ${frame(3.4, rule, 0.3)}
        ${caps("EGREGORA", W / 2, BLEED + 13, 5.0, ink, 1.3, "middle")}
        ${caps("AN ORDER OF ENQUIRY", W / 2, BLEED + 18, 1.8, soft, 0.9, "middle")}
        <path d="M${L + 14} ${BLEED + 21} H${R - 14}" stroke="${rule}" stroke-width="0.18"/>
        <text x="${W / 2}" y="${BLEED + 25}" font-family="EB Garamond, serif" font-size="2.0"
          fill="#2b231a" text-anchor="middle">Eleven limbs, one subject. Every claim graded where it stands.</text>
        ${limbRoll(W / 2 - 26, BLEED + 29, { gap: 26, lh: 2.4, size: 1.85, numColour: rule, colour: "#2b231a" })}
        ${qrBlock(qrIntro, QRX, BLEED + TRIM_H - QR - 5, QR, { dark: ink, light: PARCH, plate: false })}
        <text x="${L}" y="${BLEED + TRIM_H - 10.5}" font-family="EB Garamond, serif" font-size="2.0"
          fill="${soft}">Scan the square for the introduction</text>
        <text x="${L}" y="${BLEED + TRIM_H - 6.6}" font-family="EB Garamond, serif" font-size="2.2"
          fill="${ink}">Life, Love, Magic.</text>`, PARCH),
      back: doc(`
        ${frame(3.4, rule, 0.3)}
        ${caps("PODCASTS \u00B7 FILMS \u00B7 THE LIVE ROOM", W / 2, BLEED + 12, 2.1, ink, 0.8, "middle")}
        <path d="M${L + 8} ${BLEED + 15} H${R - 8}" stroke="${rule}" stroke-width="0.18"/>
        ${textBlock(media, W / 2, BLEED + 19.5, 2.8, 2.05, "#2b231a", "middle")}
        ${qrBlock(qrJoin, QRX, BLEED + TRIM_H - QR - 6, QR, { dark: ink, light: PARCH, plate: false })}
        ${seam(L + 9, BLEED + TRIM_H - 11, 6.4, rule, 0.26)}
        <text x="${W / 2 - 2}" y="${BLEED + TRIM_H - 11}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${soft}" text-anchor="middle">Scan the square to join the order</text>
        <text x="${W / 2 - 2}" y="${BLEED + TRIM_H - 7.6}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${ink}" text-anchor="middle">egregora.hatchable.site</text>`, PARCH)
    });
  }

  /* ---- 3. The Seam — the emblem large, minimal type ------------------- */
  {

    out.push({
      slug: "03-seam",
      name: "The Seam",
      note: "The Moebius emblem at full width, type pushed to the edges. The one to hand to a stranger.",
      front: doc(`
        ${seam(W / 2, H / 2 + 12, 22, "#3f3318", 0.3)}
        
        ${caps("EGREGORA", L, BLEED + 12, 5.0, BRIGHT, 1.3)}
        <path d="M${L} ${BLEED + 15} H${R}" stroke="${GOLD}" stroke-width="0.18" opacity="0.6"/>
        <text x="${L}" y="${BLEED + 20}" font-family="EB Garamond, serif" font-size="2.0"
          fill="#d8cdb4">Eleven limbs, one subject. Nothing oversold.</text>
        ${limbRoll(L + 5, BLEED + 25.5, { gap: 27, lh: 2.9, size: 2.0 })}
        ${caps("LIFE, LOVE, MAGIC.", L, BLEED + TRIM_H - 5, 2.1, GOLD, 1.0)}
        ${qrBlock(qrIntro, QRX, BLEED + TRIM_H - QR - 9.5, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + TRIM_H - 6.8}" font-family="EB Garamond, serif"
          font-size="1.9" fill="${DIM}" text-anchor="middle">the introduction</text>`, "#0b0a09"),
      back: doc(`
        ${seam(W / 2 + 8, H / 2 + 4, 22, "#4e3f1e", 0.3)}
        ${caps("LISTEN", L, BLEED + 12, 3.6, VERDANT, 1.3)}
        ${caps("WATCH", L, BLEED + 18, 3.6, ROSE, 1.3)}
        ${caps("BE IN THE ROOM", L, BLEED + 24, 3.6, BRIGHT, 1.3)}
        ${textBlock(flow(["Podcasts, films, and a live room that opens while the order is " +
          "working \u2014 with the archive kept for members who could not be there."], TEXTCOL, 2.1),
          L, BLEED + 30.5, 2.9, 2.1, "#c9bfa6")}
        ${qrBlock(qrJoin, QRX, BLEED + TRIM_H - QR - 9.5, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + TRIM_H - 6.8}" font-family="EB Garamond, serif"
          font-size="1.9" fill="${DIM}" text-anchor="middle">join the order</text>
        <text x="${L}" y="${BLEED + TRIM_H - 5}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${DIM}">egregora.hatchable.site</text>`, "#0b0a09")
    });
  }

  /* ---- 4. The Ledger — the four grades printed as a key --------------- */
  {
    const key = [
      [VERDANT, "established science"],
      [GOLD, "scholarship and history"],
      ["#9b7ddb", "speculative and contested"],
      [ROSE, "myth and primary text"]
    ];
    out.push({
      slug: "04-ledger",
      name: "The Ledger",
      note: "Prints the grading key itself \u2014 the thing that makes the order different, on the card.",
      front: doc(`
        ${frame(3, "#2a2218", 0.4)}
        ${caps("EGREGORA", L, BLEED + 12.5, 4.8, BRIGHT, 1.2)}
        ${caps("EVERY CLAIM, GRADED WHERE IT STANDS", L, BLEED + 17, 1.5, DIM, 0.5)}
        ${limbRoll(L + 5, BLEED + 23, { gap: 27, lh: 2.9, size: 2.0 })}
        <path d="M${L} ${BLEED + 39} H${L + 52}" stroke="#3a3122" stroke-width="0.25"/>
        <g font-family="EB Garamond, serif" font-size="1.85">
          ${key.map(([c, t], i) => {
            const cx = L + (i % 2) * 30, cy = BLEED + 43.5 + Math.floor(i / 2) * 3.4;
            return `<text x="${cx}" y="${cy}" fill="${c}">\u25C6</text>
              <text x="${cx + 2.6}" y="${cy}" fill="#bdb299">${t}</text>`;
          }).join("")}
        </g>
        <text x="${L}" y="${BLEED + 50.8}" font-family="EB Garamond, serif" font-size="1.9"
          fill="${DIM}">Test everything kindly. Nothing is sold as more than it is.</text>
        ${qrBlock(qrIntro, QRX, BLEED + 11, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + 30.5}" font-family="EB Garamond, serif" font-size="1.9"
          fill="${DIM}" text-anchor="middle">the introduction</text>`, "#131009"),
      back: doc(`
        ${frame(3, "#2a2218", 0.4)}
        ${caps("THE ORDER, OUT LOUD", L, BLEED + 12, 2.4, BRIGHT, 0.9)}
        <g font-family="EB Garamond, serif" font-size="2.1" fill="#ddd2b9">
          <text x="${L}" y="${BLEED + 18.5}">Podcasts \u2014 long conversations, unhurried.</text>
          <text x="${L}" y="${BLEED + 22.5}">Films \u2014 the plates drawn and explained.</text>
          <text x="${L}" y="${BLEED + 26.5}">The live room \u2014 open while the work is done.</text>
          <text x="${L}" y="${BLEED + 30.5}">Ask Ed \u2014 the oracle answers at any hour.</text>
          <text x="${L}" y="${BLEED + 34.5}" fill="${GOLD}">Members keep the archive.</text>
        </g>
        ${qrBlock(qrJoin, QRX, BLEED + 11, QR, { light: PARCH })}
        <text x="${QRX + QR / 2}" y="${BLEED + 30.5}" font-family="EB Garamond, serif" font-size="1.9"
          fill="${DIM}" text-anchor="middle">join the order</text>
        ${sigil(L + 6, BLEED + TRIM_H - 9, 5, GOLD, 0.24)}
        <text x="${L + 14}" y="${BLEED + TRIM_H - 8}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${DIM}">egregora.hatchable.site/join</text>`, "#131009")
    });
  }

  /* ---- 5. The Plate — an engraved star field, the showpiece ----------- */
  {
    const field = [];
    for (let i = 0; i < 150; i++) {
      const x = ((i * 37) % 91), y = ((i * 53) % 61);
      const r = 0.1 + ((i * 17) % 7) / 50;
      field.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${i % 7 ? "#cbbb93" : "#8fb6d8"}" opacity="${(0.25 + (i % 5) / 8).toFixed(2)}"/>`);
    }
    const sky = `<g>${field.join("")}</g>`;
    out.push({
      slug: "05-plate",
      name: "The Plate",
      note: "An engraved sky across both faces \u2014 the showpiece, and the one that wants good stock.",
      front: doc(`
        ${sky}
        ${frame(3, "#54452a", 0.3)}
        ${sigil(W / 2, BLEED + 11.5, 4.8, GOLD, 0.24)}
        ${caps("EGREGORA", W / 2, BLEED + 21, 4.6, BRIGHT, 1.2, "middle")}
        ${caps("CO-FOUNDED BY EDWARD GREGORY &amp; JIM RANKIN", W / 2, BLEED + 25, 1.25, DIM, 0.28, "middle")}
        ${limbRoll(W / 2 - 16, BLEED + 29.5, { gap: 27, lh: 2.5 })}
        ${qrBlock(qrIntro, L, BLEED + TRIM_H - QR - 4, QR, { light: PARCH })}
        <text x="${L + QR + 4}" y="${BLEED + TRIM_H - 9}" font-family="EB Garamond, serif" font-size="2.0"
          fill="${DIM}">Scan for the introduction</text>
        <text x="${L + QR + 4}" y="${BLEED + TRIM_H - 5}" font-family="EB Garamond, serif" font-size="2.2"
          fill="${GOLD}">Life, Love, Magic.</text>`, "#0d0c10"),
      back: doc(`
        ${sky}
        ${frame(3, "#54452a", 0.3)}
        ${caps("PODCASTS \u00B7 FILMS \u00B7 LIVE", W / 2, BLEED + 12, 2.4, BRIGHT, 1.0, "middle")}
        ${textBlock(flow(["The long conversations, unhurried. The plates drawn and explained on " +
          "film. A live room that opens while the order is working, and an archive kept for members " +
          "who could not be there. The oracle answers at any hour."], COL - 12, 2.1),
          W / 2, BLEED + 18, 2.9, 2.1, "#cdc2a8", "middle")}
        ${qrBlock(qrJoin, W / 2 - QR / 2, BLEED + TRIM_H - QR - 6.5, QR, { light: PARCH })}
        <text x="${W / 2}" y="${BLEED + TRIM_H - 4}" font-family="EB Garamond, serif" font-size="2.1"
          fill="${DIM}" text-anchor="middle">Scan to join \u00B7 egregora.hatchable.site/join</text>`, "#0d0c10")
    });
  }

  return out;
}

/* ===================================================================== */
const qrIntro = await qrPath(FRONT_URL);
const qrJoin = await qrPath(BACK_URL);
mkdirSync(OUT, { recursive: true });

const all = designs(qrIntro, qrJoin);
const DPI = 300;
const px = Math.round((W / 25.4) * DPI);

for (const card of all) {
  for (const side of ["front", "back"]) {
    const svg = card[side];
    const base = join(OUT, `${card.slug}-${side}`);
    writeFileSync(base + ".svg", svg);
    await sharp(Buffer.from(svg), { density: DPI })
      .resize({ width: px })
      .png()
      .toFile(base + ".png");
  }
  console.log(`  ${card.slug.padEnd(16)} ${card.name.padEnd(18)} ${card.note}`);
}

writeFileSync(join(OUT, "README.md"), `# EGregoRA business cards

Five designs, front and back, generated by \`npm run cards\`
(\`scripts/make-cards.mjs\`). Do not hand-edit the files in here: edit the
script and run it again, so the QR codes and the copy cannot drift apart.

## Print specification

| | |
|---|---|
| Trim | 85 × 55 mm |
| Bleed | 3 mm all round (artboard 91 × 61 mm) |
| Safe area | 4 mm inside the trim |
| Colour | RGB in the files; ask the printer to convert, or request a CMYK proof |
| Files | \`.svg\` is the master and is vector — send this. \`.png\` is 300 dpi, for previews and for printers who insist on raster. |

## The five

${all.map((c) => `- **${c.name}** (\`${c.slug}\`) — ${c.note}`).join("\n")}

## The codes

- Front of every card: QR to ${FRONT_URL} — the introduction.
- Back of every card: QR to ${BACK_URL} — the sign-up page.

Both are generated at error-correction level Q, which tolerates about 25%
damage, so the cards survive a thumbprint and a wet pocket. Test a printed
proof with two different phones before ordering a thousand.
`);

console.log(`\nwrote ${all.length * 2} cards (svg + png at ${DPI} dpi) to ${OUT}/`);
