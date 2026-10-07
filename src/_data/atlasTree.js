/**
 * The atlas — the limb canon and the page sections married into one tree.
 *
 * `limbs.js` says what the limbs are; `atlas.json` (written by
 * scripts/gather-topics.py, read out of the pages themselves) says what each
 * page actually covers. This joins the two so the index page can hand a
 * single object both to the 3D map and to the plain list beneath it, and
 * neither can disagree with the other.
 */
import { createRequire } from 'node:module';
import limbs from './limbs.js';

const require = createRequire(import.meta.url);
const topics = require('./atlas.json');

/** The page a href points at, with any anchor dropped. */
const page = (href) => String(href).split('#')[0];

/** Entities belong in HTML, not in a JSON payload read by script. */
const plain = (s) => String(s)
  .replace(/&amp;/g, '&')
  .replace(/&middot;/g, '\u00b7')
  .replace(/&mdash;/g, '\u2014')
  .replace(/&rsquo;/g, '\u2019')
  .replace(/&hellip;/g, '\u2026')
  .replace(/<[^>]+>/g, '');

/* A topic that merely restates its limb is a twig pointing at its own
   branch; drop it rather than draw the same word twice. */
const distinct = (list, against) => {
  const taken = new Set(against.map((t) => t.toLowerCase()));
  return list.filter((t) => !taken.has(t.title.toLowerCase()));
};

const forPage = (href) => (topics[page(href)] || []).map((t) => ({
  title: plain(t.title),
  href: t.href
}));

export default {
  limbs: limbs.map((limb) => {
    const subs = (limb.subs || []).map((sub) => ({
      num: plain(sub.num),
      title: plain(sub.title),
      href: sub.href,
      note: 'A sub-limb of ' + plain(limb.title) + '.',
      topics: forPage(sub.href)
    }));

    /* Sections already claimed by a sub-limb's own page are not repeated
       under the parent limb. */
    const claimed = subs.flatMap((s) => s.topics.map((t) => t.title));
    const own = page(limb.href) === page((subs[0] || {}).href || '')
      ? []
      : distinct(forPage(limb.href), claimed);

    return {
      num: plain(limb.num),
      title: plain(limb.title),
      href: limb.href,
      page: limb.page !== false,
      note: plain(limb.body).slice(0, 220) + (plain(limb.body).length > 220 ? '\u2026' : ''),
      subs,
      topics: own
    };
  })
};
