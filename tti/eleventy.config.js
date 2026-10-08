export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "tti/src/assets": "assets" });

  /* Trigonometry in the templates, so a mark made of eleven evenly spaced
     points can be drawn from the number eleven rather than from eleven
     hand-typed coordinates that nobody can check. */
  eleventyConfig.addFilter("sin", (n) => Math.round(Math.sin(Number(n)) * 1000) / 1000);
  eleventyConfig.addFilter("cos", (n) => Math.round(Math.cos(Number(n)) * 1000) / 1000);
  /* log10, with the ground at zero handled rather than returning -Infinity:
     nought has no radius on the spiral, and is drawn by hand at the centre. */
  eleventyConfig.addFilter("log10nz", (n) => {
    const v = Number(n);
    return v > 0 ? Math.round(Math.log10(v) * 100000) / 100000 : 0;
  });
  eleventyConfig.addFilter("round2", (n) => Math.round(Number(n) * 100) / 100);
  eleventyConfig.addPassthroughCopy({ "tti/src/static": "." });
  eleventyConfig.addWatchTarget("tti/src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("isoDate", (d) => new Date(d || Date.now()).toISOString());
  eleventyConfig.addFilter("split", (s, sep) => String(s || "").split(sep));
  eleventyConfig.addFilter("absolute", (u, base) => new URL(u, base).toString());

  eleventyConfig.addShortcode("glyph", (name) => {
    const glyphs = {
      seed: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><circle cx="50" cy="50" r="20"/><circle cx="50" cy="30" r="20"/><circle cx="50" cy="70" r="20"/><circle cx="67.3" cy="40" r="20"/><circle cx="67.3" cy="60" r="20"/><circle cx="32.7" cy="40" r="20"/><circle cx="32.7" cy="60" r="20"/><circle cx="50" cy="50" r="40"/></g></svg>`,
      metatron: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.8"><circle cx="50" cy="50" r="46"/><polygon points="50,8 86,29 86,71 50,92 14,71 14,29"/><polygon points="50,22 81,40 81,76 50,94 19,76 19,40" opacity="0.5"/><path d="M50,8 50,92 M14,29 86,71 M86,29 14,71 M14,29 14,71 M86,29 86,71 M50,8 14,71 M50,8 86,71 M50,92 14,29 M50,92 86,29"/></g></svg>`,
      tree: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M50 95 V52"/><path d="M50 62 L32 46 M50 62 L68 46 M50 48 L38 34 M50 48 L62 34 M50 38 L44 28 M50 38 L56 28"/><circle cx="50" cy="30" r="26" stroke-dasharray="3 4"/><path d="M34 95 Q50 86 66 95" /></g></svg>`,
      eye: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M6 50 Q50 14 94 50 Q50 86 6 50 Z"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="5" fill="currentColor"/><path d="M50 18 V6 M50 94 V82 M18 50 H6 M94 50 H82"/></g></svg>`,
      spiral: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M50 50 m0 0 a4 4 0 1 1 4 -4 a9 9 0 1 1 -13 9 a18 18 0 1 1 26 -18 a32 32 0 1 1 -45 32 a46 46 0 1 1 65 -46"/></g></svg>`,
      torus: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.9"><ellipse cx="50" cy="50" rx="46" ry="26"/><ellipse cx="50" cy="50" rx="18" ry="8"/><ellipse cx="50" cy="50" rx="32" ry="17" opacity="0.55"/><path d="M50 24 A46 26 0 0 1 50 76" opacity="0.35"/><path d="M50 24 A46 26 0 0 0 50 76" opacity="0.35"/></g></svg>`,
      mobius: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M20 50 C20 26 80 26 80 50 C80 74 20 74 20 50 Z"/><path d="M20 50 C34 38 66 62 80 50"/><path d="M20 50 C34 62 66 38 80 50" opacity="0.5"/></g></svg>`,
      sphere: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.9"><circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="40" ry="14"/><ellipse cx="50" cy="50" rx="14" ry="40"/><circle cx="50" cy="10" r="2.4" fill="currentColor"/></g></svg>`,
      integral: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M62 18 C62 10 48 10 46 20 L38 78 C36 90 24 90 24 82"/><path d="M28 54 H70" opacity="0.5"/></g></svg>`,
      ledger: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><rect x="18" y="14" width="64" height="72"/><path d="M18 32 H82 M34 14 V86 M34 50 H82 M34 68 H82"/></g></svg>`,
      dragon: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 70 C26 54 40 46 54 48 C62 49 68 44 70 36 C72 28 80 26 86 30 C80 32 78 36 78 42 C78 54 68 62 56 62 C46 62 34 66 28 78"/><path d="M70 36 L78 22 L66 28"/><circle cx="74" cy="36" r="1.6" fill="currentColor"/><path d="M40 58 C44 68 54 72 64 70" opacity="0.6"/></g></svg>`,
      star: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.9"><circle cx="50" cy="50" r="44"/><polygon points="50,6 63,38 94,38 69,58 78,90 50,71 22,90 31,58 6,38 37,38"/></g></svg>`
    };
    return glyphs[name] || glyphs.seed;
  });

  return {
    dir: { input: "tti/src", includes: "_includes", data: "_data", output: "tti/_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
