/* ═══════════════════════════════════════════════════════════════
   Slides Engine — Viewer & Renderer
   Renders JSON slide decks with theme support, keyboard nav,
   transitions, fullscreen, and responsive 16:9 scaling.
═══════════════════════════════════════════════════════════════ */

const SlideEngine = (() => {
  let deck = null;
  let theme = null;
  let currentSlide = 0;
  let container = null;
  let slideEl = null;
  let counterEl = null;
  let transitioning = false;
  let mermaidReady = false;
  let presenterWindow = null;

  /* ── Initialization ──────────────────────────────────────── */

  function init(containerSelector, deckData, themeData) {
    deck = deckData;
    theme = themeData || window.SLIDE_THEME;
    container = document.querySelector(containerSelector);
    if (!container) return;

    applyTheme();
    buildUI();
    bindKeys();
    bindTouch();
    renderSlide(0);

    if (deck.mermaid) loadMermaid();
  }

  function applyTheme() {
    const root = document.documentElement;
    if (theme.cssVars) {
      Object.entries(theme.cssVars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    if (theme.googleFontsUrl) {
      const link = document.getElementById('theme-fonts') || document.createElement('link');
      link.id = 'theme-fonts';
      link.rel = 'stylesheet';
      link.href = theme.googleFontsUrl;
      if (!link.parentNode) document.head.appendChild(link);
    }
  }

  function buildUI() {
    container.innerHTML = '';
    container.style.cssText = `
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #000; overflow: hidden;
    `;

    const wrapper = document.createElement('div');
    wrapper.id = 'slide-wrapper';
    wrapper.style.cssText = `
      position: relative; aspect-ratio: 16/9;
      max-width: 100%; max-height: 100%;
      overflow: hidden; border-radius: ${theme.slideRadius || '0px'};
      background: var(--slide-bg, #fff);
    `;
    container.appendChild(wrapper);

    slideEl = document.createElement('div');
    slideEl.id = 'slide-content';
    slideEl.style.cssText = `
      position: absolute; inset: 0; width: 100%; height: 100%;
    `;
    wrapper.appendChild(slideEl);

    counterEl = document.createElement('div');
    counterEl.id = 'slide-counter';
    counterEl.style.cssText = `
      position: absolute; bottom: 12px; right: 16px;
      font-family: var(--font-body, sans-serif); font-size: 0.85rem;
      color: var(--muted, #999); opacity: 0.7; z-index: 10;
      pointer-events: none;
    `;
    wrapper.appendChild(counterEl);

    fitSlide();
    window.addEventListener('resize', fitSlide);
  }

  function fitSlide() {
    const wrapper = document.getElementById('slide-wrapper');
    if (!wrapper) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const ar = 16 / 9;

    let w, h;
    if (cw / ch > ar) {
      h = ch;
      w = h * ar;
    } else {
      w = cw;
      h = w / ar;
    }
    wrapper.style.width = w + 'px';
    wrapper.style.height = h + 'px';
  }

  /* ── Rendering ──────────────────────────────────────────── */

  function renderSlide(index, direction) {
    if (!deck || !deck.slides[index]) return;
    currentSlide = index;
    const slide = deck.slides[index];

    const newContent = document.createElement('div');
    newContent.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

    slide.elements.forEach(el => {
      const node = createElement(el);
      if (node) newContent.appendChild(node);
    });

    const transition = theme.transition || 'fade';
    if (direction !== undefined && transition !== 'none') {
      animateTransition(newContent, direction, transition);
    } else {
      slideEl.innerHTML = '';
      slideEl.appendChild(newContent);
    }

    counterEl.textContent = `${index + 1} / ${deck.slides.length}`;

    renderMermaidElements(newContent);
    notifyPresenter();
  }

  function animateTransition(newContent, direction, type) {
    const oldContent = slideEl.firstChild;
    if (!oldContent) {
      slideEl.appendChild(newContent);
      return;
    }

    transitioning = true;
    const dur = 300;

    if (type === 'slide') {
      const offset = direction > 0 ? '100%' : '-100%';
      const exitOffset = direction > 0 ? '-100%' : '100%';
      newContent.style.transform = `translateX(${offset})`;
      slideEl.appendChild(newContent);

      requestAnimationFrame(() => {
        oldContent.style.transition = `transform ${dur}ms ease`;
        newContent.style.transition = `transform ${dur}ms ease`;
        oldContent.style.transform = `translateX(${exitOffset})`;
        newContent.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        oldContent.remove();
        transitioning = false;
      }, dur);
    } else {
      newContent.style.opacity = '0';
      slideEl.appendChild(newContent);

      requestAnimationFrame(() => {
        oldContent.style.transition = `opacity ${dur}ms ease`;
        newContent.style.transition = `opacity ${dur}ms ease`;
        oldContent.style.opacity = '0';
        newContent.style.opacity = '1';
      });

      setTimeout(() => {
        oldContent.remove();
        transitioning = false;
      }, dur);
    }
  }

  function createElement(el) {
    switch (el.type) {
      case 'text':   return createText(el);
      case 'shape':  return createShape(el);
      case 'line':   return createLine(el);
      case 'mermaid': return createMermaid(el);
      case 'image':  return createImage(el);
      default: return null;
    }
  }

  function createText(el) {
    const div = document.createElement('div');
    const styleDef = theme.textStyles[el.style] || theme.textStyles.body || {};
    const isCentered = styleDef.textAlign === 'center';

    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w || 'auto'}%;
      ${isCentered ? 'transform: translateX(-50%);' : ''}
      white-space: pre-wrap; word-wrap: break-word;
    `;

    Object.entries(styleDef).forEach(([k, v]) => {
      div.style[k] = v;
    });

    if (el.color) div.style.color = el.color;
    if (el.fontSize) div.style.fontSize = el.fontSize;

    div.innerHTML = escapeHtml(el.content).replace(/\n/g, '<br>');
    return div;
  }

  function createShape(el) {
    if (el.shape === 'circle') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.cssText = `
        position: absolute;
        left: ${el.x}%; top: ${el.y}%;
        width: ${el.w}%; height: ${el.h || el.w}%;
        overflow: visible;
      `;
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '48');
      circle.setAttribute('fill', el.fill || 'var(--accent)');
      if (el.stroke) {
        circle.setAttribute('stroke', el.stroke);
        circle.setAttribute('stroke-width', el.strokeWidth || 2);
      }
      svg.appendChild(circle);
      return svg;
    }

    const div = document.createElement('div');
    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w}%; height: ${el.h || el.w}%;
      background: ${el.fill || 'var(--accent)'};
      border-radius: ${el.radius ? el.radius + 'px' : '0'};
      ${el.stroke ? `border: ${el.strokeWidth || 1}px solid ${el.stroke};` : ''}
    `;
    return div;
  }

  function createLine(el) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute; left: 0; top: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    `;
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', el.x1);
    line.setAttribute('y1', el.y1);
    line.setAttribute('x2', el.x2);
    line.setAttribute('y2', el.y2);
    line.setAttribute('stroke', el.stroke || 'var(--border)');
    line.setAttribute('stroke-width', (el.strokeWidth || 1) * 0.3);
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(line);
    return svg;
  }

  function createMermaid(el) {
    const div = document.createElement('div');
    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w}%; height: ${el.h || 50}%;
      display: flex; align-items: center; justify-content: center;
    `;
    div.className = 'mermaid-container';
    div.dataset.mermaidSrc = el.content;

    const pre = document.createElement('pre');
    pre.className = 'mermaid';
    pre.textContent = el.content;
    div.appendChild(pre);
    return div;
  }

  function createImage(el) {
    const img = document.createElement('img');
    img.src = el.src;
    img.alt = el.alt || '';
    img.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w}%; height: ${el.h ? el.h + '%' : 'auto'};
      object-fit: ${el.fit || 'contain'};
      border-radius: ${el.radius ? el.radius + 'px' : '0'};
    `;
    return img;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Mermaid ────────────────────────────────────────────── */

  function loadMermaid() {
    if (window.mermaid) { mermaidReady = true; return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: isLightTheme() ? 'default' : 'dark',
        securityLevel: deck.mermaidSecurity || 'strict',
      });
      mermaidReady = true;
      renderMermaidElements(slideEl);
    };
    document.head.appendChild(script);
  }

  function isLightTheme() {
    const bg = theme.cssVars['--slide-bg'] || '#fff';
    const hex = bg.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (r + g + b) / 3 > 128;
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r + g + b) / 3 > 128;
  }

  async function renderMermaidElements(parent) {
    if (!mermaidReady || !window.mermaid) return;
    const containers = parent.querySelectorAll('.mermaid-container');
    for (const container of containers) {
      const src = container.dataset.mermaidSrc;
      if (!src) continue;
      try {
        const id = 'mermaid-' + Math.random().toString(36).slice(2, 8);
        const { svg } = await window.mermaid.render(id, src);
        container.innerHTML = svg;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.maxHeight = '100%';
        }
      } catch (e) {
        const errPre = document.createElement('pre');
        errPre.style.cssText = 'color:red;font-size:0.9rem';
        errPre.textContent = 'Mermaid error: ' + e.message;
        container.innerHTML = '';
        container.appendChild(errPre);
      }
    }
  }

  /* ── Navigation ─────────────────────────────────────────── */

  function next() {
    if (transitioning) return;
    if (currentSlide < deck.slides.length - 1) renderSlide(currentSlide + 1, 1);
  }

  function prev() {
    if (transitioning) return;
    if (currentSlide > 0) renderSlide(currentSlide - 1, -1);
  }

  function goTo(index) {
    if (transitioning) return;
    if (index >= 0 && index < deck.slides.length) {
      const dir = index > currentSlide ? 1 : -1;
      renderSlide(index, dir);
    }
  }

  function bindKeys() {
    document.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
          e.preventDefault(); next(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          e.preventDefault(); prev(); break;
        case 'Home': e.preventDefault(); goTo(0); break;
        case 'End': e.preventDefault(); goTo(deck.slides.length - 1); break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) toggleFullscreen(); break;
        case 'Escape':
          if (document.fullscreenElement) { document.exitFullscreen(); }
          else { window.location.href = 'index.html'; }
          break;
        case 'q': case 'Q':
          if (!e.ctrlKey && !e.metaKey) window.location.href = 'index.html';
          break;
        case 'e': case 'E':
          if (!e.ctrlKey && !e.metaKey) {
            const deckParam = new URLSearchParams(window.location.search).get('deck');
            if (deckParam) window.open(`edit.html?deck=${deckParam}`, '_blank');
          }
          break;
        case 'p': case 'P':
          if (!e.ctrlKey && !e.metaKey) openPresenter(); break;
      }
    });
  }

  let touchStartX = 0;
  function bindTouch() {
    container.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) next(); else prev();
      }
    }, { passive: true });

    container.addEventListener('click', e => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width * 0.6) next();
      else if (x < rect.width * 0.4) prev();
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      (container.parentElement || container).requestFullscreen().catch(() => {});
    }
  }

  /* ── Presenter Mode ─────────────────────────────────────── */

  function openPresenter() {
    if (presenterWindow && !presenterWindow.closed) {
      presenterWindow.focus();
      return;
    }

    presenterWindow = window.open('', 'presenter', 'width=800,height=600');
    if (!presenterWindow) return;

    const doc = presenterWindow.document;
    doc.title = 'Presenter — ' + (deck.title || 'Slides');

    doc.head.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1a1a; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 20px; display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: 1fr auto; gap: 16px; height: 100vh; }
        .current-slide { background: #000; border: 2px solid #444; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .current-slide iframe { width: 100%; height: 100%; border: none; }
        .sidebar { display: flex; flex-direction: column; gap: 12px; }
        .next-slide { background: #111; border: 1px solid #333; border-radius: 8px; overflow: hidden; flex: 1; display: flex; align-items: center; justify-content: center; }
        .next-slide iframe { width: 100%; height: 100%; border: none; pointer-events: none; }
        .notes { background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px; flex: 1; overflow-y: auto; font-size: 1.1rem; line-height: 1.5; white-space: pre-wrap; }
        .notes-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px; }
        .timer-bar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #111; border-radius: 8px; font-size: 1.2rem; }
        .timer { font-variant-numeric: tabular-nums; font-family: monospace; font-size: 1.5rem; }
        .slide-info { color: #888; }
        .controls { display: flex; gap: 8px; }
        .controls button { background: #333; color: #e0e0e0; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
        .controls button:hover { background: #555; }
      </style>
    `;

    doc.body.innerHTML = `
      <div class="current-slide"><div id="p-current" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;">Current Slide</div></div>
      <div class="sidebar">
        <div class="next-slide"><div id="p-next" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;">Next Slide</div></div>
        <div class="notes"><div class="notes-label">Speaker Notes</div><div id="p-notes"></div></div>
      </div>
      <div class="timer-bar">
        <div class="slide-info" id="p-info">Slide 1 / 1</div>
        <div class="timer" id="p-timer">00:00:00</div>
        <div class="controls">
          <button onclick="window.opener.SlideEngine.prev()">&#9664; Prev</button>
          <button onclick="window.opener.SlideEngine.next()">Next &#9654;</button>
          <button id="p-timer-btn" onclick="toggleTimer()">Start Timer</button>
        </div>
      </div>
    `;

    let timerStarted = false;
    let startTime = null;
    let timerInterval = null;

    presenterWindow.toggleTimer = function() {
      const btn = doc.getElementById('p-timer-btn');
      if (!timerStarted) {
        startTime = Date.now();
        timerInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const h = Math.floor(elapsed / 3600000);
          const m = Math.floor((elapsed % 3600000) / 60000);
          const s = Math.floor((elapsed % 60000) / 1000);
          doc.getElementById('p-timer').textContent =
            String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }, 1000);
        btn.textContent = 'Reset Timer';
        timerStarted = true;
      } else {
        clearInterval(timerInterval);
        doc.getElementById('p-timer').textContent = '00:00:00';
        btn.textContent = 'Start Timer';
        timerStarted = false;
      }
    };

    presenterWindow.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowRight': case ' ': e.preventDefault(); next(); break;
        case 'ArrowLeft': e.preventDefault(); prev(); break;
      }
    });

    notifyPresenter();
  }

  function notifyPresenter() {
    if (!presenterWindow || presenterWindow.closed) return;
    const doc = presenterWindow.document;
    const slide = deck.slides[currentSlide];
    const nextSlide = deck.slides[currentSlide + 1];

    const info = doc.getElementById('p-info');
    if (info) info.textContent = `Slide ${currentSlide + 1} / ${deck.slides.length}`;

    const notes = doc.getElementById('p-notes');
    if (notes) notes.textContent = slide.notes || '(no notes)';

    const pCurrent = doc.getElementById('p-current');
    if (pCurrent) {
      pCurrent.innerHTML = '';
      pCurrent.style.cssText = `width:100%;height:100%;position:relative;background:var(--slide-bg,#fff);overflow:hidden;`;
      slide.elements.forEach(el => {
        const node = createElement(el);
        if (node) pCurrent.appendChild(node);
      });
    }

    const pNext = doc.getElementById('p-next');
    if (pNext) {
      pNext.innerHTML = '';
      if (nextSlide) {
        pNext.style.cssText = `width:100%;height:100%;position:relative;background:var(--slide-bg,#fff);overflow:hidden;`;
        nextSlide.elements.forEach(el => {
          const node = createElement(el);
          if (node) pNext.appendChild(node);
        });
      } else {
        pNext.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;`;
        pNext.textContent = 'End of presentation';
      }
    }
  }

  /* ── Public API ─────────────────────────────────────────── */

  return {
    init,
    next,
    prev,
    goTo,
    get currentSlide() { return currentSlide; },
    get deck() { return deck; },
    get theme() { return theme; },
    applyTheme(newTheme) {
      theme = newTheme;
      applyTheme();
      renderSlide(currentSlide);
    },
    toggleFullscreen,
    openPresenter,
  };
})();

if (typeof window !== 'undefined') window.SlideEngine = SlideEngine;
