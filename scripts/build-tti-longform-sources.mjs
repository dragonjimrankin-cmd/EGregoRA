import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';

const root = path.resolve('.');
const built = path.join(root, 'tti', '_site');
const output = path.join(root, 'tti', 'longform');
fs.mkdirSync(output, { recursive: true });

const specs = {
  I: {
    file: 'part-i-first-principles.md',
    title: 'From Nothing to a Self: The First Principles of The Two Infinities',
    intro: `The Two Infinities begins with questions that are easier to ask than to answer. Why is there anything at all? What do zero and one mean before they become ordinary counting numbers? How can a universe contain separate beings while remaining one connected process? What does it mean to say that a self continues through change? Part I states the project's starting ideas and, just as importantly, marks the places where an idea is only a proposal.

This essay gathers the first-principles papers into one accessible route. It does not assume that mathematics automatically becomes physics, or that a suggestive image proves a fact about the world. It begins with existence and distinction, moves through closure and the appearance of pi, considers the self as an integrating activity, and asks whether repeated differences could support structure. It also examines the Prime Plane, the possible relation between entropy and self-renewal, and the changing balance among ordinary matter, dark matter and dark energy.

The central theme is integration. In everyday language, integration means bringing parts together. In TTI it has a wider role: a thing exists as a continuing whole because differences are related rather than left isolated. That thought can be philosophically useful even where the physical mechanism remains unknown. The aim is to explain what the framework is trying to say, what standard mathematics or cosmology already establishes, and what TTI still has to earn.`,
    conclusion: `Part I does not deliver a finished theory of existence, consciousness or cosmic evolution. It delivers a connected set of starting questions and a vocabulary for pursuing them. Its strongest contributions are distinctions: closure is not proof of cosmology; integration is not automatically consciousness; entropy production is not identical to personal renewal; changing cosmic fractions do not by themselves show conversion among sectors.

The next step is architecture. If differences really integrate into durable structure, the framework must say how patterns acquire scale, energy and lawful motion. The philosophical opening remains valuable, but the universe will not be explained by first principles alone.`
  },
  II: {
    file: 'part-ii-cosmic-architecture.md',
    title: 'From Splice to Structure: Gravity, Spirals, Tori and the Cosmic Body',
    intro: `Part II asks how an abstract account of difference and integration might become a universe with shape. Its papers move through gravity, spirals, the Skeletal Splice, the torus and the megatubule. These are not five unrelated pictures. They are attempts to describe how local distinctions could accumulate, circulate and return without turning the whole cosmos into a featureless block.

The accessible way to read this Part is to keep three levels separate. First there is exact pattern: a sequence can be calculated, a curve can be drawn and a surface can be described. Second there is a model: the pattern organises a possible account of matter, motion or large-scale structure. Third there is physical evidence: a model must connect to measurements, units, conservation laws and observations that could prove it wrong. TTI often has the first level, sometimes offers a detailed second level, and is still working toward the third.

This essay therefore avoids treating evocative geometry as a shortcut. It explains why spiral and toroidal forms recur, how the decimal splices at ten and one hundred are interpreted, and why gravity remains the decisive bridge.`,
    conclusion: `Part II offers a memorable architecture: local differences accumulate, spiral, close through toroidal geometry and may be organised by a skeletal sequence. Its pictures are strongest when they clarify relationships and weakest when they are treated as measurements before a physical map exists.

The outstanding bridge is explicit. TTI must derive an action, a scale and couplings that connect the splice to gravity and matter without fitting them after the fact. Until then, the architecture is a disciplined speculative model rather than established cosmology.`
  },
  III: {
    file: 'part-iii-seams-and-return.md',
    title: 'The Universe at Its Seams: Time, Entropy, Residue and Return',
    intro: `Part III turns from cosmic architecture to boundaries. A boundary can separate, connect, reverse, preserve or transform. In The Two Infinities, the most important boundaries are called seams. They appear in the Möbius model, the Cosmic Ledger, accounts of entropy, temporal antipodes, residue across cosmic cycles, inverted tori, wormholes and the proposed phase relation between matter and antimatter.

These topics can easily blur into one grand image. This essay slows them down. A topological seam is not automatically a physical doorway. A reversal of orientation is not automatically a reversal of time. A bookkeeping device is not automatically a second universe. A remembered path is not automatically a transferable message. By separating those claims, the Part becomes more coherent rather than less imaginative.

The common question is what can survive change. If a process returns to a similar state, has everything been erased, or can the route leave a residue? Standard physics supplies constraints on entropy, causality, stress and energy. TTI supplies a speculative picture of integration and return. The useful work lies in showing exactly where one ends and the other begins.`,
    conclusion: `Part III makes return more precise by refusing to call every reversal the same thing. Topological orientation, thermodynamic direction, clock time, causal order and remembered path are different structures. A successful theory must state which one changes and which one remains.

The Part's deepest proposal is that restoration of a state need not erase the history of the route. That possibility is mathematically familiar in some settings and physically demanding in others. TTI's inherited residue remains a conjecture until a carrier, conservation rule and observable consequence are supplied.`
  },
  IV: {
    file: 'part-iv-tests-and-essays.md',
    title: 'How a Speculative Cosmology Faces Evidence',
    intro: `A speculative cosmology becomes a research programme only when it explains how it could be wrong. Part IV is devoted to that transition. It gathers stress tests, comparative essays, the double-inversion question, accumulated differentials, the interpretation of JWST little red dots and the Zero-Seam research proposal.

The governing principle is simple: a pattern that can explain every outcome explains nothing. If an unexpected observation is always absorbed by changing an unseen phase, moving a scale or adding a new residue, the framework cannot learn from evidence. Part IV therefore asks for fixed definitions, declared alternatives, measurable consequences and loss conditions. It also asks whether familiar physics already explains the same observations more economically.

This essay presents those tests in ordinary language. The emphasis is on discipline: a beautiful theory should be allowed to lose.`,
    conclusion: `Part IV changes the tone of the project. The question is no longer only whether the framework can tell a coherent story, but whether the world has to behave differently if that story is true. The Zero-Seam proposal, the accumulated-differential bridge and the inversion tests are valuable because they expose where extra assumptions enter.

No single observation will settle the whole cosmology. Progress will come through narrower contests: a fixed prediction against a conventional null, with uncertainty and selection rules declared in advance. A result that favours ordinary astrophysics is not a failure of research. It is the framework learning where not to place its weight.`
  },
  V: {
    file: 'part-v-reading-rooms.md',
    title: 'The Reading Rooms: How to Explore, Question and Test The Two Infinities',
    intro: `The Reading Rooms are not an afterthought to the cosmology. They are the part of the project that makes inspection possible. A long speculative framework can become persuasive merely through scale: the reader encounters so many terms, diagrams and cross-links that the whole begins to feel established. Part V is designed to resist that effect. It provides a table of contents, an interactive Atlas, a plate room, a prepared question system and local reader services so that claims can be found, compared and challenged.

Accessibility means more than large type or keyboard controls, although those matter. It also means intellectual access. A reader should be able to tell whether a paragraph reports accepted mathematics, offers a historical interpretation, proposes a bridge or presents a vision. A diagram should state what it demonstrates and what it does not. A research assistant should preserve the same evidential boundary wherever the question is asked.

The proper stance is active hospitality: allow the idea enough space to become precise, then ask it to pay every mathematical, physical and evidential debt it creates.`,
    conclusion: `Part V turns a body of speculative writing into something closer to a public research object. It does not validate the cosmology. It makes the cosmology easier to inspect, quote, question and revise.

The Reading Rooms embody a principle that applies to the whole of TTI. Accessibility and rigour are allies. Plain language does not weaken a difficult idea. It reveals where the difficulty truly lies. When the project says what is known, what is proposed and what would count as loss, an average reader can participate in the most important act of research: asking a clear question and remaining willing to hear an unwelcome answer.`
  },
  VI: {
    file: 'part-vi-riemann-programme.md',
    title: 'Arithmetic, Proof and the Limits of Analogy: The Riemann Programme',
    intro: `Part VI began with a large archive about the Riemann Hypothesis. It contained fifty-two files, repeated versions, ambitious theorem labels, numerical experiments and later corrections. The task was not to combine every page into one longer claim. It was to work out which statements survived their own revision history.

The Riemann Hypothesis is one of mathematics' most famous open problems. Very roughly, it says that the non-obvious zeros of a function connected to the prime numbers all lie on one central line in the complex plane. That sentence is short, but a proof must control infinitely many zeros, not merely a large sample. It must also avoid assuming the very arrangement it is meant to prove.

This essay describes the identity gap between exact formulas and the missing global implication, follows the correction of several proof routes, and asks whether any surviving result helps TTI's Skeletal Splice. Equations are kept to a minimum.`,
    conclusion: `The Riemann Programme does not prove the Riemann Hypothesis and does not solve the physical splice. Its value is methodological. It shows why a corrected formula must force every dependent conclusion to be checked again, why finite verification cannot carry an infinite quantifier, and why resemblance between two mathematical patterns is not a coupling law.

One real-axis result and several exact identities survive. Conditional formulas remain useful when their assumptions are stated. Numerical experiments remain useful when their limits are stated. The splice still owes an action, a physical scale, an electromagnetic normalisation and an independent halo radius. That is a clearer outcome than an unsupported theorem because it tells the next investigation exactly what must be built.`
  }
};

const wordCount = (text) => (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
const normalise = (text) => text.replace(/\s+/g, ' ').replace(/[◆◇]/g, '').trim();
const containsMath = (text) => /\\\(|\\\[|\\(?:frac|sum|int|begin|sqrt|log|xi|rho|gamma|sigma|varphi)\b|[=^_]/.test(text);

function routeFile(route) {
  return route === '/' ? path.join(built, 'index.html') : path.join(built, route.replace(/^\//, ''), 'index.html');
}

function paragraphsFor(route, allowSimpleMath = false) {
  const $ = cheerio.load(fs.readFileSync(routeFile(route), 'utf8'));
  const main = $('main').clone();
  main.find('nav, script, style, svg, figure, table, .formula, .document-outline, .project-context, .longform-synthesis, .skip-link, .divider').remove();
  const output = [];
  main.find('p, li').each((_, element) => {
    const raw = normalise($(element).text());
    if (!allowSimpleMath && containsMath(raw)) return;
    const text = allowSimpleMath
      ? raw.replace(/\\\([^)]*\\\)/g, 'the stated mathematical expression').replace(/\\[A-Za-z]+/g, '')
      : raw;
    const words = wordCount(text);
    if (words >= 18 && words <= 180 && !/^(Previous|Next|Document|Status|Type|Position):/i.test(text)) output.push(text);
  });
  return output;
}

function take(paragraphs, target) {
  const selected = [];
  let count = 0;
  for (const paragraph of paragraphs) {
    const next = wordCount(paragraph);
    if (count + next > target && count >= target * 0.9) break;
    selected.push(paragraph);
    count += next;
  }
  return selected;
}

function header(spec, part) {
  return `# ${spec.title}\n\n**Part ${part} · ${site.navGroups.find((group) => group.part === part).shortLabel}**\n\n*The Two Infinities: Eternal Integration of the Self*  \n*A speculative cosmology by Jim Rankin, UK, 2026*  \n*Accessible website edition · 14 October 2026*\n\n> This synthesis distinguishes standard knowledge, exact internal results, conditional arguments, numerical evidence and TTI conjecture. It is explanatory research writing, not a claim of scientific consensus.\n\n## A plain-language route through Part ${part}\n\n${spec.intro}\n\n`;
}

function buildStandard(group, target = 6500) {
  const spec = specs[group.part];
  let markdown = header(spec, group.part);
  const fixed = wordCount(markdown) + wordCount(spec.conclusion) + 20;
  const quota = Math.floor((target - fixed) / group.items.length);
  const unused = [];
  for (const item of group.items) {
    const paragraphs = paragraphsFor(item.url);
    const selected = take(paragraphs, quota);
    markdown += `## ${item.label}\n\n${selected.join('\n\n')}\n\n`;
    unused.push(...paragraphs.slice(selected.length));
  }
  if (wordCount(markdown) < 6000) {
    markdown += `## Further connections across Part ${group.part}\n\n`;
    for (const paragraph of unused) {
      if (wordCount(markdown) >= 6200) break;
      markdown += paragraph + '\n\n';
    }
  }
  markdown += `## What Part ${group.part} leaves us with\n\n${spec.conclusion}\n`;
  return markdown;
}

function oracleAnswers() {
  const source = fs.readFileSync(path.join(root, 'tti/src/assets/js/oracle-knowledge.js'), 'utf8');
  return [...source.matchAll(/question:\s*"([^"]+)",[\s\S]*?answer:\s*`([\s\S]*?)`,\n\s*followups:/g)]
    .map((match) => ({ question: normalise(match[1]), answer: normalise(match[2].replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')) }))
    .filter((entry) => wordCount(entry.answer) >= 80 && !containsMath(entry.answer));
}

function buildPartV(group) {
  const spec = specs.V;
  let markdown = header(spec, 'V');
  markdown += `## The table of contents and the Atlas\n\n${take(paragraphsFor('/'), 1150).join('\n\n')}\n\n`;
  const $ = cheerio.load(fs.readFileSync(routeFile('/plates/'), 'utf8'));
  const plates = [];
  $('figure.plate').each((_, figure) => {
    const caption = normalise($(figure).find('figcaption').first().text());
    const note = normalise($(figure).find('.plate-note').first().text());
    if (caption && note && !containsMath(caption + note)) plates.push(`${caption}. ${note}`);
  });
  markdown += `## Plates are arguments, not decoration\n\nA plate can make a relationship visible before prose makes it memorable. That power creates a risk: a beautiful arrow can look like a proven implication. The plate room therefore keeps every figure beside a plain statement of what it can and cannot establish.\n\n${take(plates, 1700).join('\n\n')}\n\n`;
  markdown += `## Asking ShakDrah without outsourcing judgement\n\nAsk ShakDrah is a prepared research interface, not an oracle in the literal sense. Its reviewed answers preserve attribution, repeat uncertainty labels and return the reader to the full paper. Voice, drawing and film controls change presentation; they do not change the evidence.\n\n`;
  for (const entry of oracleAnswers()) {
    if (wordCount(markdown) >= 5700) break;
    markdown += `### ${entry.question}\n\n${entry.answer}\n\n`;
  }
  markdown += `## A practical reading method\n\nBegin with the table of contents rather than the most dramatic claim. Read one paper's plain-language opening, then locate its status and failure conditions. When an equation appears, ask what each quantity measures and whether the units agree; there is no need to perform the algebra before asking those questions. When a diagram joins two boxes, look for the sentence that justifies the arrow. When a number resembles a physical constant, ask how many other numbers were available and whether the match was selected before or after looking at the target.\n\nCompare neighbouring papers. The same word may do different jobs. Inversion can mean a mathematical operation, a change of orientation, a phase operation or a cosmic transition. Residue can mean a measured remainder, stored path information or a visionary inheritance. Integration can mean a calculus operation, organisation of a self or a proposed universal process. The project is strongest when it defines the local meaning.\n\nUse questions and plates to return to prose, not to replace it. A prepared answer is an entrance. A plate is a map. The paper carries the assumptions, alternatives and limits. A responsible reading room makes exploration easier while keeping judgement with the reader.\n\n## What Part V leaves us with\n\n${spec.conclusion}\n`;
  return markdown;
}

const rhSupplement = `## Why the famous problem is difficult\n\nPrime numbers are introduced through a simple rule, but their gaps do not follow a simple repeating pattern. The zeta function lets mathematicians study their distribution as a whole. Its non-obvious zeros behave rather like frequencies in a complicated signal. The Riemann Hypothesis says that all of those zeros lie on one central line. Computers have checked immense numbers of cases, but no finite computation reaches every zero. A proof needs a reason without an upper limit.\n\nComplex numbers add another difficulty. They have both a real and an imaginary direction, so a sign that is controlled along one path can change when the path turns. The archive's real-axis log-convexity result benefits from positive weights. On the critical line the corresponding factor oscillates. The real-axis theorem remains valid, but crossing from it to the critical line requires a new bridge.\n\nMany proposed criteria translate zero location into positivity of a sequence, matrix, density or quadratic form. Such translations can be profound while leaving the central difficulty untouched. If proving the new positivity is exactly as hard as proving RH, the criterion has reorganised the problem rather than solved it. Reorganisation is still useful, but its status must be stated honestly.\n\n## An evidence ladder\n\nAt the bottom are definitions and standard facts. Above those are exact internal calculations. Higher are statements that follow only if RH is assumed, then finite computations, heuristic interpretations and conjectures. At the top are claims later corrected or still carrying an unresolved gap. A correction-aware audit keeps each result on the rung its evidence supports.\n\nConditional reasoning is legitimate when its condition remains visible. Trouble begins when a formula derived after placing every zero on the critical line is later used to force every zero onto that line. The premise has then entered the conclusion. Finite verification has a related limit: it can test implementations and reveal patterns, but infinity always leaves another case beyond the last computation.\n\nThe complete-monotonicity route shows why revisions propagate. An early formula made every term look positive. A later file correctly replaced it with a formula containing competing pieces. The attractive term-by-term proof disappeared. Complete monotonicity may still be true, but it now needs a new proof that controls the full combination for every derivative and input.\n\nThe density route failed at a small-parameter inequality. The document claimed that only one early term could be negative, but more terms enter the negative block as the parameter shrinks. Positive samples remain evidence about those samples. They do not certify every point or the limiting region. A repair needs rigorous finite enclosures plus a bound on the infinite tail.\n\nThe Pólya-kernel route used the shape of a positive kernel. Its variance sketch did not control the unbounded tail needed for a global theorem. The critical-line converse had a different problem: one negative off-line contribution need not dominate every positive background contribution. A later detectability discussion did not repair that universal domination step.\n\n## What RH can and cannot give the splice\n\nTTI's splice and the RH archive both use sequences, transforms, spectra and positivity. Shared vocabulary creates a possible research conversation, not an implication. The splice still needs a unique action map explaining whether its numbers are fields, sources, probabilities, boundary data or something else. The RH work supplies no selection rule.\n\nGravity also needs a physical scale. Prime numbers, zeta zeros and splice ratios are dimensionless in ordinary mathematical use. A dimensionless pattern can determine a ratio but cannot create metres, seconds or joules without independent physical input. Electromagnetism similarly needs field normalisation and a charge spectrum. A circular phase can motivate symmetry without fixing the measured coupling.\n\nThe halo proposal needs an independent starting radius. Choosing a prime or zero because it improves a galaxy fit would move the target after seeing the data. A genuine prediction requires one universal anchor or one preregistered rule tied to separately measured formation information. It must also explain both motion and lensing with the same gravitational source.\n\nRH contributes method rather than constants. Transform the exact splice sequence before interpreting it. Define the infinite operator before computing finite matrices. Keep an error budget smaller than the measured margin. Register the scale, phase and statistic before examining astronomical data. These rules do not solve the splice, but they make a future claim harder to fit retrospectively.\n\n## A responsible publication route\n\nThe first paper should state the narrowest independently checkable result. Exact balance identities can be supporting lemmas without being advertised as evidence of RH. Complete monotonicity, density positivity and kernel log-concavity should remain conjectures until their missing global bounds are supplied. Numerical tables should include code, precision, truncation rules and certified error budgets.\n\nA correction table should list each original statement, later change, downstream consequence and present status. This is not an embarrassment. It shows that the research has learned. Mathematical and cosmological publications should remain separate until a genuine bridge exists. Cross-reference is proper when one programme supplies a method; implication should be claimed only when the assumptions of one actually entail a result in the other.\n\nFor a general reader, every paper should begin by saying what was proved, what was assumed and what remains open. Technical sections can carry the details without hiding the scope. If a result depends on RH, say so in the sentence that states it. If it is numerical, name the finite range. If novelty is unverified, do not advertise discovery. Clear scope is part of a proof's public meaning.\n\n## How an average reader can audit a difficult proof\n\nA reader does not need to reproduce every advanced calculation to understand the logical shape of a proof. Begin by writing the main claim in ordinary language. Does it concern every zero, every positive input or every derivative? Universal words matter because a thousand successful examples do not cover an unlimited domain. If the conclusion is universal, locate the step that also has universal reach.\n\nNext, list the assumptions before following the calculations. Some may be standard definitions. Others may be temporary conditions such as assuming RH. A conditional theorem is valuable, but its condition must not vanish from the conclusion. If a later paragraph uses an all-on-line representation while advertising an unconditional result, the proof has crossed its own boundary.\n\nThen identify the exact object being studied. Similar-looking functions can have different derivatives, transforms and signs. In the archive, replacing one function with a simpler positive sum made a proof easy, but the replacement was not exact. Checking the formula before checking the estimate prevents many pages of valid algebra from being applied to the wrong object.\n\nLook for changes of order. Infinite sums, derivatives and integrals cannot always be exchanged freely. A paper should state why the exchange converges in the region being used. If the argument later moves to a boundary or a different direction in the complex plane, the convergence statement may need to be proved again. Analytic continuation can extend a function without preserving the original integral as a directly convergent formula everywhere.\n\nWhen a smooth model replaces discrete data, ask for the error term. Smooth zero density can explain an average tendency, while individual zeros still create fluctuations. The main term decides a sign only when the remainder is smaller than the margin. If leading terms cancel, a rough approximation becomes less trustworthy precisely where it is being asked to do more work.\n\nFor computer evidence, record what was finite. How many zeros were used? What matrix size? Which interval was sampled? How many digits of precision? What upper bound covers omitted terms? A tiny positive answer is not informative when the truncation or rounding uncertainty is larger. Certified intervals and reproducible code turn a persuasive picture into a finite mathematical statement.\n\nFinally, follow corrections downstream. If a premise changes, mark every result that cites it. Some conclusions may have independent proofs and survive. Others return to open status. This dependency check is the heart of the consolidated dossier. It is also a general research habit that TTI can apply to physical claims, where a changed scale, coupling or conservation rule can alter many later predictions.\n\nThe reader's aim is not to catch the author out. It is to discover exactly what kind of progress has occurred. A corrected formula, a failed numerical route and a surviving lemma can all be valuable outcomes. Clear classification lets later work begin from the strongest point actually reached rather than from the most confident sentence in the archive.\n\nA useful final check is to imagine the claim being false. Which line of the proof would prevent a counterexample? If the answer is only that no counterexample appeared in a search, the result is numerical evidence. If a positive contribution is meant to overwhelm every negative one, where is the inequality that compares the complete totals? If an asymptotic trend is meant to control a middle interval, where do the regions overlap? These questions translate technical gaps into ordinary logic.\n\nThe same approach helps with novelty. A derivation can be correct without being new. Establishing priority requires searching equivalent theorems under different notation, checking standard references and asking specialists who know the surrounding literature. The archive's real-axis result is therefore described as internally reproducible while novelty remains unverified. That wording protects both achievements: the argument can be evaluated on its merits, and historical credit is not assigned before the comparison is complete.\n\nThis patient style of reading is especially important for famous open problems. The prestige of RH can make a new criterion feel more decisive than it is, while scepticism can make a valid partial result seem worthless. The evidence ladder avoids both reactions. It permits exact lemmas, conditional theorems, finite computations and conjectures to coexist without pretending they carry the same weight. Progress becomes a map of dependencies rather than a single dramatic verdict.\n\nFor TTI, that map is the lasting contribution of Part VI. The project now has a worked example of how to consolidate revisions, preserve valid chains and expose unresolved bridges. Applying the same method to gravity, consciousness and cosmic return will not settle those subjects automatically. It will ensure that future advances are stated at the level they have actually earned.\n\nThat standard also makes collaboration easier. A mathematician can work on the missing bound without endorsing the cosmology. A physicist can test the splice action without accepting an RH analogy. An astronomer can examine a preregistered residual without taking a position on metaphysics. By separating dependencies, the programme creates smaller questions that different specialists can answer independently and later reconnect if the evidence warrants it. That is a practical form of progress even before a final theorem appears.`;

function buildPartVI(group) {
  let markdown = header(specs.VI, 'VI');
  for (const item of group.items) {
    markdown += `## ${item.label}\n\n${take(paragraphsFor(item.url), 1100).join('\n\n')}\n\n`;
  }
  markdown += rhSupplement + '\n\n';
  if (wordCount(markdown) < 6000) {
    const extras = group.items.flatMap((item) => paragraphsFor(item.url, true));
    markdown += `## Further correction-aware notes\n\n`;
    for (const paragraph of extras) {
      if (wordCount(markdown) >= 6150) break;
      if (!markdown.includes(paragraph)) markdown += paragraph + '\n\n';
    }
  }
  markdown += `## What Part VI leaves us with\n\n${specs.VI.conclusion}\n`;
  return markdown;
}

function sections(markdown) {
  return markdown.split(/\n(?=## )/).slice(1).map((chunk) => {
    const lines = chunk.trim().split('\n');
    return { title: lines.shift().replace(/^##\s+/, ''), paragraphs: lines.join('\n').split(/\n\s*\n/).filter((p) => wordCount(p) >= 18 && !p.startsWith('### ')) };
  });
}

function sample(markdown, target) {
  const groups = sections(markdown);
  const quota = Math.floor(target / groups.length);
  return groups.map((section) => `### ${section.title}\n\n${take(section.paragraphs, quota).join('\n\n')}`).join('\n\n');
}

const essays = new Map();
for (const group of site.navGroups) {
  let text;
  if (group.part === 'V') text = buildPartV(group);
  else if (group.part === 'VI') text = buildPartVI(group);
  else text = buildStandard(group);
  essays.set(group.part, text);
  fs.writeFileSync(path.join(output, specs[group.part].file), text);
}

let final = `# The Two Infinities: Eternal Integration of the Self\n\n**A final, all-encompassing accessible synthesis**\n\n*A speculative cosmology by Jim Rankin, UK, 2026*  \n*Accessible website edition · 14 October 2026*\n\n> This synthesis distinguishes standard knowledge, exact internal results, conditional arguments, numerical evidence and TTI conjecture.\n\n## Beginning with the whole\n\nThe Two Infinities is a speculative cosmology about existence as continuing integration. It begins from the contrast between zero and one, imagines reality as a process that cannot become absolute nothing, and follows the consequences through selfhood, geometry, gravity, cosmic history and possible tests. Its central image is not a universe assembled once and left to run. It is a universe that continually relates differences, forms temporary wholes, reaches boundaries and returns through changed conditions.\n\nA framework this broad needs imaginative generosity and evidential discipline. Allow its concepts to connect before reducing them to slogans, but give each claim exactly the support it has earned. A useful model need not be dismissed because it is speculative, and a suggestive analogy must not be promoted into established physics.\n\nThe six Parts form one route. First principles ask what it means for anything, including a self, to persist. Cosmic architecture asks how differences might acquire shape and gravitational significance. Seams and return ask what a cycle can preserve. Tests ask how the world could answer back. Reading Rooms make the corpus inspectable. The Riemann Programme shows how correction-aware proof auditing can improve the project even when it supplies no shortcut.\n\n`;
for (const group of site.navGroups) {
  final += `## Part ${group.part}: ${group.shortLabel}\n\n${sample(essays.get(group.part), 1700)}\n\n`;
}
final += `## A framework measured by what it can learn\n\nThe all-encompassing claim of TTI is not that every recurring shape proves the same hidden mechanism. It is that reality may be understood as persistent integration across differences, with geometry recording ways in which local processes close, reverse and reconnect. To become physics, that proposal must produce lawful maps from arithmetic and topology to measurable fields, units, couplings and observations.\n\nThe open debts are explicit. The Skeletal Splice needs a unique route into an action. Gravity needs a physical scale and conserved source. Electromagnetic phase needs canonical normalisation and a charge spectrum. The halo proposal needs an independent radius and one source explaining motion and lensing. Inherited residue needs a carrier compatible with entropy and causality. Temporal antipodes need a physical comparison channel. None of these debts is paid by analogy, a finite numerical match or the beauty of a torus.\n\nThe project has genuine strengths. It separates standard results from conjectural promotion, allows conventional explanations into its tests, states loss conditions and preserves later corrections over earlier confidence. Most importantly, it has begun to turn wide ideas into narrower questions that observations or mathematics can answer.\n\nA living research framework should expect some proposals to fail. Its measure is whether correction makes the remaining structure clearer; whether a failed test removes freedom rather than inspiring an invisible rescue; and whether an average reader can see where knowledge ends and imagination begins. Eternal integration is most credible not as an escape from correction, but as the willingness to become more coherent through it.\n`;
if (wordCount(final) < 10000) {
  for (const group of site.navGroups) {
    if (wordCount(final) >= 10500) break;
    final += `\n## Further synthesis from Part ${group.part}\n\n${take(sections(essays.get(group.part)).flatMap((section) => section.paragraphs), 900).join('\n\n')}\n`;
  }
}
fs.writeFileSync(path.join(output, 'final-synthesis.md'), final);

const manifest = [];
for (const file of fs.readdirSync(output).filter((name) => name.endsWith('.md')).sort()) {
  const text = fs.readFileSync(path.join(output, file), 'utf8');
  manifest.push({ file, words: wordCount(text) });
}
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const item of manifest) console.log(`${item.words}\t${item.file}`);
