// Sprite Fusion's black hole, played as published. The disk, photon rim, Doppler
// beaming and infall are Hugo Duprez's, from
// https://www.spritefusion.com/pixel-art-vfx/black-hole
// MIT License, Copyright (c) 2026 Hugo Duprez.
// The only adapter work: place it on this canvas, and step the simulation once
// per 1/30 s so pixelfx's finer update ticks don't spawn extra debris.
import blackHole from "./_sf-black-hole.js";

const STEP = 1 / 30;

export const meta = {
  name: "Event horizon",
  desc: "Sprite Fusion's black hole: a lensed orange disk and dark shadow, a bright rim, debris pulled in, then a collapse.",
  tags: ["scifi", "black-hole", "accretion", "lensing", "space", "one-shot"],
  size: [420, 300],
  origin: [210, 150],
  duration: 213 / 30,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { seed: 3 },
};

export function create(o) {
  const hole = blackHole({
    x: (o.x ?? 210) * 2,
    y: (o.y ?? 150) * 2,
    radius: 34,
    life: 3.8,
    seed: o.seed ?? 3,
  });
  let acc = 0;
  return {
    update(dt) {
      acc += dt;
      while (acc >= STEP - 1e-8) {
        hole.update(STEP);
        acc -= STEP;
      }
    },
    drawBack(p) {
      hole.draw(p.frame, "back");
    },
    draw(p) {
      hole.draw(p.frame, "front");
    },
  };
}
