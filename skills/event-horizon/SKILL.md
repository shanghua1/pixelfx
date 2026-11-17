---
name: event-horizon
description: Render and reuse the pixelfx golden event-horizon loop. Use when asked to preview, export, or recolor scifi/event-horizon, or to run the bundled PixelFX runtime offline on the parent Linux box.
license: MIT
compatibility: Node 18 or newer. ffmpeg is optional and only needed for GIF and MP4.
---

# Event horizon

A looping pixel-art black hole in this pixelfx checkout: `src/fx/scifi/event-horizon.js`.
Native size is 400×300. The loop is 6 seconds at 20 fps (120 frames). The shadow is opaque black.
Empty space in the sprite sheet is alpha 0. Glow is baked into opaque pixels, so the sheet has no soft alpha fringe.

The Patch Pixel font under `gallery/fonts` is not part of this effect and is not covered by the MIT license. Do not copy it into a runtime bundle.

## Render with the repo tools

From the pixelfx root (no `npm install` required):

```bash
node tools/check.mjs scifi/event-horizon
node tools/render.mjs scifi/event-horizon --gif --mp4 --sheet --scale 3 --zoom 1 --bg black --loops 1
```

Outputs land in `records/scifi/event-horizon/`:

- `contact.png` — sampled frames
- `anim.gif` — looping GIF (`--scale 3` is a 3× integer preview, 1200×900)
- `anim.mp4` — H.264. The tool repeats a loop at least three times in the MP4
- `event-horizon.png` and `event-horizon.json` — transparent sprite sheet, Aseprite-style frames, `meta.pixelfx` has fps, loop, pivot `[200, 150]`, columns

Integer on-screen sizes of the native frame are 400×300, 800×600, and 1200×900. Use nearest-neighbor / `image-rendering: pixelated`.

Recolor without editing the effect:

```bash
node tools/render.mjs scifi/event-horizon --gif --scale 3 --bg black --opts '{"palette":["#041018","#0c3048","#146080","#1c98b0","#38d0c8","#b8fff0","#ffffff","#ffffff"]}'
```

## Offline runtime

`pixelfx-event-horizon-runtime.zip` contains `src/core`, this effect, `tools/render.mjs`, `tools/check.mjs`, `tools/lib`, `LICENSE`, and `NOTICE.md`. It does not contain the git checkout or `gallery/fonts`. Unzip it and run the same `node tools/render.mjs` commands. Requirements: Node 18+ on PATH. ffmpeg on PATH for GIF and MP4. No network, no npm install, no global CLI.
