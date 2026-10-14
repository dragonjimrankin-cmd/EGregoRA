import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../longform");

const sources = Object.freeze({
  partI: ["part-i-first-principles.md", "part-synthesis"],
  partII: ["part-ii-cosmic-architecture.md", "part-synthesis"],
  partIII: ["part-iii-seams-and-return.md", "part-synthesis"],
  partIV: ["part-iv-tests-and-essays.md", "part-synthesis"],
  partV: ["part-v-reading-rooms.md", "part-synthesis"],
  partVI: ["part-vi-riemann-programme.md", "part-synthesis"],
  final: ["final-synthesis.md", "final-synthesis"]
});

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function countWords(value) {
  return (value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
}

function render(source) {
  const ids = new Map();
  const markdown = new MarkdownIt({ html: false, linkify: false, typographer: true });
  markdown.renderer.rules.heading_open = (tokens, index) => {
    const originalLevel = Number(tokens[index].tag.slice(1));
    const level = Math.min(6, originalLevel + 1);
    const heading = tokens[index + 1]?.content || "Section";
    const base = `longform-${slugify(heading)}`;
    const occurrence = (ids.get(base) || 0) + 1;
    ids.set(base, occurrence);
    const id = occurrence === 1 ? base : `${base}-${occurrence}`;
    return `<h${level} id="${id}">`;
  };
  markdown.renderer.rules.heading_close = (tokens, index) => {
    const originalLevel = Number(tokens[index].tag.slice(1));
    return `</h${Math.min(6, originalLevel + 1)}>\n`;
  };
  return markdown.render(source);
}

const longform = {};
for (const [key, [filename, className]] of Object.entries(sources)) {
  const source = fs.readFileSync(path.join(directory, filename), "utf8");
  const firstHeading = source.match(/^#\s+(.+)$/m)?.[1] || "Long-form synthesis";
  longform[key] = Object.freeze({
    filename,
    className,
    title: firstHeading,
    titleId: `longform-${slugify(firstHeading)}`,
    wordCount: countWords(source),
    html: render(source)
  });
}

export default Object.freeze(longform);
