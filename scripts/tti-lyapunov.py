#!/usr/bin/env python3
"""Stress test: compute an actual Lyapunov exponent for the driven damped
pendulum, the system the framework's thesis sentence invokes when it says the
swing is "out of control".

Method: integrate the trajectory and the tangent-space (variational) equations
together with RK4, renormalising the tangent vector at fixed intervals and
accumulating the logs. Reported with a control case that should give zero.

    theta'' + q theta' + sin theta = A cos(w t)

State x = (theta, omega, phase). Tangent d = (dtheta, domega).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "ops" / "tti-lyapunov.json"


def derivs(x, q, A, w):
    th, om, t = x
    return (om, -q * om - math.sin(th) + A * math.cos(w * t), 1.0)


def tangent(x, d, q):
    th, om, _ = x
    dth, dom = d
    return (dom, -q * dom - math.cos(th) * dth)


def step(x, d, h, q, A, w):
    def add(a, b, s):
        return tuple(ai + s * bi for ai, bi in zip(a, b))

    k1 = derivs(x, q, A, w); l1 = tangent(x, d, q)
    k2 = derivs(add(x, k1, h / 2), q, A, w); l2 = tangent(add(x, k1, h / 2), add(d, l1, h / 2), q)
    k3 = derivs(add(x, k2, h / 2), q, A, w); l3 = tangent(add(x, k2, h / 2), add(d, l2, h / 2), q)
    k4 = derivs(add(x, k3, h), q, A, w); l4 = tangent(add(x, k3, h), add(d, l3, h), q)
    x = tuple(xi + h / 6 * (a + 2 * b + 2 * c + e) for xi, a, b, c, e in zip(x, k1, k2, k3, k4))
    d = tuple(di + h / 6 * (a + 2 * b + 2 * c + e) for di, a, b, c, e in zip(d, l1, l2, l3, l4))
    return x, d


def lyapunov(q, A, w, t_max=20000.0, h=0.005, t_skip=200.0, renorm_every=1.0):
    x = (0.2, 0.0, 0.0)
    d = (1e-8, 0.0)
    # transient
    n_skip = int(t_skip / h)
    for _ in range(n_skip):
        x, d = step(x, d, h, q, A, w)
    norm = math.hypot(*d)
    d = (d[0] / norm, d[1] / norm)

    total = 0.0
    t = 0.0
    n_renorm = int(renorm_every / h)
    series = []
    while t < t_max:
        for _ in range(n_renorm):
            x, d = step(x, d, h, q, A, w)
        norm = math.hypot(*d)
        total += math.log(norm)
        d = (d[0] / norm, d[1] / norm)
        t += renorm_every
        if int(t) % 2000 == 0:
            series.append((t, total / t))
    return total / t, series


CASES = [
    ("chaotic", dict(q=0.5, A=1.2, w=2 / 3), "the standard chaotic parameter set"),
    ("periodic", dict(q=0.5, A=0.5, w=2 / 3), "control: a drive too weak to break periodicity"),
    ("undriven", dict(q=0.5, A=0.0, w=2 / 3), "control: no drive at all, motion decays to rest"),
    ("chaotic2", dict(q=0.5, A=1.35, w=2 / 3), "a second chaotic set, to show it is not one lucky point"),
]

if __name__ == "__main__":
    out = {}
    for name, par, note in CASES:
        lam, series = lyapunov(**par)
        out[name] = {"params": par, "lambda": lam, "note": note,
                     "convergence": [[t, round(v, 5)] for t, v in series[-4:]]}
        print(f"{name:10s} q={par['q']} A={par['A']} w={par['w']:.4f} -> "
              f"lambda = {lam:+.5f} per unit time   ({note})")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2))
    print("wrote", OUT)
