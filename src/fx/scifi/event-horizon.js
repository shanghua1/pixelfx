// Thin inclined disk of hot gas around a pitch-black circular shadow. Streaks follow
// a log spiral (the same family of idea as the whirlpool), the right limb is hotter,
// and the far side is bent into a crescent that sits on the photon rim.
import { PAL, fit, cycle, clamp, smooth, TAU, WHITE, hex } from "../../core/index.js";

const D = 4;
const INK = hex("#000000");

export const meta = {
  name: "Event horizon",
  desc: "Hot gas streaks along a thin inclined disk around a black circular shadow; the right limb blazes, and the far side bends into a crescent on the photon rim.",
  tags: ["scifi", "black-hole", "accretion", "lensing", "space", "loop"],
  size: [200, 150],
  origin: [100, 76],
  duration: D,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.fire, seed: 3 },
};

const RS = 18, SI = 0.24, R0 = 22, R1 = 74;

function turns(rho) {
  return rho < 34 ? 3 : rho < 52 ? 2 : 1;
}
function gas(rho, phi, ph) {
  const s = Math.log(Math.max(12, rho));
  const a = phi - ph * TAU * turns(rho) + s * 1.25;
  const b = phi - ph * TAU * turns(rho) * 1 + s * 1.8 + 1.7;
  const arm = Math.pow(Math.max(0, Math.cos(5 * a)), 9);
  const fine = Math.pow(Math.max(0, Math.cos(8 * b)), 12) * 0.8;
  const dash = 0.72 + 0.28 * Math.sin(s * 7 - ph * TAU * 3 + phi);
  const dop = 0.48 + 0.85 * Math.max(0, Math.cos(phi));
  return (arm + fine) * dash * dop;
}
function heat(C, I) {
  if (I > 0.78) return WHITE;
  if (I > 0.5) return C[6];
  if (I > 0.3) return C[5];
  if (I > 0.16) return C[4];
  if (I > 0.08) return C[3];
  return 0;
}

function disk(p, C, ph, near) {
  const y0 = near ? -1 : -R1 * SI - 4, y1 = near ? R1 * SI + 4 : 1;
  p.shade(-R1 - 3, y0, R1 + 3, y1, (x, y, out) => {
    if (x * x + y * y < (RS + 1.2) ** 2) return;
    const Z = y / SI, rho = Math.hypot(x, Z);
    if (rho < R0 || rho > R1) return;
    const front = Z > 0;
    if (near !== front && Math.abs(y) > 0.6) return;
    const u = (rho - R0) / (R1 - R0);
    const fade = smooth(0, 0.08, u) * (1 - smooth(0.78, 1, u));
    const phi = Math.atan2(Z, x);
    const I = gas(rho, phi, ph) * fade * (front ? 1 : 0.7);
    if (I < 0.14) p.blend(x, y, front ? C[2] : C[1], 0.14 * fade);
    const c = heat(C, I);
    if (!c) return;
    out.c = c;
    if (I > 0.22) (out.l = C[5]), (out.k = 0.08 + 0.16 * Math.min(1, I));
  });
}

// Continuous bow sitting just outside the shadow. Base light keeps it a crescent;
// gas only brightens knots along it.
function crescent(p, C, ph, sign) {
  const amp = sign < 0 ? 3.2 : 2.1;
  const Rmax = RS + 2 + amp;
  const yLo = sign < 0 ? -Rmax - 1 : RS * 0.2;
  const yHi = sign < 0 ? -RS + 1 : Rmax + 1;
  p.shade(-Rmax - 2, yLo, Rmax + 2, yHi, (x, y, out) => {
    const r = Math.hypot(x, y);
    const from = Math.abs(Math.atan2(y, x) - sign * (Math.PI / 2));
    if (from > 0.98) return;
    const reach = amp * Math.cos(Math.min(from, 1.2) / 1.2 * (Math.PI / 2));
    if (r < RS + 1.45 || r > RS + 1.55 + reach) return;
    const phi = -Math.acos(clamp(x / (RS + 24), -1, 1));
    const hot = Math.cos(phi);
    const I = (sign < 0 ? 0.22 : 0.12) * (0.35 + Math.max(0, hot)) + gas(30, phi, ph) * (sign < 0 ? 0.85 : 0.45);
    const c = heat(C, I * Math.cos(from * 0.45));
    if (!c) return;
    out.c = c;
    if (I > 0.45 && sign < 0) (out.l = C[6]), (out.k = 0.12);
  });
}

function rim(p, C) {
  p.shade(-RS - 4, -RS - 4, RS + 4, RS + 4, (x, y, out) => {
    const r = Math.hypot(x, y);
    const hot = x / RS;
    const outer = hot > 0.35 ? RS + 1.7 : RS + 1.15;
    if (r < RS - 0.15 || r > outer) return;
    out.c = hot > 0.45 ? WHITE : hot > 0 ? C[6] : hot > -0.45 ? C[5] : C[3];
    out.l = hot > 0.2 ? WHITE : C[5];
    out.k = hot > 0.2 ? 0.42 : 0.1;
  });
}

function punch(p) {
  const L = p.L, w = p.w, ox = p.ox, oy = p.oy, r2 = (RS - 1.2) ** 2;
  p.each(-RS, -RS, RS, RS, (x, y, sx, sy) => {
    if (x * x + y * y < r2) L[(sy - oy) * w + (sx - ox)] = 0;
  });
}

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8), ph = t / D;
  for (let i = 0; i < 18; i++) {
    const x = Math.round((i * 53) % 176 - 88), y = Math.round((i * 31) % 124 - 62);
    if (x * x + y * y < 40 * 40) continue;
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(TAU * ((i % 3) + 1) * ph + i));
    p.dot(x, y, i % 8 === 0 ? C[6] : WHITE, i % 5 === 0 ? 1 : tw * 0.65);
  }
  p.glow(14, 2, 16, C[5], 0.16);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8), ph = t / D;
  crescent(p, C, ph, -1);
  crescent(p, C, ph, 1);
  disk(p, C, ph, false);
  disk(p, C, ph, true);
  p.circle(0, 0, RS - 0.15, INK);
  rim(p, C);
  cycle(t, D, 18, o.seed ?? 1, (r) => r.range(1.3, 2.2), (age, L, r) => {
    const q = age / L;
    const rho = 78 - 50 * Math.pow(q, 1.2);
    const phi = r.range(0, TAU) + q * TAU * r.range(0.7, 1.4);
    const h = r.range(-8, 8) * (1 - q);
    const x = Math.cos(phi) * rho, y = Math.sin(phi) * rho * SI + h;
    if (x * x + y * y < (RS + 2) ** 2) return;
    const back = Math.sin(phi) < -0.15 && Math.abs(h) < 3 && rho < R1 && rho > R0;
    if (back) return;
    const x2 = Math.cos(phi - 0.12) * Math.min(84, rho + 2.5);
    const y2 = Math.sin(phi - 0.12) * Math.min(84, rho + 2.5) * SI + h;
    if (x2 * x2 + y2 * y2 < (RS + 2) ** 2) return;
    const col = q > 0.72 ? WHITE : q > 0.4 ? C[6] : C[5];
    p.line(x2, y2, x, y, col, Math.min(1, q * 5));
    p.light(x, y, col, 0.22);
  });
  punch(p);
}
