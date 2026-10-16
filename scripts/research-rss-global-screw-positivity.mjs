#!/usr/bin/env node
/**
 * Sixth-stage RSS/RH investigation.
 *
 * Goal: make a serious arithmetic and operator-theoretic attempt at proving
 * global positivity of Suzuki's Riemann screw potential Psi, equivalently the
 * positive semidefiniteness of its stationary-increment kernel G_g.
 *
 * The program reproduces, on a finite diagnostic domain, the exact classical
 * weighted-Chebyshev bridge, workload synchronization, recovery-witness
 * dynamics, active reserve balance V=C-J, and normalized arrival-centroid
 * criterion. It also checks two structural obstructions:
 *
 *   1. every individual delayed hinge has an indefinite screw kernel;
 *   2. extracting von Mangoldt weights from the all-integer repetition ledger
 *      uses signed Möbius inversion.
 *
 * None of the finite checks proves an infinite-tail statement or RH.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "docs/rh/rss-global-screw-positivity-results.json");
const PI = Math.PI;
const EULER_GAMMA = 0.5772156649015329;
const CATALAN = 0.91596559417721901505;
const ALPHA = 0.5 * (Math.log(8 * PI) + EULER_GAMMA + PI / 2);
const ARCHIMEDEAN_CONSTANT = PI * PI / 4 + 2 * CATALAN;
const CLASSICAL_LEVEL = ARCHIMEDEAN_CONSTANT - 8;
const T_MAX = 12;
const EVENT_LIMIT = Math.ceil(Math.exp(T_MAX)) + 1000;

function close(actual, expected, tolerance, label) {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert.ok(
    Math.abs(actual - expected) <= tolerance * scale,
    `${label}: expected ${actual} to equal ${expected} within ${tolerance}`
  );
}

function minimumBy(items, selector) {
  return items.reduce((best, item) => selector(item) < selector(best) ? item : best);
}

function maximumBy(items, selector) {
  return items.reduce((best, item) => selector(item) > selector(best) ? item : best);
}

// ---------------------------------------------------------------------------
// 1. Exact prime-power event state on the finite diagnostic domain.
// ---------------------------------------------------------------------------

function vonMangoldtValues(limit) {
  const isPrime = new Uint8Array(limit + 1);
  isPrime.fill(1, 2);
  for (let prime = 2; prime * prime <= limit; prime++) {
    if (!isPrime[prime]) continue;
    for (let multiple = prime * prime; multiple <= limit; multiple += prime) {
      isPrime[multiple] = 0;
    }
  }

  const values = new Float64Array(limit + 1);
  for (let prime = 2; prime <= limit; prime++) {
    if (!isPrime[prime]) continue;
    for (let power = prime; power <= limit;) {
      values[power] = Math.log(prime);
      if (power > Math.floor(limit / prime)) break;
      power *= prime;
    }
  }
  return values;
}

const mangoldt = vonMangoldtValues(EVENT_LIMIT);
const weightedPrefix = new Float64Array(EVENT_LIMIT + 1);
const logWeightedPrefix = new Float64Array(EVENT_LIMIT + 1);
for (let n = 1; n <= EVENT_LIMIT; n++) {
  const weight = mangoldt[n] / Math.sqrt(n);
  weightedPrefix[n] = weightedPrefix[n - 1] + weight;
  logWeightedPrefix[n] = logWeightedPrefix[n - 1] + weight * Math.log(n);
}

const events = [];
for (let n = 2; n <= EVENT_LIMIT; n++) {
  if (mangoldt[n] > 0) {
    events.push({
      q: n,
      t: Math.log(n),
      weight: mangoldt[n] / Math.sqrt(n),
      W: weightedPrefix[n],
      L: logWeightedPrefix[n]
    });
  }
}

assert.ok(events.at(-1).t > T_MAX, "event sieve must extend beyond T_MAX");

function positiveOddQuarterSquareSeries(t) {
  const ratio = Math.exp(-2 * t);
  let power = 1;
  let result = 0;
  for (let m = 0; m < 1_000_000; m++) {
    const term = power / (4 * m + 1) ** 2;
    result += term;
    if (term < 1e-16 * Math.max(1, result)) return result;
    power *= ratio;
  }
  throw new Error(`odd-quarter square series did not converge at t=${t}`);
}

function archimedeanReservoir(t) {
  if (Math.abs(t) < 1e-15) return 0;
  return 8 * (Math.cosh(t / 2) - 1) - ALPHA * t
    + ARCHIMEDEAN_CONSTANT
    - 4 * Math.exp(-t / 2) * positiveOddQuarterSquareSeries(t);
}

function archimedeanDerivative(t) {
  const u = Math.exp(-t / 2);
  return 4 * Math.sinh(t / 2) - ALPHA + Math.atanh(u) + Math.atan(u);
}

function archimedeanSecondDerivative(t) {
  const x = Math.exp(t);
  return (x ** 3 - x - 1) / (Math.sqrt(x) * (x * x - 1));
}

function arithmeticLoading(t) {
  const x = Math.exp(t);
  const cutoff = Math.min(EVENT_LIMIT, Math.floor(x + 1e-10));
  return t * weightedPrefix[cutoff] - logWeightedPrefix[cutoff];
}

function arithmeticPsi(input) {
  const t = Math.abs(input);
  assert.ok(t <= T_MAX + 1e-12, `Psi sample ${t} exceeds ${T_MAX}`);
  return archimedeanReservoir(t) - arithmeticLoading(t);
}

// ---------------------------------------------------------------------------
// 2. Exact classical bridge and workload synchronization.
// ---------------------------------------------------------------------------

function archimedeanTailRemainder(x) {
  let result = 0;
  for (let m = 1; m < 1_000_000; m++) {
    const term = 4 * x ** (-(4 * m + 1) / 2) / (4 * m + 1) ** 2;
    result += term;
    if (term < 1e-16 * Math.max(1, result)) return result;
  }
  throw new Error(`archimedean tail did not converge at x=${x}`);
}

function derivativeRemainder(x) {
  let result = 0;
  for (let m = 1; m < 1_000_000; m++) {
    const term = 2 * x ** (-(4 * m + 1) / 2) / (4 * m + 1);
    result += term;
    if (term < 1e-16 * Math.max(1, result)) return result;
  }
  throw new Error(`derivative remainder did not converge at x=${x}`);
}

function classicalSmoothedError(t) {
  return arithmeticLoading(t) - 4 * Math.exp(t / 2);
}

function classicalBridgePsi(t) {
  const x = Math.exp(t);
  return CLASSICAL_LEVEL - ALPHA * t
    - classicalSmoothedError(t) - archimedeanTailRemainder(x);
}

function workloadAtEvent(event) {
  return event.W - archimedeanDerivative(event.t);
}

function synchronizedWorkloadAtEvent(event) {
  const weightedError = event.W - 2 * Math.sqrt(event.q);
  return weightedError + ALPHA - derivativeRemainder(event.q);
}

const bridgeCheckTimes = [
  0.05, 0.2, Math.log(2), 1, 2, 4, 6, 8, 10, 12
];
const classicalBridgeChecks = bridgeCheckTimes.map((t) => {
  const direct = arithmeticPsi(t);
  const bridge = classicalBridgePsi(t);
  close(direct, bridge, 3e-12, `classical bridge at t=${t}`);
  return { t, x: Math.exp(t), direct, bridge, absoluteError: Math.abs(direct - bridge) };
});

const synchronizationChecks = events
  .filter((event) => event.t <= T_MAX)
  .filter((_, index) => index % 997 === 0)
  .map((event) => {
    const direct = workloadAtEvent(event);
    const synchronized = synchronizedWorkloadAtEvent(event);
    close(direct, synchronized, 5e-12, `workload synchronization at q=${event.q}`);
    return {
      q: event.q,
      direct,
      synchronized,
      absoluteError: Math.abs(direct - synchronized)
    };
  });

// The Part-2 Chebyshev-memory barrier B(x) is negative on x>=2. A symmetric
// estimate |R|<=E inserted into its positive memory kernel can only produce a
// nonnegative upper bound, so it cannot prove I_R(x)<=B(x)<0.
function chebyshevMemoryBarrier(x) {
  const t = Math.log(x);
  return archimedeanReservoir(t) - 4 * Math.sqrt(x) + t + 4;
}

const barrierChecks = [2, 10, 100, 10_000, Math.exp(T_MAX)].map((x) => ({
  x,
  barrier: chebyshevMemoryBarrier(x)
}));
assert.ok(barrierChecks.every(({ barrier }) => barrier < 0));

// ---------------------------------------------------------------------------
// 3. Recovery witnesses and the exact reserve/cost/capacity balance.
// ---------------------------------------------------------------------------

function bisectIncreasing(target, low, high, fn) {
  assert.ok(fn(low) <= target && target <= fn(high));
  for (let iteration = 0; iteration < 80; iteration++) {
    const middle = (low + high) / 2;
    if (fn(middle) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

const recoveryWitnesses = [];
let activeEntry = null;
let activeEventCount = 0;

for (let index = 0; index < events.length - 1; index++) {
  const event = events[index];
  const next = events[index + 1];
  if (event.t > T_MAX) break;

  const workload = workloadAtEvent(event);
  if (workload > 0 && activeEntry === null) {
    activeEntry = {
      ...event,
      index,
      E: arithmeticPsi(event.t),
      workload
    };
    activeEventCount = 0;
  }

  if (workload <= 0) {
    // Smooth drift decreases workload between events, so an episode cannot
    // already be active here if the event's post-jump workload is nonpositive.
    assert.equal(activeEntry, null);
    continue;
  }

  activeEventCount++;
  const serviceWindow = archimedeanDerivative(next.t) - archimedeanDerivative(event.t);
  const preNextWorkload = event.W - archimedeanDerivative(next.t);

  if (preNextWorkload < 0) {
    assert.ok(activeEntry !== null);
    const recoveryTime = bisectIncreasing(
      event.W,
      event.t,
      next.t,
      archimedeanDerivative
    );
    const a = activeEntry.t;
    const s = event.t;
    const episodeLength = s - a;
    const terminalLoad = event.W - activeEntry.W;
    const tau = recoveryTime;
    const serviceFirstMoment =
      (tau - a) * archimedeanDerivative(tau)
      - archimedeanReservoir(tau)
      + archimedeanReservoir(a);
    const capacity = activeEntry.E - serviceFirstMoment + episodeLength * terminalLoad;

    let cost = 0;
    let preterminalLoad = 0;
    let arrivalFirstMoment = 0;
    for (let inner = activeEntry.index + 1; inner <= index; inner++) {
      const arrival = events[inner];
      cost += arrival.weight * (s - arrival.t);
      if (inner < index) {
        preterminalLoad += arrival.weight;
        arrivalFirstMoment += (arrival.t - a) * arrival.weight;
      }
    }

    // Avoid relying on object identity lookup in any future refactor.
    const directCost = (s * (event.W - activeEntry.W))
      - (event.L - activeEntry.L);
    close(cost, directCost, 2e-11, `smoothed cost at q=${event.q}`);

    const reserve = archimedeanReservoir(tau) - event.W * tau + event.L;
    const actualMinimum = arithmeticPsi(tau);
    close(reserve, capacity - cost, 3e-10, `reserve balance at q=${event.q}`);
    close(reserve, actualMinimum, 3e-10, `recovery minimum at q=${event.q}`);
    assert.ok(workload > 0 && workload < serviceWindow);

    let centroid = null;
    let criticalCentroid = null;
    let centroidSlack = null;
    let normalizedReserve = null;
    let frontLoadingBound = 0;
    let frontLoadingCloses = true;

    if (episodeLength > 0 && preterminalLoad > 0) {
      const rectangle = episodeLength * preterminalLoad;
      centroid = arrivalFirstMoment / rectangle;
      criticalCentroid = 1 - capacity / rectangle;
      centroidSlack = centroid - criticalCentroid;
      normalizedReserve = reserve / rectangle;
      frontLoadingBound = rectangle;
      frontLoadingCloses = rectangle <= capacity;
      close(cost, (1 - centroid) * rectangle, 3e-10, `centroid cost at q=${event.q}`);
      close(
        centroidSlack,
        normalizedReserve,
        3e-10,
        `normalized reserve at q=${event.q}`
      );
      assert.ok(centroid >= -1e-12 && centroid <= 1 + 1e-12);
    }

    recoveryWitnesses.push({
      entryPrimePower: activeEntry.q,
      witnessPrimePower: event.q,
      nextPrimePower: next.q,
      activeEvents: activeEventCount,
      entryTime: a,
      witnessTime: s,
      recoveryTime,
      entryClearance: activeEntry.E,
      witnessWorkload: workload,
      serviceWindow,
      terminalLoad,
      preterminalLoad,
      arrivalFirstMoment,
      cost,
      capacity,
      reserve,
      actualMinimum,
      centroid,
      criticalCentroid,
      centroidSlack,
      normalizedReserve,
      frontLoadingBound,
      frontLoadingCloses
    });

    activeEntry = null;
    activeEventCount = 0;
  }
}

assert.ok(recoveryWitnesses.length > 0);
assert.ok(recoveryWitnesses.every(({ reserve }) => reserve > 0));
const multiEventWitnesses = recoveryWitnesses.filter(({ centroid }) => centroid !== null);
assert.ok(multiEventWitnesses.length > 0);

const minimumReserveWitness = minimumBy(recoveryWitnesses, ({ reserve }) => reserve);
const minimumCentroidSlackWitness = minimumBy(
  multiEventWitnesses,
  ({ centroidSlack }) => centroidSlack
);
const maximumCriticalCentroidWitness = maximumBy(
  multiEventWitnesses,
  ({ criticalCentroid }) => criticalCentroid
);
const frontLoadingClosureCount = recoveryWitnesses
  .filter(({ frontLoadingCloses }) => frontLoadingCloses).length;
const frontLoadingMultiEventClosureCount = multiEventWitnesses
  .filter(({ frontLoadingCloses }) => frontLoadingCloses).length;

// ---------------------------------------------------------------------------
// 4. Operator and RSS extraction obstructions.
// ---------------------------------------------------------------------------

function delayedHinge(t, delay) {
  return Math.max(Math.abs(t) - delay, 0);
}

function delayedHingeScrewEntry(x, y, delay) {
  return delayedHinge(x, delay) + delayedHinge(y, delay)
    - delayedHinge(x - y, delay);
}

// If delay < x < y and y-x < delay, writing X=x-delay and Y=y-delay gives
// determinant 4XY-(X+Y)^2=-(X-Y)^2<0. Thus every individual delayed hinge
// has an indefinite 2x2 screw matrix.
const hingeExample = { delay: 1, x: 2, y: 2.5 };
const hingeMatrix = [hingeExample.x, hingeExample.y].map((x) =>
  [hingeExample.x, hingeExample.y].map((y) =>
    delayedHingeScrewEntry(x, y, hingeExample.delay)
  )
);
const hingeDeterminant = hingeMatrix[0][0] * hingeMatrix[1][1]
  - hingeMatrix[0][1] * hingeMatrix[1][0];
close(hingeDeterminant, -((hingeExample.x - hingeExample.y) ** 2), 1e-15,
  "delayed-hinge determinant");
assert.ok(hingeDeterminant < 0);

// The primitive/repeated ledger identity log n = sum_{d|n} Lambda(d) is
// inverted by Lambda(n)=sum_{d|n} mu(d) log(n/d). The inversion is signed.
function mobiusValues(limit) {
  const mu = new Int8Array(limit + 1);
  const primes = [];
  const composite = new Uint8Array(limit + 1);
  mu[1] = 1;
  for (let n = 2; n <= limit; n++) {
    if (!composite[n]) {
      primes.push(n);
      mu[n] = -1;
    }
    for (const prime of primes) {
      const product = n * prime;
      if (product > limit) break;
      composite[product] = 1;
      if (n % prime === 0) {
        mu[product] = 0;
        break;
      }
      mu[product] = -mu[n];
    }
  }
  return mu;
}

const MOBIUS_LIMIT = 10_000;
const mobius = mobiusValues(MOBIUS_LIMIT);
let maximumMobiusInversionError = 0;
let positiveMobiusCount = 0;
let negativeMobiusCount = 0;
for (let n = 1; n <= MOBIUS_LIMIT; n++) {
  if (mobius[n] > 0) positiveMobiusCount++;
  if (mobius[n] < 0) negativeMobiusCount++;
  let recovered = 0;
  for (let divisor = 1; divisor * divisor <= n; divisor++) {
    if (n % divisor !== 0) continue;
    recovered += mobius[divisor] * Math.log(n / divisor);
    const paired = n / divisor;
    if (paired !== divisor) recovered += mobius[paired] * Math.log(n / paired);
  }
  maximumMobiusInversionError = Math.max(
    maximumMobiusInversionError,
    Math.abs(recovered - mangoldt[n])
  );
}
assert.ok(maximumMobiusInversionError < 2e-13);
assert.ok(positiveMobiusCount > 0 && negativeMobiusCount > 0);

// ---------------------------------------------------------------------------
// 5. Serialize only finite diagnostics and exact-algebra checks.
// ---------------------------------------------------------------------------

const compactWitness = (witness) => ({
  entryPrimePower: witness.entryPrimePower,
  witnessPrimePower: witness.witnessPrimePower,
  nextPrimePower: witness.nextPrimePower,
  activeEvents: witness.activeEvents,
  entryTime: witness.entryTime,
  witnessTime: witness.witnessTime,
  recoveryTime: witness.recoveryTime,
  entryClearance: witness.entryClearance,
  witnessWorkload: witness.witnessWorkload,
  serviceWindow: witness.serviceWindow,
  cost: witness.cost,
  capacity: witness.capacity,
  reserve: witness.reserve,
  centroid: witness.centroid,
  criticalCentroid: witness.criticalCentroid,
  centroidSlack: witness.centroidSlack,
  normalizedReserve: witness.normalizedReserve,
  frontLoadingCloses: witness.frontLoadingCloses
});

const results = {
  generatedAt: "deterministic-no-wall-clock",
  claimBoundary: {
    rhProved: false,
    infiniteTailProved: false,
    directedRoundingCertificate: false,
    finiteDiagnosticsOnly: true,
    exactIdentitiesChecked: [
      "classical weighted-Chebyshev bridge",
      "weighted-prefix workload synchronization",
      "active reserve V = C - J",
      "recovery-witness minimum",
      "arrival-centroid completion criterion",
      "delayed-hinge determinant",
      "signed Mobius inversion for von Mangoldt weights"
    ]
  },
  constants: {
    alpha: ALPHA,
    archimedeanConstant: ARCHIMEDEAN_CONSTANT,
    classicalLevel: CLASSICAL_LEVEL,
    tMax: T_MAX,
    xMax: Math.exp(T_MAX),
    eventLimit: EVENT_LIMIT
  },
  classicalBridge: {
    checks: classicalBridgeChecks,
    maximumAbsoluteError: Math.max(...classicalBridgeChecks.map(({ absoluteError }) => absoluteError)),
    barrierChecks,
    symmetricAbsoluteErrorRoute: {
      canProveRequiredNegativeMemoryUpperBound: false,
      reason: "the memory kernel is positive and an absolute-value envelope gives a nonnegative upper bound, while B(x)<0 for x>=2"
    }
  },
  workloadSynchronization: {
    checks: synchronizationChecks.length,
    maximumAbsoluteError: Math.max(...synchronizationChecks.map(({ absoluteError }) => absoluteError))
  },
  recoveryWitnessAudit: {
    witnesses: recoveryWitnesses.length,
    multiEventWitnesses: multiEventWitnesses.length,
    frontLoadingClosureCount,
    frontLoadingMultiEventClosureCount,
    frontLoadingMultiEventFailureCount:
      multiEventWitnesses.length - frontLoadingMultiEventClosureCount,
    minimumReserveWitness: compactWitness(minimumReserveWitness),
    minimumCentroidSlackWitness: compactWitness(minimumCentroidSlackWitness),
    maximumCriticalCentroidWitness: compactWitness(maximumCriticalCentroidWitness),
    maximumReserveBalanceError: Math.max(...recoveryWitnesses.map((item) =>
      Math.abs(item.reserve - (item.capacity - item.cost))
    )),
    maximumMinimumIdentityError: Math.max(...recoveryWitnesses.map((item) =>
      Math.abs(item.reserve - item.actualMinimum)
    )),
    maximumScaledCentroidIdentityError: Math.max(...multiEventWitnesses.map((item) =>
      Math.abs(item.centroidSlack - item.normalizedReserve)
      / Math.max(1, Math.abs(item.centroidSlack), Math.abs(item.normalizedReserve))
    ))
  },
  operatorObstructions: {
    delayedHinge: {
      ...hingeExample,
      matrix: hingeMatrix,
      determinant: hingeDeterminant,
      generalDeterminant: "-(x-y)^2 when delay<x<y and y-x<delay",
      positiveSemidefinite: false
    },
    mobiusExtraction: {
      checkedThrough: MOBIUS_LIMIT,
      positiveMobiusCount,
      negativeMobiusCount,
      maximumInversionError: maximumMobiusInversionError,
      orderPreserving: false
    }
  },
  unresolvedTarget: {
    scalar: "J_q <= C_q at every recovery witness",
    centroid: "c_q >= 1 - C_q / ((s-a) P_q^-) at every multi-event recovery witness",
    operator: "G_g positive semidefinite on every finite real point set",
    rssRequirement: "a new signed-arithmetic inequality; positive kappa scaling and all-integer Gram positivity do not supply it"
  }
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log("Global screw-positivity attempt complete.");
console.log(`  Classical bridge max error: ${results.classicalBridge.maximumAbsoluteError}`);
console.log(`  Recovery witnesses through t=${T_MAX}: ${recoveryWitnesses.length}`);
console.log(`  Multi-event witnesses: ${multiEventWitnesses.length}`);
console.log(`  State-only front-loading closures: ${frontLoadingClosureCount}`);
console.log(`  Multi-event front-loading closures: ${frontLoadingMultiEventClosureCount}/${multiEventWitnesses.length}`);
console.log(`  Minimum audited reserve: ${minimumReserveWitness.reserve}`);
console.log(`  Minimum centroid slack: ${minimumCentroidSlackWitness.centroidSlack}`);
console.log(`  Delayed-hinge determinant: ${hingeDeterminant}`);
console.log(`  Mobius inversion max error: ${maximumMobiusInversionError}`);
console.log("  RH proved: false");
