# NOCTIS — Scrollytelling Experience

> *The city is in total blackout at night where the car's light is the only light in the world.*

NOCTIS is a minimal, single-page scrollytelling web experience for a luxury electric automotive marque.

## Technology Stack

- **Plain HTML5, CSS3, & Vanilla JavaScript** (No React, Vue, Vite, GSAP, Lenis, Tailwind, or npm packages).
- **Canvas-based Scroll Scrubbing**: Zero `<img>` swapping and zero `<video>` tags. Pinned sticky stage scrollytelling rendered directly to `<canvas>` with device pixel ratio scaling.
- **Google Fonts**:
  - Display: `Archivo` (width axis 125%, weights 300/400, uppercase)
  - Body: `Inter` 400
  - HUD: `JetBrains Mono` 400

## Design System

- **Strict Minimalist Palette**: Flat solid colors and 1px hairlines only. Zero gradients, zero glassmorphism, zero blur, zero glows, zero shadows.
  - `--asphalt`: `#07080A` (Page Background)
  - `--graphite`: `#121418` (Stage & Cards)
  - `--fog`: `#8A8F98` (Secondary Type)
  - `--bone`: `#EDEAE4` (Primary Type)
  - `--xenon`: `#CFE3FF` (Signature Light Accent)
  - `--taillight`: `#E1251B` (HUD & Accent Ticks)
  - `--hairline`: `rgba(237, 234, 228, 0.12)`
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` throughout.

## Sections

1. **01 — Hero (Pinned Scrollytelling, ~600vh)**:
   Scrubbed 539-frame sequence transitioning through city blackout, canyon of glass, and high-speed bridge pass. Real-time HUD (speed up to 118 km/h, distance tracker, active chapter indicators).
2. **02 — Statement (Word-by-word Reveal)**:
   Dynamic scroll progress revealing each word from 15% to 100% opacity.
3. **03 — Architecture Dismantle (Pinned Scrollytelling, ~350vh)**:
   180-frame mechanical disassembly sequence revealing chassis, dual axial-flux motors, carbon monocoque, and structural battery with hairline callouts.
4. **04 — The Lineup (Hover Accordion)**:
   Interactive 5-slide horizontal accordion (GT-E, S, X, R, ONE) with 80ms debounce, 72% shared floor line alignment, and color swatches. Responsive vertical layout on mobile.
5. **05 — Reserve**:
   Minimal reservation section with morphing xenon signature button.

## Interactive Features

- **The Headlight (Custom Cursor)**: Desktop xenon dot + ring that lerps to pointer and morphs into a 44×2px light signature with dynamic mono labels (`VIEW`, `RESERVE`, `MENU`, `OPEN`, `CONFIGURE`).
- **Film Grain**: Dynamic monochromatic noise canvas shifted at 8 FPS.
- **Accessible**: Full ARIA markup, keyboard arrow navigation, and `prefers-reduced-motion` support.

## Local Server

Launch with VS Code Live Server or run:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1 -Port 3000
```
Open [http://localhost:3000/](http://localhost:3000/).
