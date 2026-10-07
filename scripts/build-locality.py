# -*- coding: utf-8 -*-
"""Draws the plates for /locality/ and writes src/locality.njk.

Every plate is live vector art computed here rather than traced by hand, so
the curves are the real functions: cos-squared where the theory says
cos-squared, a straight line where the local bound is a straight line.
"""
import math

GOLD, BRIGHT, DIM, MUTED = "#d7b05a", "#f3ddaa", "#cbbb93", "#9f947a"
GREEN, ROSE, BLUE = "#7fae7a", "#c98b6a", "#8fb6d8"
FONT = "Cinzel,Georgia,serif"
SER = "EB Garamond,Georgia,serif"


def txt(x, y, s, size=11, fill=BRIGHT, font=FONT, anchor="start", ls=None, style=None):
    a = ' text-anchor="%s"' % anchor if anchor != "start" else ""
    l = ' letter-spacing="%s"' % ls if ls else ""
    st = ' font-style="%s"' % style if style else ""
    return ('<text x="%g" y="%g" font-family="%s" font-size="%g" fill="%s"%s%s%s>%s</text>'
            % (x, y, font, size, fill, a, l, st, s))


def poly(pts, stroke=GOLD, w=1.3, fill="none", dash=None, op=None):
    d = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' opacity="%s"' % op if op else ""
    return ('<polyline points="%s" fill="%s" stroke="%s" stroke-width="%g"%s%s/>'
            % (" ".join("%.1f,%.1f" % p for p in pts), fill, stroke, w, d, o))


def line(x1, y1, x2, y2, stroke=MUTED, w=1.2, dash=None, op=None, marker=None):
    d = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' opacity="%s"' % op if op else ""
    m = ' marker-end="url(#%s)"' % marker if marker else ""
    return ('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="%g"%s%s%s/>'
            % (x1, y1, x2, y2, stroke, w, d, o, m))


def box(x, y, w, h, stroke=GOLD, fill="rgba(215,176,90,0.05)", r=4, sw=1.1, dash=None):
    d = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s" stroke="%s" stroke-width="%g"%s/>'
            % (x, y, w, h, r, fill, stroke, sw, d))


def circ(cx, cy, r, stroke=GOLD, fill="none", w=1.2, dash=None, op=None):
    d = ' stroke-dasharray="%s"' % dash if dash else ""
    o = ' opacity="%s"' % op if op else ""
    return ('<circle cx="%g" cy="%g" r="%g" fill="%s" stroke="%s" stroke-width="%g"%s%s/>'
            % (cx, cy, r, fill, stroke, w, d, o))


def wrapped(x, y, s, width, size=10, fill=DIM, lead=13, anchor="middle", font=SER):
    """Crude but adequate line breaking for labels inside a diagram."""
    words, lines, cur = s.split(), [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if len(trial) * size * 0.47 > width and cur:
            lines.append(cur)
            cur = wd
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return "".join(txt(x, y + i * lead, l, size, fill, font, anchor) for i, l in enumerate(lines))


def arrowdefs(pfx):
    return ('<defs>'
            '<marker id="%s-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" '
            'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker>'
            '<marker id="%s-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" '
            'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="%s"/></marker>'
            '</defs>' % (pfx, MUTED, pfx, GREEN))


def svg(vb, label, body):
    return ('<svg viewBox="%s" role="img" aria-label="%s">%s</svg>' % (vb, label, body))


# ---------------------------------------------------------------- Plate I
def plate_light_cone():
    p = arrowdefs("lc")
    ox, oy, H = 320, 210, 150
    p += line(60, oy, 580, oy, MUTED, 1.2)
    p += line(ox, 30, ox, 390, MUTED, 1.2)
    p += txt(584, oy + 4, "space", 10, MUTED, SER)
    p += txt(ox, 24, "time", 10, MUTED, SER, "middle")
    # the cones
    p += ('<path d="M%g %g L%g %g L%g %g Z" fill="rgba(215,176,90,0.10)" stroke="%s" stroke-width="1.2"/>'
          % (ox, oy, ox - H, oy - H, ox + H, oy - H, GOLD))
    p += ('<path d="M%g %g L%g %g L%g %g Z" fill="rgba(127,174,122,0.10)" stroke="%s" stroke-width="1.2"/>'
          % (ox, oy, ox - H, oy + H, ox + H, oy + H, GREEN))
    p += txt(ox, oy - 100, "FUTURE", 10, GOLD, FONT, "middle", "2.4")
    p += wrapped(ox, oy - 84, "everything you can still affect", 180, 9, DIM)
    p += txt(ox, oy + 112, "PAST", 10, GREEN, FONT, "middle", "2.4")
    p += wrapped(ox, oy + 126, "everything that could have shaped you", 200, 9, DIM)
    p += txt(130, oy - 6, "ELSEWHERE", 10, ROSE, FONT, "middle", "2.2")
    p += wrapped(130, oy + 10, "no cause can cross; correlation still can", 150, 9, DIM)
    p += txt(510, oy - 6, "ELSEWHERE", 10, ROSE, FONT, "middle", "2.2")
    p += circ(ox, oy, 4.5, BRIGHT, BRIGHT, 1)
    p += txt(ox + 10, oy - 8, "here, now", 10, BRIGHT, SER)
    # two entangled measurements, spacelike separated
    ax, bx, ey = 170, 470, oy - 55
    p += circ(ax, ey, 5, ROSE, "rgba(201,139,106,.5)", 1.2)
    p += circ(bx, ey, 5, ROSE, "rgba(201,139,106,.5)", 1.2)
    p += txt(ax, ey - 12, "A measures", 9.5, ROSE, SER, "middle")
    p += txt(bx, ey - 12, "B measures", 9.5, ROSE, SER, "middle")
    p += line(ax + 6, ey, bx - 6, ey, ROSE, 1.1, "4 4")
    p += txt(ox, ey - 10, "perfectly correlated", 9.5, ROSE, SER, "middle")
    p += txt(ox, ey + 14, "and neither one caused the other", 9.5, MUTED, SER, "middle")
    return svg("0 0 640 420",
               "A spacetime light cone. The future and past cones are causally reachable; the "
               "region called elsewhere is not. Two entangled measurements sit in each other's "
               "elsewhere, perfectly correlated, with no causal line between them.", p)


# --------------------------------------------------------------- Plate II
def plate_bell():
    p = arrowdefs("bl")
    L, R, T, B = 80, 600, 60, 300
    p += line(L, B, R, B, MUTED, 1.3)
    p += line(L, B, L, T, MUTED, 1.3)
    for i in range(5):
        y = B - i * (B - T) / 4.0
        p += line(L - 4, y, L, y, MUTED, 1)
        p += txt(L - 9, y + 3, "%.1f" % (-1 + i * 0.5), 9, MUTED, SER, "end")
    for i in range(7):
        x = L + i * (R - L) / 6.0
        p += line(x, B, x, B + 4, MUTED, 1)
        p += txt(x, B + 17, "%d" % (i * 30), 9, MUTED, SER, "middle")
    p += txt((L + R) / 2, B + 34, "angle between the two settings, in degrees", 10, MUTED, SER, "middle")
    p += txt(L - 9, T - 14, "correlation", 10, MUTED, SER, "end")

    def X(a):  # 0..180 degrees
        return L + (a / 180.0) * (R - L)

    def Y(c):  # -1..1
        return B - ((c + 1) / 2.0) * (B - T)

    # quantum prediction: -cos(2 theta) convention -> use E = -cos(2a) scaled
    q = [(X(a), Y(-math.cos(2 * math.radians(a)))) for a in range(0, 181)]
    p += poly(q, GOLD, 1.8)
    # local-realist bound: the straight saw-tooth
    lr = [(X(0), Y(-1)), (X(90), Y(1)), (X(180), Y(-1))]
    p += poly(lr, GREEN, 1.6, dash="6 5")
    p += line(L, Y(0), R, Y(0), MUTED, 0.8, "2 5")
    p += txt(X(50), Y(-0.86), "quantum mechanics  \u2212cos 2\u03b8", 10, GOLD, SER)
    p += txt(X(96), Y(0.72), "the best any local account can do", 10, GREEN, SER)
    # the gap
    a0 = 22.5
    p += line(X(a0), Y(-math.cos(2 * math.radians(a0))), X(a0), Y(-1 + a0 / 90.0 * 2), ROSE, 1.4)
    p += txt(X(a0) + 6, Y(-0.25), "the gap", 10, ROSE, SER)
    p += txt(X(a0) + 6, Y(-0.25) + 13, "measured, repeatedly", 9, MUTED, SER)
    p += txt(L, T - 26, "WHAT A BELL TEST ACTUALLY MEASURES", 11, BRIGHT, FONT, ls="2.2")
    return svg("0 0 660 360",
               "A graph of correlation against the angle between two detector settings. The quantum "
               "prediction is a smooth cosine curve; the best a local hidden-variable account can "
               "manage is a straight saw-tooth. The two part company around 22.5 degrees, and "
               "experiment follows the cosine.", p)


# -------------------------------------------------------------- Plate III
def plate_nosignal():
    p = arrowdefs("ns")
    p += txt(40, 30, "WHY ENTANGLEMENT CANNOT CARRY A MESSAGE", 11, BRIGHT, FONT, ls="2.2")
    steps = [
        ("Alice chooses a setting", "she may turn her dial any way she likes"),
        ("Alice gets an outcome", "random, 50/50, no matter what she chose"),
        ("Bob looks at his own results", "also random, 50/50, always"),
        ("Bob sees nothing change", "his statistics are identical whatever Alice did"),
    ]
    y = 60
    for i, (h, s) in enumerate(steps):
        p += box(40, y, 250, 52)
        p += txt(52, y + 21, h, 10.5, BRIGHT, SER)
        p += txt(52, y + 38, s, 9.5, DIM, SER)
        if i < 3:
            p += line(165, y + 52, 165, y + 68, MUTED, 1.2, marker="ns-a")
        y += 68
    p += box(330, 60, 270, 120, ROSE, "rgba(201,139,106,0.07)")
    p += txt(345, 84, "AND YET", 10, ROSE, FONT, ls="2.2")
    p += wrapped(465, 106,
                 "when the two lists are brought together afterwards \u2014 by post, by telephone, "
                 "by any ordinary means at or below the speed of light \u2014 they agree far more "
                 "closely than any local story permits.", 250, 10, DIM)
    p += box(330, 200, 270, 128, GREEN, "rgba(127,174,122,0.07)")
    p += txt(345, 224, "THE RULE", 10, GREEN, FONT, ls="2.2")
    p += wrapped(465, 246,
                 "The world is non-local in its correlations and strictly local in its signals. "
                 "Nothing you can do at one end shifts anything observable at the other. This is a "
                 "theorem, not a hope.", 250, 10, DIM)
    p += line(290, 112, 326, 112, ROSE, 1.2, marker="ns-a")
    p += line(290, 250, 326, 250, GREEN, 1.2, marker="ns-g")
    return svg("0 0 640 350",
               "A flow chart: Alice's choice, her random outcome, Bob's random outcome, and Bob "
               "seeing no change. Beside it, the fact that the two lists agree too well when "
               "compared later, and the rule that follows: non-local in correlation, local in signal.", p)


# --------------------------------------------------------------- Plate IV
def plate_ladder():
    p = arrowdefs("ld")
    p += txt(40, 28, "FROM POSSIBLE TO SETTLED: THE LADDER", 11, BRIGHT, FONT, ls="2.2")
    rungs = [
        ("I", "SUPERPOSITION", "Every outcome present at once, with phase: the relations between "
         "possibilities are real and can interfere.", GOLD),
        ("II", "INTERACTION", "The system touches something \u2014 a photon, a molecule, an "
         "instrument, an eye. Nothing has collapsed. Something has been entangled.", GOLD),
        ("III", "DECOHERENCE", "The phase relations leak into the surroundings. Interference goes "
         "out of reach, not out of existence. Fast: picoseconds, often less.", BLUE),
        ("IV", "A RECORD", "Somewhere, something now differs depending on the outcome, and stays "
         "different. This is the step the textbooks hurry past.", ROSE),
        ("V", "A MEMORY MET BY ATTENTION", "A record read by something that holds a previous state "
         "\u2014 our own claim, and the one to weigh sceptically.", GREEN),
        ("VI", "A SETTLED FACT", "One outcome, for everyone who compares notes afterwards.", GREEN),
    ]
    y = 52
    for n, h, s, col in rungs:
        p += box(40, y, 560, 54, col, "rgba(215,176,90,0.04)")
        p += txt(60, y + 33, n, 15, col, FONT)
        p += txt(96, y + 22, h, 10.5, BRIGHT, FONT, ls="1.8")
        p += wrapped(96, y + 40, s, 480, 9.5, DIM, 12, "start")
        y += 64
    p += line(620, 64, 620, y - 20, MUTED, 1.2, marker="ld-a")
    p += txt(628, (64 + y) / 2, "irreversible", 9.5, MUTED, SER, "start")
    return svg("0 0 700 450",
               "Six rungs from superposition to a settled fact: superposition, interaction, "
               "decoherence, a record, a memory met by attention, and a settled fact. The first "
               "four are standard physics; the fifth is the order's own claim.", p)


# ---------------------------------------------------------------- Plate V
def plate_ring():
    p = arrowdefs("rg")
    cx, cy, R = 320, 230, 140
    p += txt(40, 28, "THE RING: HOW THE ORDER HOLDS THEM TOGETHER", 11, BRIGHT, FONT, ls="2.2")
    nodes = [
        ("CONSCIOUSNESS", "that which attends", GOLD),
        ("MEMORY", "the kept difference", ROSE),
        ("POLARITY", "the two-sidedness that makes a difference a difference", GREEN),
        ("CYMATICS", "standing pattern in a medium", BLUE),
        ("THE AETHER", "the field that carries the standing pattern", GOLD),
        ("COLLAPSE", "one outcome, kept", BRIGHT),
    ]
    pts = []
    for i, (h, s, col) in enumerate(nodes):
        a = -math.pi / 2 + i * 2 * math.pi / len(nodes)
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        pts.append((x, y, col))
    for i, (x, y, col) in enumerate(pts):
        j = (i + 1) % len(pts)
        x2, y2 = pts[j][0], pts[j][1]
        dx, dy = x2 - x, y2 - y
        d = math.hypot(dx, dy)
        p += line(x + dx / d * 46, y + dy / d * 46, x2 - dx / d * 50, y2 - dy / d * 50,
                  MUTED, 1.1, marker="rg-a")
    for i, (x, y, col) in enumerate(pts):
        h, s, _ = nodes[i]
        p += circ(x, y, 44, col, "rgba(10,8,14,0.9)", 1.4)
        p += txt(x, y - 2, h, 8.6, col, FONT, "middle", "1.2")
        p += wrapped(x, y + 12, s, 92, 7.6, DIM, 9)
    p += circ(cx, cy, 34, MUTED, "none", 1, "3 4")
    p += txt(cx, cy - 2, "ONE", 10, BRIGHT, FONT, "middle", "2")
    p += txt(cx, cy + 12, "WORLD", 10, BRIGHT, FONT, "middle", "2")
    p += wrapped(cx, 438, "Read it in either direction. That reversibility is the claim, and it is "
                 "the part no experiment has yet tested.", 520, 9.5, MUTED, 12)
    return svg("0 0 640 460",
               "A ring of six nodes - consciousness, memory, polarity, cymatics, the aether and "
               "collapse - each feeding the next, with one world at the centre.", p)


# --------------------------------------------------------------- Plate VI
def plate_cymatics():
    """Chladni-like nodal figures: contours of sin(n pi x) sin(m pi y) - sin(m pi x) sin(n pi y)."""
    p = txt(40, 26, "CYMATICS: THE SAME PLATE, FOUR NOTES", 11, BRIGHT, FONT, ls="2.2")
    modes = [(1, 2), (2, 3), (3, 4), (3, 5)]
    S, pad = 128, 24
    for k, (n, m) in enumerate(modes):
        ox = 40 + k * (S + pad)
        oy = 60
        p += box(ox, oy, S, S, MUTED, "rgba(8,7,12,0.6)", 2, 1)
        # sample the field and draw the zero set as dots
        N = 110
        dots = []
        for i in range(N + 1):
            for j in range(N + 1):
                x, y = i / float(N), j / float(N)
                v = (math.sin(n * math.pi * x) * math.sin(m * math.pi * y)
                     - math.sin(m * math.pi * x) * math.sin(n * math.pi * y))
                if abs(v) < 0.035:
                    dots.append((ox + x * S, oy + y * S))
        p += ('<g fill="%s" opacity="0.85">' % GOLD +
              "".join('<circle cx="%.1f" cy="%.1f" r="0.9"/>' % d for d in dots) + "</g>")
        p += txt(ox + S / 2, oy + S + 18, "n=%d, m=%d" % (n, m), 9.5, DIM, SER, "middle")
    p += wrapped(320, 230,
                 "Sand on a steel plate does not decide where to go. It is left behind wherever the "
                 "plate is not moving \u2014 the nodal lines of the standing wave. Change the note "
                 "and the pattern changes, discretely, with nothing in between: the plate will hold "
                 "this figure or that one and no figure halfway.", 540, 10, DIM, 13)
    return svg("0 0 640 300",
               "Four Chladni nodal figures computed for different mode pairs, showing how a single "
               "plate holds discrete patterns that change abruptly with the driving frequency.", p)


# -------------------------------------------------------------- Plate VII
def plate_polarity():
    p = arrowdefs("pl")
    p += txt(40, 26, "POLARITY: WHY A DIFFERENCE CAN BE KEPT", 11, BRIGHT, FONT, ls="2.2")
    # two poles with field lines
    ax, bx, cy = 190, 450, 160
    for t in range(1, 7):
        k = t / 7.0
        bulge = 150 * k
        p += ('<path d="M%g %g C %g %g, %g %g, %g %g" fill="none" stroke="%s" stroke-width="1" opacity="%.2f"/>'
              % (ax, cy, ax + 60, cy - bulge, bx - 60, cy - bulge, bx, cy, GOLD, 0.55 - 0.05 * t))
        p += ('<path d="M%g %g C %g %g, %g %g, %g %g" fill="none" stroke="%s" stroke-width="1" opacity="%.2f"/>'
              % (ax, cy, ax + 60, cy + bulge, bx - 60, cy + bulge, bx, cy, GOLD, 0.55 - 0.05 * t))
    p += circ(ax, cy, 22, BRIGHT, "rgba(243,221,170,0.12)", 1.4)
    p += circ(bx, cy, 22, ROSE, "rgba(201,139,106,0.12)", 1.4)
    p += txt(ax, cy + 5, "+", 20, BRIGHT, FONT, "middle")
    p += txt(bx, cy + 5, "\u2212", 20, ROSE, FONT, "middle")
    p += wrapped(ax, cy + 46, "one side", 110, 9.5, DIM)
    p += wrapped(bx, cy + 46, "the other", 110, 9.5, DIM)
    p += wrapped(320, 300,
                 "A record requires two states that are not the same and do not spontaneously "
                 "become each other. That is all polarity means here: not good against evil, but "
                 "the barest condition under which anything at all can be written down and stay "
                 "written. No polarity, no memory. No memory, nothing to settle against.",
                 540, 10, DIM, 13)
    return svg("0 0 640 370",
               "Two opposite poles with field lines running between them, under a note explaining "
               "that polarity here means only the two distinguishable states a record needs.", p)


# ------------------------------------------------------------- Plate VIII
def plate_interpretations():
    p = txt(40, 26, "WHAT EACH INTERPRETATION GIVES UP", 11, BRIGHT, FONT, ls="2.2")
    cols = ["locality", "one world", "definite\nvalues", "no special\nobserver"]
    rows = [
        ("Copenhagen", [1, 1, 0, 0]),
        ("Many worlds", [1, 0, 1, 1]),
        ("Bohm \u00b7 pilot wave", [0, 1, 1, 1]),
        ("Objective collapse", [0, 1, 0, 1]),
        ("QBism \u00b7 relational", [1, 1, 0, 0]),
        ("Superdeterminism", [1, 1, 1, 1]),
    ]
    x0, y0, cw, rh = 210, 86, 100, 36
    for i, c in enumerate(cols):
        for k, part in enumerate(c.split("\n")):
            p += txt(x0 + i * cw + cw / 2, 56 + k * 12, part, 9, GOLD, FONT, "middle", "1.2")
    for j, (name, keeps) in enumerate(rows):
        y = y0 + j * rh
        p += line(40, y + rh - 8, x0 + 4 * cw, y + rh - 8, "rgba(215,176,90,0.15)", 1)
        p += txt(48, y + 16, name, 10, BRIGHT, SER)
        for i, k in enumerate(keeps):
            cx = x0 + i * cw + cw / 2
            if k:
                p += circ(cx, y + 11, 7, GREEN, "rgba(127,174,122,0.18)", 1.2)
                p += txt(cx, y + 15, "\u2713", 10, GREEN, SER, "middle")
            else:
                p += circ(cx, y + 11, 7, ROSE, "rgba(201,139,106,0.14)", 1.2)
                p += txt(cx, y + 15, "\u2715", 9, ROSE, SER, "middle")
    p += wrapped(320, 320,
                 "Every column is something we would like to keep and every row is a bill for "
                 "keeping it. Superdeterminism appears to pay nothing, and pays instead with the "
                 "assumption that the experimenter was never free to choose the setting \u2014 "
                 "which is the whole of science's method, sold to save one of its results.",
                 560, 10, DIM, 13)
    return svg("0 0 640 380",
               "A grid of six interpretations of quantum mechanics against four things one might "
               "wish to keep: locality, a single world, definite values, and no special role for "
               "the observer. Each interpretation gives up at least one.", p)


# --------------------------------------------------------------- Plate IX
def plate_eraser():
    p = arrowdefs("er")
    p += txt(40, 26, "THE DELAYED-CHOICE ERASER, HONESTLY DRAWN", 11, BRIGHT, FONT, ls="2.2")
    y = 70
    p += box(40, y, 170, 58, GOLD)
    p += txt(55, y + 24, "Signal photon lands", 10, BRIGHT, SER)
    p += txt(55, y + 40, "the screen records it now", 9, DIM, SER)
    p += line(212, y + 29, 246, y + 29, MUTED, 1.2, marker="er-a")
    p += box(248, y, 170, 58, GOLD)
    p += txt(263, y + 24, "Idler measured later", 10, BRIGHT, SER)
    p += txt(263, y + 40, "which-path kept, or erased", 9, DIM, SER)
    p += line(420, y + 29, 454, y + 29, MUTED, 1.2, marker="er-a")
    p += box(456, y, 160, 58, GREEN)
    p += txt(471, y + 24, "Someone compares", 10, BRIGHT, SER)
    p += txt(471, y + 40, "the two lists, afterwards", 9, DIM, SER)
    y2 = 170
    p += box(40, y2, 280, 86, ROSE, "rgba(201,139,106,0.07)")
    p += txt(56, y2 + 22, "WHAT PEOPLE SAY HAPPENS", 10, ROSE, FONT, ls="1.8")
    p += wrapped(180, y2 + 42, "A choice made now reaches back and changes what the photon did an "
                 "hour ago.", 250, 9.5, DIM)
    p += box(344, y2, 272, 86, GREEN, "rgba(127,174,122,0.07)")
    p += txt(360, y2 + 22, "WHAT HAPPENS", 10, GREEN, FONT, ls="1.8")
    p += wrapped(480, y2 + 42, "The full pattern on the screen never shows interference. It only "
                 "appears once the data are sorted into subsets by the later measurement.",
                 250, 9.5, DIM)
    p += wrapped(320, 290,
                 "Nothing travels backwards. A sorting rule chosen later selects which photons to "
                 "look at together, and some of those subsets interfere. The past is not rewritten; "
                 "it is read in a different order. We say this plainly because the opposite claim "
                 "is the single most common piece of misinformation in this field.",
                 560, 10, DIM, 13)
    return svg("0 0 660 350",
               "A three-step timeline of the delayed-choice quantum eraser, with the popular claim "
               "that the past is rewritten set against what actually happens: subsets of data "
               "sorted after the fact.", p)


# ---------------------------------------------------------------- Plate X
def plate_time():
    p = arrowdefs("tm")
    p += txt(40, 26, "THREE PICTURES OF TIME, AND WHAT EACH COSTS", 11, BRIGHT, FONT, ls="2.2")
    panels = [
        ("PRESENTISM", "only now exists", GOLD,
         "Agrees with how it feels. Disagrees with relativity: two observers cannot agree on which "
         "slice is now."),
        ("THE BLOCK", "past, present and future all equally real", BLUE,
         "Agrees with relativity perfectly. Leaves the passing of time as something that must be "
         "explained away."),
        ("THE GROWING BLOCK", "the past is real and accumulating", GREEN,
         "Keeps both the record and the passage, at the price of a preferred present that "
         "relativity does not provide."),
    ]
    for i, (h, s, col, note) in enumerate(panels):
        x = 40 + i * 194
        p += box(x, 56, 174, 112, col, "rgba(215,176,90,0.04)")
        p += txt(x + 87, 78, h, 9.6, col, FONT, "middle", "1.6")
        p += wrapped(x + 87, 94, s, 150, 9, BRIGHT)
        # little spacetime sketch
        sy = 124
        if i == 0:
            p += line(x + 20, sy, x + 154, sy, BRIGHT, 2)
            p += txt(x + 87, sy + 18, "a single slice", 8.5, MUTED, SER, "middle")
        elif i == 1:
            p += box(x + 20, sy - 22, 134, 44, BLUE, "rgba(143,182,216,0.12)", 2, 1)
            p += txt(x + 87, sy + 30, "all of it, at once", 8.5, MUTED, SER, "middle")
        else:
            p += box(x + 20, sy - 2, 134, 24, GREEN, "rgba(127,174,122,0.12)", 2, 1)
            p += line(x + 20, sy - 2, x + 154, sy - 2, GREEN, 2)
            p += txt(x + 87, sy + 34, "growing upward", 8.5, MUTED, SER, "middle")
        p += wrapped(x + 87, 192, note, 168, 9, DIM, 12)
    p += wrapped(320, 282,
                 "The order works in the growing block, and says so as a preference rather than a "
                 "finding: it is the only one of the three in which a memory is a real addition to "
                 "the world rather than a description of a slice that was always there.",
                 540, 10, MUTED, 13)
    return svg("0 0 640 330",
               "Three panels comparing presentism, the block universe and the growing block "
               "universe, each with a small spacetime sketch and the cost of holding it.", p)


# --------------------------------------------------------------- Plate XI
def plate_ether():
    p = txt(40, 26, "THE SUBSTRATE, AND THE ONE CLAUSE STRUCK OUT", 11, BRIGHT, FONT, ls="2.2")
    # lattice of field points with an excitation
    x0, y0, step, N, M = 60, 60, 36, 15, 6
    for j in range(M):
        for i in range(N):
            x, y = x0 + i * step, y0 + j * step
            d = math.hypot(x - (x0 + 7 * step), y - (y0 + 2.5 * step))
            amp = math.exp(-(d / 70.0) ** 2) * 10
            p += circ(x, y - amp, 1.8 + amp * 0.16, GOLD, GOLD, 0,
                      op="%.2f" % (0.25 + amp * 0.06))
    p += circ(x0 + 7 * step, y0 + 2.5 * step, 46, BRIGHT, "none", 1.1, "4 5")
    p += txt(x0 + 7 * step, y0 + 2.5 * step - 56, "a particle", 10, BRIGHT, SER, "middle")
    p += txt(x0 + 7 * step, y0 + 2.5 * step + 66, "= an excitation of the field", 9.5, DIM, SER, "middle")
    y = 300
    p += box(40, y, 270, 108, GREEN, "rgba(127,174,122,0.07)")
    p += txt(56, y + 22, "WHAT SURVIVED", 10, GREEN, FONT, ls="1.8")
    p += wrapped(175, y + 42, "A universal medium whose excitations are the particles, with "
                 "structure at every point, and a lowest state that is not nothing.", 250, 9.5, DIM)
    p += box(330, y, 270, 108, ROSE, "rgba(201,139,106,0.07)")
    p += txt(346, y + 22, "WHAT WAS STRUCK OUT", 10, ROSE, FONT, ls="1.8")
    p += wrapped(465, y + 42, "One clause only: that the medium has a rest frame you could measure "
                 "your speed against. Michelson and Morley deleted that line and left the rest of "
                 "the page standing.", 250, 9.5, DIM)
    return svg("0 0 640 430",
               "A lattice of field points with a localised excitation, labelled as a particle, "
               "above two panels: what survived of the aether, and the single clause that was "
               "struck out.", p)


PLATES = [
    ("I", "Local, Non-Local, and the Region Called Elsewhere", plate_light_cone, True),
    ("II", "What a Bell Test Actually Measures", plate_bell, True),
    ("III", "The No-Signalling Fence", plate_nosignal, False),
    ("IV", "From Possible to Settled: the Ladder", plate_ladder, True),
    ("V", "The Ring", plate_ring, True),
    ("VI", "Cymatics: the Same Plate, Four Notes", plate_cymatics, False),
    ("VII", "Polarity, Stripped to Its Working Part", plate_polarity, False),
    ("VIII", "What Each Interpretation Gives Up", plate_interpretations, True),
    ("IX", "The Delayed-Choice Eraser, Honestly Drawn", plate_eraser, False),
    ("X", "Three Pictures of Time", plate_time, False),
    ("XI", "The Substrate, and the One Clause Struck Out", plate_ether, True),
]

if __name__ == "__main__":
    out = {}
    for num, title, fn, grand in PLATES:
        out[num] = (title, fn(), grand)
    import json
    with open("/tmp/plates.json", "w") as f:
        json.dump({k: [v[0], v[1], v[2]] for k, v in out.items()}, f)
    print("plates:", ", ".join(out))
