#!/usr/bin/env python3
"""Numerical stress tests the framework can run on itself.

1. Repdigit triangular numbers per base. The spiral chapter leans on
   666 = T36 being a repdigit in base ten. If most bases have comparable
   repdigit triangulars, base ten is not special and the claim is notation.
2. Pisano periods, to see whether pi(10) = 60 stands out.
3. The splice deposit, to check d(Pi_n) really does approach phi^2/sqrt5.
"""
import math

LIMIT = 10 ** 12


def tri(n):
    return n * (n + 1) // 2


def digits(x, b):
    d = []
    while x:
        d.append(x % b)
        x //= b
    return d[::-1] or [0]


def repdigit_tris(b, limit=LIMIT):
    out, n = [], 1
    while tri(n) <= limit:
        t = tri(n)
        d = digits(t, b)
        if len(d) >= 3 and len(set(d)) == 1 and d[0] != 0:
            out.append((n, t, "".join("0123456789abcdefghijklmnopqrstuvwxyz"[k] for k in d)))
        n += 1
    return out


def pisano(b):
    a, c, p = 0, 1, 0
    for i in range(1, b * b * 6 + 1):
        a, c = c, (a + c) % b
        if a == 0 and c == 1:
            return i
    return None


print("== 1. repdigit triangular numbers (3+ identical digits), T_n <= 1e12")
hits = {}
for b in range(2, 37):
    r = repdigit_tris(b)
    hits[b] = r
    if r:
        print(f"  base {b:2d}: {len(r):2d}  " + ", ".join(f"T{n}={t}={s}_{b}" for n, t, s in r[:4]))
bases_with = [b for b, r in hits.items() if r]
print(f"  bases 2-36 with at least one: {len(bases_with)} of 35 -> {bases_with}")
print(f"  base 10 count: {len(hits[10])}; median count over bases with any: "
      f"{sorted(len(hits[b]) for b in bases_with)[len(bases_with)//2]}")

print("\n== 2. Pisano periods")
ps = {b: pisano(b) for b in range(2, 41)}
print("  pi(10) =", ps[10])
print("  ranked:", sorted(((v, k) for k, v in ps.items() if v), reverse=True)[:6])
print("  pi(10)/10 =", ps[10] / 10, " pi(b)/b max:",
      max((v / k, k) for k, v in ps.items() if v))

print("\n== 3. splice deposit")
phi = (1 + 5 ** 0.5) / 2
target = phi ** 2 / 5 ** 0.5
F = [0, 1]
for _ in range(90):
    F.append(F[-1] + F[-2])
R = [F[n + 2] - 1 for n in range(1, 40)]
d = [(R[i + 1] - R[i]) / (R[i] - R[i - 1]) if R[i] - R[i - 1] else 0 for i in range(1, 30)]
print("  phi^2/sqrt5 =", f"{target:.12f}")
print("  ratio at n=10,20,29:", [f"{d[i]:.12f}" for i in (10, 20, 28)])
print("  note: ratio -> phi =", f"{phi:.12f}", "not phi^2/sqrt5")
Pi = [R[n] / (n + 1) for n in range(len(R))]
print("  R_n/n at n=10,25,38:", [f"{R[i]/(i+1):.6f}" for i in (10, 25, 38)])
