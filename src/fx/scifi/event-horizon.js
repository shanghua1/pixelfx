// Original stellar black hole, drawn as crisp pixel bands. The shadow is a true circle: the
// disk and the lensed bows stay outside it, the near disk crosses in front of the lower limb,
// and the far side comes back as solid arcs above and below.
import { fit, cycle, rand, TAU, WHITE, hex } from "../../core/index.js";

export const meta = {
  name: "Event horizon",
  desc: "A pitch-black circular event horizon, a thin photon ring, and an inclined golden disk whose far side returns as arcs above and below while sparks spiral in.",
  tags: ["scifi", "black-hole", "event-horizon", "accretion", "space", "gravity", "loop"],
  size: [400, 300],
  origin: [200, 150],
  duration: 6,
  loop: true,
  fps: 20,
  bg: "black",
  options: {
    palette: ["#120a05", "#3a1a09", "#6b3010", "#a65614", "#e08420", "#ffae38", "#ffe094", "#fff6dc"],
    seed: 5,
  },
};

const D = 6;
const RS = 44;
const SI = 0.48;
const R_IN = 46;
const R_OUT = 130;
const INK = hex("#000000");
const STAR = [hex("#7d88a6"), hex("#c4cae0"), hex("#f5f7ff"), hex("#ffd0a2")];
const RING_R = RS + 1;
const SHADOW2 = RING_R * RING_R;

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: Math.round(rand(i, 21, 2) * 372 - 186),
  y: Math.round(rand(i, 22, 3) * 264 - 132),
  mag: rand(i, 23, 4),
  warm: rand(i, 24, 5) > 0.9,
  n: 1 + (i % 3),
  ph: rand(i, 25, 6) * TAU,
  cross: rand(i, 26, 7) > 0.92,
}));

function bandOf(rho) {
  if (rho < 74) return [3, 8];
  if (rho < 102) return [2, 6];
  return [1, 4];
}

function diskColor(C, rho, phi, ph0, near) {
  const [turns, arms] = bandOf(rho);
  const fil = Math.cos(arms * (phi - ph0 * turns) + rho * 0.16);
  const dop = Math.cos(phi);
  let k = dop > 0.74 ? 6 : dop > 0.28 ? 5 : dop > -0.22 ? 4 : 3;
  if (rho > 112) k -= 1;
  if (fil > 0.9) k += 2;
  else if (fil > 0.28) k += 1;
  else if (fil < -0.72) k -= 1;
  if (!near) k -= 1;
  if (rho < R_IN + 1.5 || rho > R_OUT - 1.2) k += 1;
  k = Math.max(1, Math.min(7, k));
  return k === 7 ? WHITE : C[k];
}

function inShadow(x, y) {
  return x * x + y * y <= (RS - 0.4) * (RS - 0.4);
}
function missesHole(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, (-x0 * dx - y0 * dy) / l2));
  const x = x0 + dx * u, y = y0 + dy * u;
  return x * x + y * y > SHADOW2;
}

function paintDisk(p, C, ph0, near) {
  const y0 = near ? 0 : -R_OUT * SI - 2;
  const y1 = near ? R_OUT * SI + 2 : 0;
  p.shade(-R_OUT - 2, y0, R_OUT + 2, y1, (x, y) => {
    if (near ? y < 0 : y > 0) return;
    if (x * x + y * y <= (RS + 1.55) * (RS + 1.55)) return;
    const Z = y / SI;
    const rho2 = x * x + Z * Z;
    if (rho2 < R_IN * R_IN || rho2 > R_OUT * R_OUT) return;
    return diskColor(C, Math.sqrt(rho2), Math.atan2(Z, x), ph0, near);
  });
}

// A solid ribbon of far-side disk, phi running from the right ansa through the hidden side to the left.
function ribbon(p, C, ph0, spec) {
  const { reach, base, amp, sign, width, dim } = spec;
  const n = Math.ceil(Math.PI * reach * 2);
  const at = (u) => {
    const phi = -Math.PI * u;
    const lift = Math.sin(Math.PI * u);
    return { x: Math.cos(phi) * reach, y: sign * (base + lift * amp), phi, lift };
  };
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = at(u);
    const b = at(Math.min(1, u + 1 / n));
    let tx = b.x - a.x, ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len, ny = tx / len;
    const dop = Math.cos(a.phi);
    const fil = Math.cos(8 * (a.phi - ph0 * 3));
    let k = dop > 0.2 ? 6 : 4;
    if (fil > 0.55) k += 1;
    if (dim) k -= 2;
    k = Math.max(2, Math.min(7, k));
    const core = k === 7 && !dim ? WHITE : C[k];
    const edge = C[Math.max(1, k - 2)];
    const th = width * (0.28 + 0.72 * a.lift);
    const steps = Math.max(1, Math.round(th));
    for (let s = -steps; s <= steps; s++) {
      const w = (s / steps) * th;
      if (inShadow(a.x + nx * w, a.y + ny * w)) continue;
      p.px(a.x + nx * w, a.y + ny * w, Math.abs(s) >= steps ? edge : core);
    }
  }
}

function photon(p, C) {
  const R0 = RS + 0.05, R1 = RS + 1.7;
  p.shade(-R1 - 1, -R1 - 1, R1 + 1, R1 + 1, (x, y) => {
    const r = Math.hypot(x, y);
    if (r < R0 || r > R1) return;
    if (r < R0 + 0.95) return x > 4 ? WHITE : C[7];
    return x > 8 ? C[6] : C[5];
  });
}

function punch(p, r) {
  const L = p.L, w = p.w, ox = p.ox, oy = p.oy, r2 = r * r;
  p.each(-r - 1, -r - 1, r + 1, r + 1, (x, y, sx, sy) => {
    if (x * x + y * y >= r2) return;
    L[(sy - oy) * w + (sx - ox)] = 0;
  });
}

function motes(p, C, t, seed) {
  cycle(t, D, 22, seed, (r) => r.range(2.2, 3.3), (age, L, r) => {
    const q = age / L;
    const rho0 = r.range(142, 176);
    const phi0 = r.range(0, TAU);
    const spin = r.range(1.25, 2.1) * TAU;
    const h0 = r.range(-34, 34) * (r.chance(0.7) ? 1 : 0.4);
    const at = (qq) => {
      const rho = RS + 3 + (rho0 - RS - 3) * (1 - Math.pow(qq, 1.18));
      const phi = phi0 + spin * Math.pow(qq, 1.12);
      const h = h0 * (1 - qq * qq);
      return { x: Math.cos(phi) * rho, y: Math.sin(phi) * rho * SI + h, phi, rho, h };
    };
    const a = at(q);
    if (inShadow(a.x, a.y)) return;
    if (Math.abs(a.h) < 3.5 && Math.sin(a.phi) < -0.08 && a.rho > R_IN && a.rho < R_OUT) return;
    const fade = Math.min(1, q * 5);
    if (fade < 0.15) return;
    const b = at(Math.max(0, q - 0.04));
    const col = q > 0.72 ? WHITE : q > 0.34 ? C[6] : C[5];
    const dx = a.x - b.x, dy = a.y - b.y;
    if (dx * dx + dy * dy < 15 * 15 && dx * dx + dy * dy > 0.8 && missesHole(b.x, b.y, a.x, a.y)) {
      p.line(b.x, b.y, a.x, a.y, (u) => (u > 0.45 ? col : C[4]), fade);
    }
    p.px(a.x, a.y, col);
    if (q > 0.55) p.px(a.x + 1, a.y, col);
  });
}

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8);
  for (const s of STARS) {
    if (inShadow(s.x, s.y)) continue;
    const tw = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin((s.n * TAU * t) / D + s.ph));
    const c = s.warm ? STAR[3] : STAR[s.mag > 0.7 ? 2 : s.mag > 0.38 ? 1 : 0];
    if (s.mag > 0.84) p.px(s.x, s.y, c);
    else p.dot(s.x, s.y, c, tw);
    if (s.cross && tw > 0.8) {
      p.px(s.x - 2, s.y, c); p.px(s.x + 2, s.y, c);
      p.px(s.x, s.y - 2, c); p.px(s.x, s.y + 2, c);
    }
  }
  p.glow(16, 4, 26, C[6], 0.14);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8);
  const ph0 = (TAU * t) / D;
  const S = o.seed ?? 1;
  ribbon(p, C, ph0, { reach: 118, base: 28, amp: 50, sign: -1, width: 6.4, dim: false });
  ribbon(p, C, ph0, { reach: 112, base: 34, amp: 40, sign: 1, width: 4.6, dim: true });
  paintDisk(p, C, ph0, false);
  paintDisk(p, C, ph0, true);
  p.circle(0, 0, RS + 0.4, INK);
  photon(p, C);
  motes(p, C, t, S + 4);
  p.glowRing(0, 0, RS + 0.5, 4, C[7], 0.22);
  punch(p, RS - 1.6);
}
