#!/usr/bin/env python3
"""Stress test: the smallest simulation with two opposed infinities, built to
find out whether an arrow of time appears without one being put there by hand.

Three models, each answering one question.

  A. BAKER   An exactly reversible, measure-preserving map on the unit square:
             the two infinities as stretching (upward, countable) against
             folding (downward, into the interval). Reversible by construction,
             so any arrow found here is an artefact. Run forward AND backward
             from the same initial blob and compare.

  B. BRANCH  A walk on a tree of scales: from level n there are b ways down
             (refinement — the interval subdivides) and one way up (counting).
             Choose uniformly among the available states. This is the
             framework's asymmetry stated as directly as it can be stated.

  C. SWAP    Model B with the measure changed and nothing else: choose
             uniformly among *directions* rather than among states. If the
             arrow survives this it belongs to the state space. If it does
             not, it belonged to the measure.

Entropy production is measured as the Kullback-Leibler divergence per step
between the forward path distribution and its time reverse, which is zero
exactly when the dynamics is statistically reversible.
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "ops" / "tti-toy-integrator.json"
random.seed(20261009)

# ----------------------------------------------------------------- A. baker
def baker(x, y):
    """Area-preserving, invertible. Stretch by two in x, fold into y."""
    if x < 0.5:
        return 2 * x, y / 2
    return 2 * x - 1, (y + 1) / 2


def baker_inv(x, y):
    if y < 0.5:
        return x / 2, 2 * y
    return (x + 1) / 2, 2 * y - 1


def coarse_entropy(points, k=6):
    """Shannon entropy of the occupied cells of a 2^-k grid, in bits."""
    n = 1 << k
    cells = {}
    for x, y in points:
        c = (min(int(x * n), n - 1), min(int(y * n), n - 1))
        cells[c] = cells.get(c, 0) + 1
    tot = len(points)
    return -sum((v / tot) * math.log2(v / tot) for v in cells.values())


def run_baker(steps=14, npts=20000, blob=0.02):
    pts = [(0.5 + random.uniform(-blob, blob), 0.5 + random.uniform(-blob, blob))
           for _ in range(npts)]
    fwd, bwd = [], []
    a = list(pts)
    b = list(pts)
    for _ in range(steps + 1):
        fwd.append(coarse_entropy(a))
        bwd.append(coarse_entropy(b))
        a = [baker(*p) for p in a]
        b = [baker_inv(*p) for p in b]
    return fwd, bwd


# ---------------------------------------------------------------- B/C. walk
def run_walk(b=2, steps=200000, uniform_over="states"):
    """Return drift per step and KL entropy production per step."""
    if uniform_over == "states":
        p_down = b / (b + 1.0)
    else:                      # uniform over directions: down or up, 50/50
        p_down = 0.5
    p_up = 1.0 - p_down
    level = 0.0
    down = 0
    for _ in range(steps):
        if random.random() < p_down:
            level += 1
            down += 1
        else:
            level -= 1
    drift = level / steps
    # KL divergence per step between the forward step distribution and its
    # reverse; zero iff the two directions are equally likely.
    if min(p_down, p_up) <= 0:
        kl = float("inf")
    else:
        kl = (p_down - p_up) * math.log(p_down / p_up)
    return {"p_down": p_down, "drift_per_step": drift,
            "entropy_production_per_step_nats": kl,
            "measured_fraction_down": down / steps}


if __name__ == "__main__":
    res = {}

    fwd, bwd = run_baker()
    res["baker"] = {
        "forward_entropy_bits": [round(v, 4) for v in fwd],
        "backward_entropy_bits": [round(v, 4) for v in bwd],
        "forward_rise": round(fwd[-1] - fwd[0], 4),
        "backward_rise": round(bwd[-1] - bwd[0], 4),
        "asymmetry": round(abs((fwd[-1] - fwd[0]) - (bwd[-1] - bwd[0])), 4),
    }
    print("A. baker (reversible):")
    print(f"   entropy rises {res['baker']['forward_rise']:+.3f} bits forward")
    print(f"   entropy rises {res['baker']['backward_rise']:+.3f} bits BACKWARD")
    print(f"   asymmetry between the two directions: {res['baker']['asymmetry']:.3f} bits")

    res["branch"] = {str(b): run_walk(b=b) for b in (2, 3, 5, 10)}
    print("B. branching walk, uniform over states:")
    for b, r in res["branch"].items():
        print(f"   b={b:>2}  p_down={r['p_down']:.3f}  drift={r['drift_per_step']:+.4f}/step  "
              f"entropy production={r['entropy_production_per_step_nats']:.4f} nats/step")

    res["swap"] = {str(b): run_walk(b=b, uniform_over="directions") for b in (2, 10)}
    print("C. same tree, measure swapped to uniform over directions:")
    for b, r in res["swap"].items():
        print(f"   b={b:>2}  p_down={r['p_down']:.3f}  drift={r['drift_per_step']:+.4f}/step  "
              f"entropy production={r['entropy_production_per_step_nats']:.4f} nats/step")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(res, indent=2))
    print("wrote", OUT)
