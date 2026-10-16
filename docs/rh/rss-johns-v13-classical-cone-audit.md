# Johns Part II v1.3: source audit of the classical-cone corollary

**Date:** 16 October 2026  
**Scope:** Release identity, shipped finite-file manifest, Lean dependence, and logical force of Corollary 8.2. This is a source audit, not a peer review of the analytic paper or an RH proof.

## Findings

### 1. Release and files

The `v1.3` tag resolves to commit [`231428659e8ab69e432902c5fb04945a8f4edc93`](https://github.com/nic410/zeta-sharpness-uniqueness/tree/231428659e8ab69e432902c5fb04945a8f4edc93). The repository's `main` was [`9051fa795f5e2ede9395f8a9030a4af275951a3d`](https://github.com/nic410/zeta-sharpness-uniqueness/commit/9051fa795f5e2ede9395f8a9030a4af275951a3d); comparing it to the tag showed only a four-line README change. Thus the pinned v1.3 paper/Lean source had not changed on `main` in that comparison. All 47 entries in the release's `paper/anc/SHA256SUMS` verified with `sha256sum -c` from the manifest directory. The release notes describe the added Corollary 8.2 and say its Lean theorem is formalized without a new axiom.

The Lean log pins Lean 4 `v4.33.0-rc2`, Mathlib commit `51e6992efd06126df61a496bebf8f49482a4e129`, Zeta23 commit `fbdc36bbf17d20af3fd0447c6d1a8a02773c9844`, and Part I v1.3 commit `5bed664909d161fb148a0232e715f55f9a520f1b`. The source declares two Part-II ledger axioms: `voronoi_decoupling` and `exists_integer_critical_object`; Part II also uses five Part-I ledger axioms for the headline Corollary 8.2. `lake` was not installed in this workspace, so I did not rebuild Lean. The checked-in axiom/build logs and Lean dependency pins were inspected; this is not an independent Lean rebuild.

### 2. What Corollary 8.2 says—and what it does not say

The paper's Corollary 8.2(c) states, for `0 ≤ ℓ ≤ ξ₂`, equivalences among RH, existence of an admissible positive pair, positivity of the archimedean functional on the gap cone, and nonnegativity/vanishing of the optimum. At `ℓ=0`, it specializes to the classical OPS cone; the final sentence is precisely the standard Weil/OPS equivalence

\[
\mathrm{RH}\quad\Longleftrightarrow\quad \mathcal A(F)\ge0\quad\text{for every admissible }F\ge0,\ \widehat F\ge0.
\]

This is a characterization, not a proof of the universal positivity statement. The paper's additional sharpness result is that its explicit `F=\Xi^2H` reaches zero archimedean slack while satisfying the stated constraints, and that the optimized OPS value is exactly zero iff RH (negative if RH fails). A single exact magic function with zero slack does not establish positivity for every cone element. The `\Xi^2` factor vanishes at every nontrivial zeta zero regardless of its real part, so the construction does not locate those zeros.

### 3. The formalization boundary is material

Lean's `rh_iff_kappaOPS_zero` is a theorem declaration, but its dependency list includes the two Part-II axioms `exists_integer_critical_object` and `voronoi_decoupling`, plus Part-I axioms `duality_no_gap`, `explicit_formula`, `logic_b`, `xi_decay`, and `zero_support_rigidity` (as well as standard Lean axioms). The v1.3 `LEDGER.md` explicitly says the object axiom packages the analytic construction, coefficient positivity, global nonnegativity of `\widehat G_H`, the strict window condition `\widehat G_H>0` on `[0,ξ₂)`, and certified positivity of `H` on the real axis. The strict window condition feeds `FT_window`, then the transfer-across-gap argument in Appendix C. The paper gives a proof route for this input; Lean does not formalize that construction/proof. The Voronoi identity is likewise a Part-II axiom, described as proved in the paper and independently re-proved by a referee, not verified by this Lean spine.

This is a disclosed formalization boundary, not by itself a contradiction in the paper's mathematics. I found no concrete mathematical counterexample in the release audit. The repository itself says the preprint has not received human expert review. The appropriate research task is to check the paper-level arguments for the two axiomatized inputs and their certificates, not to describe the Lean theorem as axiom-free or as an RH proof.

## Audit basis and limitations

- [Part II v1.3 release](https://github.com/nic410/zeta-sharpness-uniqueness/releases/tag/v1.3) and [pinned repository tree](https://github.com/nic410/zeta-sharpness-uniqueness/tree/231428659e8ab69e432902c5fb04945a8f4edc93).
- Inspected `paper/sections/08-assembly.tex`, `paper/sections/C-gap.tex`, `paper/anc/lean/NoGap.lean`, `LEDGER.md`, `FAITHFUL.md`, `axioms.log`, `lake-manifest.json`, and `scripts/Statements.baseline.txt` at the pinned tag; verified all 47 entries of `paper/anc/SHA256SUMS`.
- The logical consequence of the universal cone positivity criterion is classical and does not provide new RH evidence. Numerical certificate validity, the complete paper-level proof of the object, and the Part-I analytic axioms have not been independently re-proved in this pass.

## Next useful proof-search step

Do not spend another pass restating `RH iff` OPS positivity. Choose one paper-level axiom with direct proof leverage—first the strict-window/global positivity package in `exists_integer_critical_object`, or the Voronoi decoupling identity—and carry out a focused independent derivation with all hypotheses, convergence estimates, and certificate inputs exposed. In parallel, continue the TTI-to-\(\xi\) search only through a defined admissible map; the existing finite positive blocks and TTI filters do not supply that map or universal positivity.