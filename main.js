/**
 * NOCTIS — Main Interactive Engine
 * Vanilla JavaScript only. No external libraries or frameworks.
 */

(function () {
  'use strict';

  // Quick sanity check for configuration
  const CFG = window.NOCTIS_CONFIG;
  if (!CFG) {
    console.error('NOCTIS configuration not loaded.');
    return;
  }

  // Feature detection & reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  // Viewport helper
  const isMobile = () => window.innerWidth < 768;

  /* ==========================================================================
     1. Preloader & Image Frame Queue
     ========================================================================== */
  const preloaderEl = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderCount = document.getElementById('preloader-count');

  // Cache storage for loaded Image objects
  const heroImages = new Array(CFG.hero.frameCount);
  const dismantleImages = new Array(CFG.dismantle.frameCount);

  let initialFramesLoaded = 0;
  const targetInitialFrames = CFG.preloader.initialHeroFrames;

  /**
   * Preload a single frame with decode()
   */
  function loadFrame(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      if ('decode' in img) {
        img.decode()
          .then(() => resolve(img))
          .catch(() => resolve(img)); // Fallback if decode fails
      } else {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      }
    });
  }

  /**
   * Start preloading initial hero frames (1..40) to unlock screen,
   * then progressively load the rest in the background.
   */
  async function startPreloader() {
    const mobile = isMobile();

    // 1. Initial essential hero frames (1 to targetInitialFrames)
    const initialPromises = [];
    for (let i = 1; i <= targetInitialFrames; i++) {
      const path = mobile ? CFG.hero.mobilePath(i) : CFG.hero.desktopPath(i);
      const promise = loadFrame(path).then((img) => {
        heroImages[i - 1] = img;
        initialFramesLoaded++;
        const pct = Math.min(100, Math.round((initialFramesLoaded / targetInitialFrames) * 100));
        if (preloaderBar) preloaderBar.style.width = pct + '%';
        if (preloaderCount) preloaderCount.textContent = String(pct).padStart(3, '0');
      });
      initialPromises.push(promise);
    }

    await Promise.all(initialPromises);

    // Initial load complete: flash bar and fade preloader out
    if (preloaderEl) {
      preloaderEl.classList.add('exit');
      setTimeout(() => {
        preloaderEl.classList.add('loaded');
      }, CFG.preloader.fadeDurationMs);
    }

    // 2. Background queue: remaining hero frames (41 to frameCount)
    loadRemainingHeroFrames(mobile);

    // 3. Background queue: dismantle frames (1 to dismantle.frameCount)
    loadDismantleFrames(mobile);
  }

  async function loadRemainingHeroFrames(mobile) {
    for (let i = targetInitialFrames + 1; i <= CFG.hero.frameCount; i++) {
      const path = mobile ? CFG.hero.mobilePath(i) : CFG.hero.desktopPath(i);
      const img = await loadFrame(path);
      heroImages[i - 1] = img;
    }
  }

  async function loadDismantleFrames(mobile) {
    for (let i = 1; i <= CFG.dismantle.frameCount; i++) {
      const path = mobile ? CFG.dismantle.mobilePath(i) : CFG.dismantle.desktopPath(i);
      const img = await loadFrame(path);
      dismantleImages[i - 1] = img;
    }
  }

  /**
   * Find the nearest loaded frame if current frame is not yet in cache
   */
  function getNearestFrame(cache, targetIndex, totalFrames) {
    if (cache[targetIndex]) return cache[targetIndex];
    // Search outwards from targetIndex
    for (let offset = 1; offset < totalFrames; offset++) {
      if (targetIndex - offset >= 0 && cache[targetIndex - offset]) {
        return cache[targetIndex - offset];
      }
      if (targetIndex + offset < totalFrames && cache[targetIndex + offset]) {
        return cache[targetIndex + offset];
      }
    }
    return null;
  }

  /* ==========================================================================
     2. Scrollytelling Canvas Engine (Hero & Dismantle)
     ========================================================================== */
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const heroWrapper = document.getElementById('section-hero');
  const heroCanvas = document.getElementById('hero-canvas');
  const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;

  const dismantleWrapper = document.getElementById('section-dismantle');
  const dismantleCanvas = document.getElementById('dismantle-canvas');
  const dismantleCtx = dismantleCanvas ? dismantleCanvas.getContext('2d') : null;

  // Set wrapper heights from config
  if (heroWrapper) heroWrapper.style.height = CFG.hero.height;
  if (dismantleWrapper) dismantleWrapper.style.height = CFG.dismantle.height;

  // State for hero
  let heroCurrentFrame = 0;
  let heroTargetFrame = 0;
  let heroLastDrawnFrame = -1;
  let heroProgress = 0;

  // State for dismantle
  let dismantleCurrentFrame = 0;
  let dismantleTargetFrame = 0;
  let dismantleLastDrawnFrame = -1;
  let dismantleProgress = 0;

  // Left HUD elements
  const hudChapter = document.getElementById('hud-chapter');
  const hudSpeed = document.getElementById('hud-speed');
  const hudDistance = document.getElementById('hud-distance');
  const heroProgressFill = document.getElementById('hero-progress-fill');
  const dismantleProgressFill = document.getElementById('dismantle-progress-fill');

  // Chapter DOM nodes
  const heroChapters = CFG.hero.chapters.map((ch) => ({
    ...ch,
    el: document.getElementById(ch.id),
  }));

  /**
   * Resize canvas taking devicePixelRatio into account (capped at 2)
   */
  function resizeCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
  }

  function resizeAllCanvases() {
    resizeCanvas(heroCanvas, heroCtx);
    resizeCanvas(dismantleCanvas, dismantleCtx);
    heroLastDrawnFrame = -1; // Force redraw
    dismantleLastDrawnFrame = -1;
  }

  window.addEventListener('resize', resizeAllCanvases, { passive: true });
  resizeAllCanvases();

  /**
   * Draw image with cover-fit on landscape, contain-fit vertically centered on portrait
   */
  function drawFrameToCanvas(canvas, ctx, img, fadeToBlackAlpha = 0) {
    if (!canvas || !ctx || !img) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    ctx.fillStyle = CFG.tokens.asphalt;
    ctx.fillRect(0, 0, cw, ch);

    if (iw === 0 || ih === 0) return;

    const isLandscape = cw >= ch;
    let renderW, renderH, offsetX, offsetY;

    if (isLandscape) {
      // Cover fit
      const scale = Math.max(cw / iw, ch / ih);
      renderW = iw * scale;
      renderH = ih * scale;
      offsetX = (cw - renderW) / 2;
      offsetY = (ch - renderH) / 2;
    } else {
      // Portrait screen: contain-fit vertically centered on --asphalt, never cropped
      const scale = Math.min(cw / iw, ch / ih);
      renderW = iw * scale;
      renderH = ih * scale;
      offsetX = (cw - renderW) / 2;
      offsetY = (ch - renderH) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Over last 5% of scroll, fade to solid black
    if (fadeToBlackAlpha > 0) {
      ctx.fillStyle = `rgba(7, 8, 10, ${clamp(fadeToBlackAlpha, 0, 1)})`;
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  /**
   * Main scrollytelling update and render loop
   */
  function updateScrollytelling() {
    const vh = window.innerHeight;

    // --- 1. HERO UPDATE ---
    if (heroWrapper && !prefersReducedMotion) {
      const rect = heroWrapper.getBoundingClientRect();
      const scrollableDist = heroWrapper.offsetHeight - vh;
      if (scrollableDist > 0) {
        heroProgress = clamp(-rect.top / scrollableDist, 0, 1);
      } else {
        heroProgress = 0;
      }

      heroTargetFrame = Math.round(heroProgress * (CFG.hero.frameCount - 1));
      heroCurrentFrame += (heroTargetFrame - heroCurrentFrame) * CFG.hero.lerpFactor;

      const roundedFrame = Math.round(heroCurrentFrame);
      const isHeroVisible = rect.bottom > 0 && rect.top < vh;

      if (isHeroVisible && roundedFrame !== heroLastDrawnFrame) {
        const frameImg = getNearestFrame(heroImages, roundedFrame, CFG.hero.frameCount);
        let fadeAlpha = 0;
        if (heroProgress >= CFG.hero.fadeToBlackStart) {
          fadeAlpha = (heroProgress - CFG.hero.fadeToBlackStart) / (1 - CFG.hero.fadeToBlackStart);
        }
        drawFrameToCanvas(heroCanvas, heroCtx, frameImg, fadeAlpha);
        heroLastDrawnFrame = roundedFrame;
      }

      // Update Hero Chapters Text
      heroChapters.forEach((ch, idx) => {
        if (!ch.el) return;
        const inRange = heroProgress >= ch.start && heroProgress <= ch.end;
        if (inRange && !ch.el.classList.contains('active')) {
          ch.el.classList.add('active');
        } else if (!inRange && ch.el.classList.contains('active')) {
          ch.el.classList.remove('active');
        }
      });

      // Update Left-edge HUD
      if (hudChapter) {
        let activeIdx = 1;
        if (heroProgress > 0.15 && heroProgress <= 0.45) activeIdx = 2;
        else if (heroProgress > 0.45 && heroProgress <= 0.75) activeIdx = 3;
        else if (heroProgress > 0.75) activeIdx = 4;
        hudChapter.textContent = `0${activeIdx} / 04`;
      }

      if (hudSpeed) {
        const speed = Math.round(heroProgress * CFG.hero.hud.maxSpeed);
        hudSpeed.textContent = `${String(speed).padStart(3, '0')} KM/H`;
      }

      if (hudDistance) {
        const dist = (heroProgress * CFG.hero.hud.maxDistance).toFixed(1);
        hudDistance.textContent = `${dist} KM`;
      }

      // Update Hero progress line
      if (heroProgressFill) {
        heroProgressFill.style.width = `${(heroProgress * 100).toFixed(1)}%`;
      }
    }

    // --- 2. DISMANTLE UPDATE ---
    if (dismantleWrapper && !prefersReducedMotion) {
      const rect = dismantleWrapper.getBoundingClientRect();
      const scrollableDist = dismantleWrapper.offsetHeight - vh;
      if (scrollableDist > 0) {
        dismantleProgress = clamp(-rect.top / scrollableDist, 0, 1);
      } else {
        dismantleProgress = 0;
      }

      dismantleTargetFrame = Math.round(dismantleProgress * (CFG.dismantle.frameCount - 1));
      dismantleCurrentFrame += (dismantleTargetFrame - dismantleCurrentFrame) * CFG.dismantle.lerpFactor;

      const roundedFrame = Math.round(dismantleCurrentFrame);
      const isDismantleVisible = rect.bottom > 0 && rect.top < vh;

      if (isDismantleVisible && roundedFrame !== dismantleLastDrawnFrame) {
        const frameImg = getNearestFrame(dismantleImages, roundedFrame, CFG.dismantle.frameCount);
        drawFrameToCanvas(dismantleCanvas, dismantleCtx, frameImg, 0);
        dismantleLastDrawnFrame = roundedFrame;
      }

      // Update Dismantle Callouts
      updateDismantleCallouts(dismantleProgress);

      // Update Dismantle progress line
      if (dismantleProgressFill) {
        dismantleProgressFill.style.width = `${(dismantleProgress * 100).toFixed(1)}%`;
      }
    }

    // --- 3. STATEMENT SECTION WORD-BY-WORD REVEAL ---
    updateStatementSection();

    requestAnimationFrame(updateScrollytelling);
  }

  /* ==========================================================================
     3. Dismantle Callouts Generation & Positioning
     ========================================================================== */
  const calloutsContainer = document.getElementById('dismantle-callouts');

  function initDismantleCallouts() {
    if (!calloutsContainer) return;
    calloutsContainer.innerHTML = '';

    CFG.dismantle.callouts.forEach((c) => {
      const calloutEl = document.createElement('div');
      calloutEl.className = 'dismantle-callout';
      calloutEl.id = `callout-${c.id}`;
      calloutEl.style.left = `${c.x}%`;
      calloutEl.style.top = `${c.y}%`;

      // SVG connecting line
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'callout-svg-line');
      svg.setAttribute('width', Math.abs(c.lineDx) + 20);
      svg.setAttribute('height', Math.abs(c.lineDy) + 20);

      // SVG coordinate offsets
      const startX = 0;
      const startY = 0;
      const endX = c.lineDx;
      const endY = c.lineDy;

      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      svg.style.left = `${minX}px`;
      svg.style.top = `${minY}px`;
      svg.setAttribute('viewBox', `${minX} ${minY} ${Math.abs(c.lineDx)} ${Math.abs(c.lineDy)}`);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      const midX = endX * 0.7;
      path.setAttribute('points', `${startX},${startY} ${midX},${endY} ${endX},${endY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', CFG.tokens.xenon);
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);

      // Content Box
      const box = document.createElement('div');
      box.className = 'callout-box';
      box.style.left = `${endX + (c.anchor.includes('left') ? -240 : 0)}px`;
      box.style.top = `${endY + (c.anchor.includes('top') ? -60 : 10)}px`;
      box.innerHTML = `
        <div class="callout-title">${c.title}</div>
        <div class="callout-desc">${c.desc}</div>
      `;

      // Dot anchor on the component
      const dot = document.createElement('div');
      dot.className = 'callout-dot';

      calloutEl.appendChild(dot);
      calloutEl.appendChild(svg);
      calloutEl.appendChild(box);
      calloutsContainer.appendChild(calloutEl);
    });
  }

  function updateDismantleCallouts(progress) {
    if (!calloutsContainer) return;
    CFG.dismantle.callouts.forEach((c) => {
      const el = document.getElementById(`callout-${c.id}`);
      if (!el) return;
      if (progress >= c.progressTrigger) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     4. Section 2 — Statement (Word-by-word scroll reveal)
     ========================================================================== */
  const statementSentence = document.getElementById('statement-sentence');
  let wordSpans = [];

  function initStatementSection() {
    if (!statementSentence) return;
    const words = CFG.statement.sentence.split(' ');
    statementSentence.innerHTML = words
      .map((word) => `<span class="word-span">${word}</span> `)
      .join('');
    wordSpans = statementSentence.querySelectorAll('.word-span');
  }

  function updateStatementSection() {
    if (!statementSentence || wordSpans.length === 0) return;
    const rect = statementSentence.getBoundingClientRect();
    const vh = window.innerHeight;

    // Active zone: from when top enters lower 80% to when bottom passes upper 20%
    const start = vh * 0.85;
    const end = vh * 0.25;
    const totalDist = start - end;
    const currentDist = start - rect.top;
    const p = clamp(currentDist / totalDist, 0, 1);

    const totalWords = wordSpans.length;
    wordSpans.forEach((span, i) => {
      const wordThreshold = (i + 0.5) / totalWords;
      if (p >= wordThreshold) {
        span.style.opacity = '1';
        span.style.color = CFG.tokens.bone;
      } else {
        span.style.opacity = '0.15';
        span.style.color = CFG.tokens.fog;
      }
    });
  }

  /* ==========================================================================
     5. Section 4 — Lineup (Hover Accordion)
     ========================================================================== */
  const accordionContainer = document.getElementById('lineup-accordion');
  let currentOpenIndex = CFG.lineup.defaultIndex;
  let hoverTimeout = null;

  function initLineupAccordion() {
    if (!accordionContainer) return;
    accordionContainer.innerHTML = '';

    CFG.lineup.cars.forEach((car, index) => {
      const isDefaultOpen = index === currentOpenIndex;
      const slide = document.createElement('button');
      slide.className = 'lineup-slide';
      slide.setAttribute('role', 'button');
      slide.setAttribute('aria-expanded', isDefaultOpen ? 'true' : 'false');
      slide.setAttribute('aria-controls', `lineup-detail-${car.id}`);
      slide.setAttribute('id', `lineup-slide-${car.id}`);
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('data-cursor', isDefaultOpen ? 'CONFIGURE' : 'OPEN');
      slide.setAttribute('data-index', index);

      // Swatches HTML
      const swatchesHtml = car.swatches
        .map(
          (s, sIdx) =>
            `<span class="color-swatch ${sIdx === 0 ? 'active' : ''}" style="background-color: ${s.color};" title="${s.name}" data-color="${s.color}"></span>`
        )
        .join('');

      slide.innerHTML = `
        <!-- Shared Floor Line at 72% height -->
        <div class="lineup-floor-line" aria-hidden="true"></div>

        <!-- Closed State Preview (greyscale, tight crop on front light bar) -->
        <div class="slide-closed-content" aria-hidden="${isDefaultOpen ? 'true' : 'false'}">
          <span class="slide-num font-mono">${car.num}</span>
          <span class="slide-rotated-name font-mono">${car.name}</span>
        </div>
        <img class="slide-closed-img" src="${car.image}" alt="" loading="lazy" aria-hidden="true">

        <!-- Open State View -->
        <div class="slide-open-content" id="lineup-detail-${car.id}">
          <div class="open-top">
            <div>
              <h3 class="open-model-name">${car.name}</h3>
              <p class="open-model-tagline">${car.tagline}</p>
            </div>
            <span class="slide-num font-mono">${car.num}</span>
          </div>

          <div class="open-car-container">
            <img class="open-car-img" src="${car.image}" alt="${car.alt}" loading="lazy">
          </div>

          <div class="open-bottom">
            <p class="open-desc">${car.desc}</p>
            <div class="open-specs-row">
              <div>
                <div class="spec-col-label">RANGE</div>
                <div class="spec-col-val">${car.specs.range}</div>
              </div>
              <div>
                <div class="spec-col-label">0–100 KM/H</div>
                <div class="spec-col-val">${car.specs.accel}</div>
              </div>
              <div>
                <div class="spec-col-label">POWER</div>
                <div class="spec-col-val">${car.specs.power}</div>
              </div>
            </div>
            <div class="open-actions">
              <div class="swatches-row" aria-label="Color swatches">${swatchesHtml}</div>
              <a href="#section-reserve" class="open-configure-btn" data-cursor="RESERVE">Configure →</a>
            </div>
          </div>
        </div>
      `;

      // Event handlers with 80ms debounce
      slide.addEventListener('mouseenter', () => {
        if (isMobile()) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          openLineupSlide(index);
        }, CFG.lineup.debounceMs);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
      });

      slide.addEventListener('click', (e) => {
        // Handle swatch clicks
        if (e.target.classList.contains('color-swatch')) {
          e.stopPropagation();
          const swatches = slide.querySelectorAll('.color-swatch');
          swatches.forEach((sw) => sw.classList.remove('active'));
          e.target.classList.add('active');
          return;
        }
        openLineupSlide(index);
      });

      // Keyboard arrow navigation
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (index + 1) % CFG.lineup.cars.length;
          focusAndOpenSlide(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (index - 1 + CFG.lineup.cars.length) % CFG.lineup.cars.length;
          focusAndOpenSlide(prev);
        }
      });

      accordionContainer.appendChild(slide);
    });

    // Reveal slides 40px up with stagger when section scrolls into view
    const lineupSection = document.getElementById('section-lineup');
    if (lineupSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              lineupSection.classList.add('lineup-revealed');
              observer.unobserve(lineupSection);
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(lineupSection);
    }
  }

  function openLineupSlide(index) {
    if (index === currentOpenIndex && !isMobile()) return;
    currentOpenIndex = index;
    const slides = accordionContainer.querySelectorAll('.lineup-slide');
    slides.forEach((slide, idx) => {
      const isOpen = idx === index;
      slide.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      slide.setAttribute('data-cursor', isOpen ? 'CONFIGURE' : 'OPEN');
      const closedContent = slide.querySelector('.slide-closed-content');
      if (closedContent) closedContent.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    });

    // Update custom cursor label if currently hovering over slide
    if (cursorLabel) {
      cursorLabel.textContent = 'CONFIGURE';
    }
  }

  function focusAndOpenSlide(index) {
    openLineupSlide(index);
    const slides = accordionContainer.querySelectorAll('.lineup-slide');
    if (slides[index]) slides[index].focus();
  }

  /* ==========================================================================
     6. Custom Cursor ("The Headlight", desktop only)
     ========================================================================== */
  const customCursor = document.getElementById('custom-cursor');
  const cursorLabel = document.getElementById('cursor-label');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let isMorphed = false;

  function initCustomCursor() {
    if (!customCursor || prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) {
      if (customCursor) customCursor.style.display = 'none';
      return;
    }

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      customCursor.classList.add('active');
      setTimeout(() => {
        customCursor.classList.remove('active');
      }, 120); // 120ms brighter flash
    });

    // Delegate hover states over links, buttons and interactive elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor], a, button, [role="button"], input');
      if (target) {
        isMorphed = true;
        customCursor.classList.add('morph');
        const customText = target.getAttribute('data-cursor');
        if (customText) {
          cursorLabel.textContent = customText;
        } else if (target.tagName === 'A' || target.tagName === 'BUTTON') {
          cursorLabel.textContent = 'VIEW';
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor], a, button, [role="button"], input');
      if (target) {
        isMorphed = false;
        customCursor.classList.remove('morph');
        cursorLabel.textContent = '';
      }
    });

    // Smooth lerp loop
    function renderCursor() {
      cursorX += (mouseX - cursorX) * CFG.effects.cursorLerp;
      cursorY += (mouseY - cursorY) * CFG.effects.cursorLerp;

      customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();
  }

  /* ==========================================================================
     7. Fixed Film-Grain Overlay (~8fps random shift)
     ========================================================================== */
  const grainCanvas = document.getElementById('grain-canvas');
  function initFilmGrain() {
    if (!grainCanvas) return;
    const ctx = grainCanvas.getContext('2d');
    const tileSize = 256;

    // Create offscreen noise tile
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buffer = new Uint32Array(imgData.data.buffer);

    // Fill with monochromatic noise
    for (let i = 0; i < buffer.length; i++) {
      const shade = (Math.random() * 255) | 0;
      // ABGR format: full opacity white noise with varying luminance
      buffer[i] = (255 << 24) | (shade << 16) | (shade << 8) | shade;
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    // Shift noise ~8 times per second (every 125ms)
    setInterval(() => {
      ctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
      const ptrn = ctx.createPattern(offscreen, 'repeat');
      ctx.fillStyle = ptrn;
      // Random shift offsets
      const ox = (Math.random() * tileSize) | 0;
      const oy = (Math.random() * tileSize) | 0;
      ctx.translate(ox, oy);
      ctx.fillRect(-ox, -oy, grainCanvas.width + tileSize, grainCanvas.height + tileSize);
      ctx.translate(-ox, -oy);
    }, 1000 / CFG.effects.noiseFps);
  }

  /* ==========================================================================
     8. Navigation (Hides on scroll down, shows on scroll up)
     ========================================================================== */
  const navEl = document.getElementById('site-nav');
  let lastScrollY = window.scrollY;

  function initNavScroll() {
    if (!navEl) return;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        navEl.classList.add('nav-hidden');
      } else {
        navEl.classList.remove('nav-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /* ==========================================================================
     Bootstrap Application
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initFilmGrain();
    initCustomCursor();
    initStatementSection();
    initDismantleCallouts();
    initLineupAccordion();
    initNavScroll();

    // Start preloader and frame loading
    startPreloader();

    // Start scrollytelling loop
    requestAnimationFrame(updateScrollytelling);
  });
})();

