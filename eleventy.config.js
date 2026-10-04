export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "." });
  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  eleventyConfig.addShortcode("glyph", (name) => {
    const glyphs = {
      seed: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><circle cx="50" cy="50" r="20"/><circle cx="50" cy="30" r="20"/><circle cx="50" cy="70" r="20"/><circle cx="67.3" cy="40" r="20"/><circle cx="67.3" cy="60" r="20"/><circle cx="32.7" cy="40" r="20"/><circle cx="32.7" cy="60" r="20"/><circle cx="50" cy="50" r="40"/></g></svg>`,
      metatron: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.8"><circle cx="50" cy="50" r="46"/><polygon points="50,8 86,29 86,71 50,92 14,71 14,29"/><polygon points="50,22 81,40 81,76 50,94 19,76 19,40" opacity="0.5"/><path d="M50,8 50,92 M14,29 86,71 M86,29 14,71 M14,29 14,71 M86,29 86,71 M50,8 14,71 M50,8 86,71 M50,92 14,29 M50,92 86,29"/></g></svg>`,
      tree: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M50 95 V52"/><path d="M50 62 L32 46 M50 62 L68 46 M50 48 L38 34 M50 48 L62 34 M50 38 L44 28 M50 38 L56 28"/><circle cx="50" cy="30" r="26" stroke-dasharray="3 4"/><path d="M34 95 Q50 86 66 95" /></g></svg>`,
      eye: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M6 50 Q50 14 94 50 Q50 86 6 50 Z"/><circle cx="50" cy="50" r="16"/><circle cx="50" cy="50" r="5" fill="currentColor"/><path d="M50 18 V6 M50 94 V82 M18 50 H6 M94 50 H82"/></g></svg>`,
      spiral: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M50 50 m0 0 a4 4 0 1 1 4 -4 a9 9 0 1 1 -13 9 a18 18 0 1 1 26 -18 a32 32 0 1 1 -45 32 a46 46 0 1 1 65 -46"/></g></svg>`,
      star: `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.9"><circle cx="50" cy="50" r="44"/><polygon points="50,6 63,38 94,38 69,58 78,90 50,71 22,90 31,58 6,38 37,38"/></g></svg>`
    };
    return glyphs[name] || glyphs.seed;
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
