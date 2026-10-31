/**
 * NOCTIS — Configuration & Parameters
 * All section heights, chapter ranges, frame counts, frame paths and callout positions
 * can be tuned directly in this file.
 */

window.NOCTIS_CONFIG = {
  // Brand & Metadata
  brand: {
    name: 'NOCTIS',
    tagline: 'Drive the night.',
    year: 2026,
  },

  // Design Tokens (referenced in JS for canvas & dynamic elements)
  tokens: {
    asphalt: '#07080A',
    graphite: '#121418',
    fog: '#8A8F98',
    bone: '#EDEAE4',
    xenon: '#CFE3FF',
    taillight: '#E1251B',
    hairline: 'rgba(237, 234, 228, 0.12)',
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Preloader configuration
  preloader: {
    initialHeroFrames: 40, // load frames 1-40 before revealing page
    fadeDurationMs: 600,
  },

  // Hero Section (Pinned Scrollytelling)
  hero: {
    height: '600vh',
    frameCount: 539, // Actual frames generated from clip1 + clip2 + clip3 (seamless)
    desktopPath: (index) => `assets/frames/hero/frame_${String(index).padStart(4, '0')}.webp`,
    mobilePath: (index) => `assets/frames/hero-mobile/frame_${String(index).padStart(4, '0')}.webp`,
    lerpFactor: 0.15,
    fadeToBlackStart: 0.95, // Last 5% of scroll fades canvas to solid black
    hud: {
      maxSpeed: 118,      // KM/H
      maxDistance: 4.2,   // KM
      totalChapters: 4,
    },
    chapters: [
      {
        id: 'hero-ch1',
        start: 0.00,
        end: 0.12,
        fadeOutEnd: 0.15,
        title: 'NOCTIS',
        subtitle: 'The city is asleep.',
        hint: 'SCROLL TO WAKE IT',
      },
      {
        id: 'hero-ch2',
        start: 0.22,
        end: 0.40,
        fadeOutEnd: 0.43,
        title: "It doesn't need the city's light.",
      },
      {
        id: 'hero-ch3',
        start: 0.50,
        end: 0.68,
        fadeOutEnd: 0.71,
        title: 'It brings its own.',
      },
      {
        id: 'hero-ch4',
        start: 0.80,
        end: 1.00,
        fadeOutEnd: 1.00,
        title: 'GT-E',
        specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
        linkText: 'Discover the GT-E',
        linkHref: '#lineup',
      },
    ],
  },

  // Statement Section (Word by word reveal)
  statement: {
    eyebrow: '02 — ENGINEERING',
    sentence: 'Every part was designed to disappear into one line of light.',
  },

  // Dismantle Section (Pinned Scrollytelling)
  dismantle: {
    height: '350vh',
    frameCount: 180, // Actual frames for dismantle sequence
    desktopPath: (index) => `assets/frames/dismantle/frame_${String(index).padStart(4, '0')}.webp`,
    mobilePath: (index) => `assets/frames/dismantle-mobile/frame_${String(index).padStart(4, '0')}.webp`,
    lerpFactor: 0.15,
    title: 'Look closer.',
    calloutsStartProgress: 0.70, // Callouts begin fading in after 70% scroll progress
    callouts: [
      {
        id: 'body',
        progressTrigger: 0.72,
        title: 'BODY',
        desc: 'Carbon composite monocoque',
        // Percentage coordinates on the canvas relative to the car/frame
        x: 44, // 44% from left
        y: 34, // 34% from top
        anchor: 'top-right',
        lineDx: 70,
        lineDy: -50,
      },
      {
        id: 'battery',
        progressTrigger: 0.79,
        title: 'BATTERY',
        desc: '110 kWh structural pack',
        x: 54,
        y: 74,
        anchor: 'bottom-right',
        lineDx: 60,
        lineDy: 50,
      },
      {
        id: 'drive',
        progressTrigger: 0.86,
        title: 'DRIVE',
        desc: 'Dual axial-flux motors, 680 kW',
        x: 77,
        y: 62,
        anchor: 'bottom-right',
        lineDx: 60,
        lineDy: 40,
      },
      {
        id: 'light',
        progressTrigger: 0.93,
        title: 'LIGHT',
        desc: 'Single-line LED signature',
        x: 27,
        y: 53,
        anchor: 'top-left',
        lineDx: -70,
        lineDy: -50,
      },
    ],
  },

  // Lineup Section (Hover Accordion)
  lineup: {
    eyebrow: '03 — THE LINEUP',
    heading: 'Five ways to drive the night.',
    defaultIndex: 0, // GT-E open by default
    debounceMs: 80,  // Prevents flicker on fast mouse sweep
    floorLineYPercent: 72, // Car sitting on line at 72% of image/slide height
    cars: [
      {
        id: 'gt-e',
        num: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        desc: 'Sculpted for continent-crossing pace in serene acoustic isolation.',
        specs: {
          range: '640 km',
          accel: '3.1 s',
          power: '680 kW',
        },
        swatches: [
          { name: 'Matte Graphite', color: '#1B1E24' },
          { name: 'Abyssal Black', color: '#07080A' },
          { name: 'Tungsten Grey', color: '#323741' },
          { name: 'Bone White', color: '#EDEAE4' },
        ],
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite grand tourer coupe',
      },
      {
        id: 's',
        num: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        desc: 'A pure executive silhouette engineered with ruthless aerodynamic restraint.',
        specs: {
          range: '600 km',
          accel: '3.6 s',
          power: '520 kW',
        },
        swatches: [
          { name: 'Satin Bone', color: '#EDEAE4' },
          { name: 'Obsidian', color: '#090A0D' },
          { name: 'Basalt Grey', color: '#2B2F38' },
          { name: 'Slate Blue', color: '#1E2533' },
        ],
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S four-door sport sedan satin bone white',
      },
      {
        id: 'x',
        num: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        desc: 'Commanding elevation with low-slung coupe proportions and torque-vectoring all-wheel drive.',
        specs: {
          range: '560 km',
          accel: '4.2 s',
          power: '480 kW',
        },
        swatches: [
          { name: 'Midnight Blue', color: '#0C1628' },
          { name: 'Deep Asphalt', color: '#08090C' },
          { name: 'Nordic Mist', color: '#7E8896' },
          { name: 'Carbon Black', color: '#14161C' },
        ],
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X coupe SUV midnight blue',
      },
      {
        id: 'r',
        num: '04',
        name: 'R',
        tagline: 'Built for the track.',
        desc: 'Stripped carbon architecture, active aerodynamic downforce and track-calibrated battery discharge.',
        specs: {
          range: '420 km',
          accel: '2.4 s',
          power: '900 kW',
        },
        swatches: [
          { name: 'Satin Black', color: '#0D0E12' },
          { name: 'Crimson Accent', color: '#E1251B' },
          { name: 'Titanium Grey', color: '#383D48' },
          { name: 'Stark White', color: '#F2EFEB' },
        ],
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R track coupe with fixed rear wing',
      },
      {
        id: 'one',
        num: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        desc: 'Radical single-volume hypercar concept exploring next-generation solid-state cell packaging.',
        specs: {
          range: 'Concept',
          accel: 'Concept',
          power: 'Concept',
        },
        swatches: [
          { name: 'Liquid Silver', color: '#B8BFC9' },
          { name: 'Void Black', color: '#050608' },
          { name: 'Cold Chromium', color: '#7E8794' },
          { name: 'Pure Xenon', color: '#CFE3FF' },
        ],
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE concept hypercar liquid silver',
      },
    ],
  },

  // Reserve Section
  reserve: {
    heading: 'Drive the night.',
    body: 'Production begins Autumn 2026. Hand assembly strictly limited to 500 numbered allocations per chassis.',
    buttonText: 'RESERVE YOUR NOCTIS',
  },

  // Global Effects & Interactive Cursor
  effects: {
    cursorLerp: 0.18,
    noiseOpacity: 0.035, // 3.5% opacity
    noiseFps: 8,          // Shift noise tile ~8 times per second
  },
};

