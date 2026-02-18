/* ═══════════════════════════════════════════════════════════════
   Slides Editor — Visual slide editor with drag, resize, text
   editing. Saves to JSON for the viewer engine.
═══════════════════════════════════════════════════════════════ */

const SlideEditor = (() => {
  let deck = null;
  let theme = null;
  let currentSlide = 0;
  let selectedElement = null;
  let canvas = null;
  let slidePanel = null;
  let propsPanel = null;
  let isDragging = false;
  let isResizing = false;
  let isDraggingLineHandle = false;
  let lineHandleProp = '';
  let dragOffset = { x: 0, y: 0 };
  let resizeDir = '';
  let draftKey = '';

  /* ── Initialization ──────────────────────────────────────── */

  function init(options = {}) {
    canvas = document.getElementById('slide-canvas');
    slidePanel = document.getElementById('slide-panel');
    propsPanel = document.getElementById('props-panel');

    if (options.deck) {
      deck = JSON.parse(JSON.stringify(options.deck));
    } else {
      deck = createEmptyDeck();
    }

    draftKey = options.draftKey || 'slides-draft';
    theme = options.theme || window.SLIDE_THEME;

    applyTheme();
    renderSlidePanel();
    renderCanvas();
    bindCanvasEvents();
    bindKeyboard();
    startAutosave();
  }

  function createEmptyDeck() {
    return {
      title: 'Untitled Presentation',
      theme: 'default',
      mermaid: false,
      slides: [{
        layout: 'title',
        elements: [
          { id: genId(), type: 'text', content: 'Untitled', x: 50, y: 35, w: 80, style: 'title' },
          { id: genId(), type: 'text', content: 'Click to edit', x: 50, y: 55, w: 60, style: 'subtitle' },
        ],
        notes: '',
      }],
    };
  }

  function genId() {
    return 'e' + Math.random().toString(36).slice(2, 8);
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

  /* ── Slide Panel (thumbnails) ───────────────────────────── */

  function renderSlidePanel() {
    if (!slidePanel) return;
    slidePanel.innerHTML = '';

    deck.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (i === currentSlide ? ' active' : '');
      thumb.dataset.index = i;

      const num = document.createElement('div');
      num.className = 'thumb-num';
      num.textContent = i + 1;
      thumb.appendChild(num);

      const preview = document.createElement('div');
      preview.className = 'thumb-preview';
      preview.style.background = 'var(--slide-bg, #fff)';
      renderMiniSlide(preview, slide);
      thumb.appendChild(preview);

      thumb.addEventListener('click', () => {
        currentSlide = i;
        selectedElement = null;
        renderSlidePanel();
        renderCanvas();
        renderProps();
      });

      slidePanel.appendChild(thumb);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'slide-add-btn';
    addBtn.textContent = '+ Add Slide';
    addBtn.addEventListener('click', addSlide);
    slidePanel.appendChild(addBtn);
  }

  function renderMiniSlide(container, slide) {
    slide.elements.forEach(el => {
      if (el.type === 'text') {
        const d = document.createElement('div');
        const sCentered = (theme.textStyles[el.style] || {}).textAlign === 'center';
        d.style.cssText = `
          position: absolute; left: ${el.x}%; top: ${el.y}%;
          ${sCentered ? 'transform: translateX(-50%);' : ''}
          font-size: 3px; color: var(--slide-text, #333);
          white-space: nowrap; overflow: hidden;
          max-width: ${el.w || 80}%;
        `;
        d.textContent = el.content.split('\n')[0];
        container.appendChild(d);
      } else if (el.type === 'shape') {
        const d = document.createElement('div');
        d.style.cssText = `
          position: absolute; left: ${el.x}%; top: ${el.y}%;
          width: ${el.w}%; height: ${el.h || el.w}%;
          background: ${el.fill || 'var(--accent)'};
          border-radius: ${el.shape === 'circle' ? '50%' : (el.radius ? el.radius * 0.3 + 'px' : '0')};
          opacity: 0.7;
        `;
        container.appendChild(d);
      }
    });
  }

  /* ── Canvas Rendering ───────────────────────────────────── */

  function renderCanvas() {
    if (!canvas) return;
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    canvas.innerHTML = '';
    canvas.style.background = 'var(--slide-bg, #fff)';

    slide.elements.forEach(el => {
      const node = createEditorElement(el);
      if (node) canvas.appendChild(node);
    });
  }

  function createEditorElement(el) {
    let node;
    switch (el.type) {
      case 'text':    node = createEditorText(el); break;
      case 'shape':   node = createEditorShape(el); break;
      case 'line':    node = createEditorLine(el); break;
      case 'mermaid': node = createEditorMermaid(el); break;
      default: return null;
    }
    if (node) {
      node.dataset.elementId = el.id;
      if (selectedElement === el.id) node.classList.add('selected');
    }
    return node;
  }

  function createEditorText(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-text';
    const styleDef = theme.textStyles[el.style] || theme.textStyles.body || {};

    const isCentered = styleDef.textAlign === 'center';
    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w || 'auto'}%;
      ${isCentered ? 'transform: translateX(-50%);' : ''}
      cursor: move; white-space: pre-wrap; word-wrap: break-word;
      min-height: 1em; outline: none;
    `;

    Object.entries(styleDef).forEach(([k, v]) => {
      div.style[k] = v;
    });

    if (el.color) div.style.color = el.color;
    if (el.fontSize) div.style.fontSize = el.fontSize;

    div.innerHTML = escapeHtml(el.content).replace(/\n/g, '<br>');

    div.addEventListener('dblclick', e => {
      e.stopPropagation();
      startTextEdit(div, el);
    });

    addResizeHandles(div, el);
    return div;
  }

  function createEditorShape(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-shape';
    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w}%; height: ${el.h || el.w}%;
      background: ${el.fill || 'var(--accent)'};
      border-radius: ${el.shape === 'circle' ? '50%' : (el.radius ? el.radius + 'px' : '0')};
      ${el.stroke ? `border: ${el.strokeWidth || 1}px solid ${el.stroke};` : ''}
      cursor: move;
    `;
    addResizeHandles(div, el);
    return div;
  }

  function createEditorLine(el) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-element editor-line';
    wrapper.style.cssText = `
      position: absolute; left: 0; top: 0; width: 100%; height: 100%;
      pointer-events: none;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'width:100%;height:100%;';
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
    line.style.pointerEvents = 'stroke';
    line.style.cursor = 'move';

    // Invisible wider hit area for easier clicking
    const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitArea.setAttribute('x1', el.x1);
    hitArea.setAttribute('y1', el.y1);
    hitArea.setAttribute('x2', el.x2);
    hitArea.setAttribute('y2', el.y2);
    hitArea.setAttribute('stroke', 'transparent');
    hitArea.setAttribute('stroke-width', '3');
    hitArea.style.pointerEvents = 'stroke';
    hitArea.style.cursor = 'move';
    svg.appendChild(hitArea);

    svg.appendChild(line);
    wrapper.appendChild(svg);

    const endHandle = (cx, cy, prop) => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('cx', cx);
      handle.setAttribute('cy', cy);
      handle.setAttribute('r', '1.5');
      handle.setAttribute('fill', '#2563eb');
      handle.setAttribute('stroke', '#fff');
      handle.setAttribute('stroke-width', '0.3');
      handle.style.cursor = 'crosshair';
      handle.style.pointerEvents = 'all';
      handle.classList.add('line-handle');
      handle.dataset.prop = prop;

      if (selectedElement === el.id) {
        handle.style.display = 'block';
      } else {
        handle.style.display = 'none';
      }

      svg.appendChild(handle);
    };

    endHandle(el.x1, el.y1, 'start');
    endHandle(el.x2, el.y2, 'end');

    return wrapper;
  }

  function createEditorMermaid(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-mermaid';
    div.style.cssText = `
      position: absolute;
      left: ${el.x}%; top: ${el.y}%;
      width: ${el.w}%; height: ${el.h || 50}%;
      cursor: move;
      display: flex; align-items: center; justify-content: center;
      background: rgba(128,128,128,0.1);
      border: 1px dashed var(--border, #ccc);
      font-family: var(--font-code, monospace);
      font-size: 0.8rem; color: var(--muted, #999);
      overflow: hidden;
    `;
    div.textContent = '📊 Mermaid: ' + el.content.split('\n')[0];

    div.addEventListener('dblclick', e => {
      e.stopPropagation();
      const newContent = prompt('Edit Mermaid source:', el.content);
      if (newContent !== null) {
        el.content = newContent;
        renderCanvas();
        saveDraft();
      }
    });

    addResizeHandles(div, el);
    return div;
  }

  function addResizeHandles(node, el) {
    if (el.type === 'line') return;

    ['se', 'e', 's'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${dir}`;
      handle.dataset.dir = dir;
      node.appendChild(handle);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Text Editing ───────────────────────────────────────── */

  function startTextEdit(div, el) {
    div.contentEditable = true;
    div.style.cursor = 'text';
    div.classList.add('editing');
    div.focus();

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const finish = () => {
      div.contentEditable = false;
      div.style.cursor = 'move';
      div.classList.remove('editing');
      el.content = div.innerText;
      saveDraft();
      renderSlidePanel();
    };

    div.addEventListener('blur', finish, { once: true });
    div.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); div.blur(); }
    });
  }

  /* ── Canvas Events (select, drag, resize) ───────────────── */

  function bindCanvasEvents() {
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('dblclick', onCanvasDoubleClick);
  }

  function onCanvasMouseDown(e) {
    const target = e.target.closest('.editor-element');
    const resizeHandle = e.target.closest('.resize-handle');
    const lineHandle = e.target.closest('.line-handle');

    if (resizeHandle && target) {
      e.preventDefault();
      const elId = target.dataset.elementId;
      selectedElement = elId;
      isResizing = true;
      resizeDir = resizeHandle.dataset.dir;
      renderCanvas();
      renderProps();
      return;
    }

    if (lineHandle) {
      e.preventDefault();
      const wrapper = e.target.closest('.editor-element');
      if (wrapper) {
        selectedElement = wrapper.dataset.elementId;
        isDraggingLineHandle = true;
        lineHandleProp = lineHandle.dataset.prop;
        renderCanvas();
        renderProps();
      }
      return;
    }

    if (target && !target.classList.contains('editing')) {
      e.preventDefault();
      const elId = target.dataset.elementId;
      selectedElement = elId;
      isDragging = true;

      const rect = canvas.getBoundingClientRect();
      const el = getElement(elId);
      if (el) {
        const clickPctX = (e.clientX - rect.left) / rect.width * 100;
        const clickPctY = (e.clientY - rect.top) / rect.height * 100;
        if (el.type === 'line') {
          dragOffset.x = clickPctX - el.x1;
          dragOffset.y = clickPctY - el.y1;
        } else {
          dragOffset.x = clickPctX - el.x;
          dragOffset.y = clickPctY - el.y;
        }
      }

      renderCanvas();
      renderProps();
    } else if (!target) {
      selectedElement = null;
      renderCanvas();
      renderProps();
    }
  }

  function onCanvasMouseMove(e) {
    if (!isDragging && !isResizing && !isDraggingLineHandle) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const pctX = (e.clientX - rect.left) / rect.width * 100;
    const pctY = (e.clientY - rect.top) / rect.height * 100;
    const el = getElement(selectedElement);
    if (!el) return;

    if (isDragging) {
      if (el.type === 'line') {
        const dx = pctX - dragOffset.x - el.x1;
        const dy = pctY - dragOffset.y - el.y1;
        el.x1 = Math.max(0, Math.min(100, el.x1 + dx));
        el.y1 = Math.max(0, Math.min(100, el.y1 + dy));
        el.x2 = Math.max(0, Math.min(100, el.x2 + dx));
        el.y2 = Math.max(0, Math.min(100, el.y2 + dy));
        dragOffset.x = pctX - el.x1;
        dragOffset.y = pctY - el.y1;
      } else {
        el.x = Math.max(0, Math.min(100, pctX - dragOffset.x));
        el.y = Math.max(0, Math.min(100, pctY - dragOffset.y));
      }
      renderCanvas();
    }

    if (isDraggingLineHandle && el.type === 'line') {
      if (lineHandleProp === 'start') {
        el.x1 = Math.max(0, Math.min(100, pctX));
        el.y1 = Math.max(0, Math.min(100, pctY));
      } else {
        el.x2 = Math.max(0, Math.min(100, pctX));
        el.y2 = Math.max(0, Math.min(100, pctY));
      }
      renderCanvas();
    }

    if (isResizing && el.type !== 'line') {
      if (resizeDir.includes('e')) {
        const styleDef = (el.type === 'text' && theme.textStyles[el.style]) || {};
        const isCentered = styleDef.textAlign === 'center';
        if (isCentered) {
          el.w = Math.max(5, pctX - (el.x - (el.w || 20) / 2));
        } else {
          el.w = Math.max(5, pctX - el.x);
        }
      }
      if (resizeDir.includes('s')) {
        el.h = Math.max(5, pctY - el.y);
      }
      renderCanvas();
    }
  }

  function onCanvasMouseUp() {
    if (isDragging || isResizing || isDraggingLineHandle) saveDraft();
    isDragging = false;
    isResizing = false;
    isDraggingLineHandle = false;
    renderSlidePanel();
  }

  function onCanvasDoubleClick(e) {
    if (!e.target.closest('.editor-element')) {
      // Double-click on empty canvas — could add element at position
    }
  }

  /* ── Properties Panel ──────────────────────────────────── */

  function renderProps() {
    if (!propsPanel) return;
    const el = getElement(selectedElement);

    if (!el) {
      propsPanel.innerHTML = `
        <div class="props-empty">
          <p>Select an element to edit its properties</p>
          <p style="font-size:0.8rem;color:var(--muted,#999);margin-top:8px">Double-click text to edit inline</p>
        </div>
      `;
      return;
    }

    let html = `<div class="props-section"><h3>${el.type.charAt(0).toUpperCase() + el.type.slice(1)}</h3>`;

    if (el.type === 'text') {
      html += `
        <label>Style
          <select data-prop="style">
            ${Object.keys(theme.textStyles).map(s => `<option value="${s}" ${el.style === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </label>
        <label>Content
          <textarea data-prop="content" rows="3">${escapeHtml(el.content)}</textarea>
        </label>
      `;
    }

    if (el.type === 'shape') {
      html += `
        <label>Shape
          <select data-prop="shape">
            <option value="rect" ${el.shape === 'rect' ? 'selected' : ''}>Rectangle</option>
            <option value="circle" ${el.shape === 'circle' ? 'selected' : ''}>Circle</option>
          </select>
        </label>
        <label>Fill <input type="text" data-prop="fill" value="${el.fill || 'var(--accent)'}"></label>
        <label>Stroke <input type="text" data-prop="stroke" value="${el.stroke || ''}"></label>
        <label>Radius <input type="number" data-prop="radius" value="${el.radius || 0}" min="0"></label>
      `;
    }

    if (el.type !== 'line') {
      html += `
        <label>X % <input type="number" data-prop="x" value="${Math.round(el.x)}" min="0" max="100"></label>
        <label>Y % <input type="number" data-prop="y" value="${Math.round(el.y)}" min="0" max="100"></label>
        <label>Width % <input type="number" data-prop="w" value="${Math.round(el.w || 20)}" min="1" max="100"></label>
      `;
      if (el.type !== 'text') {
        html += `<label>Height % <input type="number" data-prop="h" value="${Math.round(el.h || el.w || 20)}" min="1" max="100"></label>`;
      }
    } else {
      html += `
        <label>X1 % <input type="number" data-prop="x1" value="${Math.round(el.x1)}" min="0" max="100"></label>
        <label>Y1 % <input type="number" data-prop="y1" value="${Math.round(el.y1)}" min="0" max="100"></label>
        <label>X2 % <input type="number" data-prop="x2" value="${Math.round(el.x2)}" min="0" max="100"></label>
        <label>Y2 % <input type="number" data-prop="y2" value="${Math.round(el.y2)}" min="0" max="100"></label>
        <label>Stroke <input type="text" data-prop="stroke" value="${el.stroke || 'var(--border)'}"></label>
        <label>Width <input type="number" data-prop="strokeWidth" value="${el.strokeWidth || 1}" min="1" max="20"></label>
      `;
    }

    html += `<button class="props-delete" data-action="delete">Delete Element</button>`;
    html += `</div>`;

    html += `<div class="props-section"><h3>Slide</h3>`;
    html += `<label>Speaker Notes<textarea data-slide-prop="notes" rows="3">${escapeHtml(deck.slides[currentSlide].notes || '')}</textarea></label>`;
    html += `</div>`;

    propsPanel.innerHTML = html;

    propsPanel.querySelectorAll('[data-prop]').forEach(input => {
      input.addEventListener('change', () => {
        const prop = input.dataset.prop;
        let val = input.value;
        if (input.type === 'number') val = parseFloat(val);
        el[prop] = val;
        renderCanvas();
        renderSlidePanel();
        saveDraft();
      });
    });

    propsPanel.querySelectorAll('[data-slide-prop]').forEach(input => {
      input.addEventListener('change', () => {
        deck.slides[currentSlide][input.dataset.slideProp] = input.value;
        saveDraft();
      });
    });

    propsPanel.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteElement(el.id);
      });
    });
  }

  /* ── Element Operations ─────────────────────────────────── */

  function getElement(id) {
    if (!id || !deck.slides[currentSlide]) return null;
    return deck.slides[currentSlide].elements.find(e => e.id === id);
  }

  function addElement(type, props = {}) {
    const slide = deck.slides[currentSlide];
    const el = { id: genId(), type, ...props };

    switch (type) {
      case 'text':
        Object.assign(el, { content: 'New text', x: 50, y: 50, w: 40, style: 'body', ...props });
        break;
      case 'shape':
        Object.assign(el, { shape: 'rect', x: 30, y: 30, w: 20, h: 15, fill: 'var(--accent)', ...props });
        break;
      case 'line':
        Object.assign(el, { x1: 20, y1: 50, x2: 80, y2: 50, stroke: 'var(--border)', strokeWidth: 2, ...props });
        break;
      case 'mermaid':
        Object.assign(el, { content: 'graph TD\n  A[Start]-->B[End]', x: 15, y: 15, w: 70, h: 60, ...props });
        deck.mermaid = true;
        break;
    }

    slide.elements.push(el);
    selectedElement = el.id;
    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
  }

  function deleteElement(id) {
    const slide = deck.slides[currentSlide];
    slide.elements = slide.elements.filter(e => e.id !== id);
    selectedElement = null;
    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
  }

  function addSlide() {
    deck.slides.push({
      layout: 'freeform',
      elements: [
        { id: genId(), type: 'text', content: 'New Slide', x: 50, y: 40, w: 60, style: 'heading' },
      ],
      notes: '',
    });
    currentSlide = deck.slides.length - 1;
    selectedElement = null;
    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
  }

  function deleteSlide(index) {
    if (deck.slides.length <= 1) return;
    deck.slides.splice(index, 1);
    if (currentSlide >= deck.slides.length) currentSlide = deck.slides.length - 1;
    selectedElement = null;
    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
  }

  function moveSlide(from, to) {
    if (to < 0 || to >= deck.slides.length) return;
    const [slide] = deck.slides.splice(from, 1);
    deck.slides.splice(to, 0, slide);
    currentSlide = to;
    renderSlidePanel();
    saveDraft();
  }

  function duplicateSlide(index) {
    const copy = JSON.parse(JSON.stringify(deck.slides[index]));
    copy.elements.forEach(el => el.id = genId());
    deck.slides.splice(index + 1, 0, copy);
    currentSlide = index + 1;
    selectedElement = null;
    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
  }

  /* ── Keyboard ───────────────────────────────────────────── */

  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.key) {
        case 'Delete': case 'Backspace':
          if (selectedElement) { e.preventDefault(); deleteElement(selectedElement); }
          break;
        case 'Escape':
          selectedElement = null;
          renderCanvas();
          renderProps();
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); moveSlide(currentSlide, currentSlide - 1); }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); moveSlide(currentSlide, currentSlide + 1); }
          break;
      }
    });
  }

  /* ── Save / Load ────────────────────────────────────────── */

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(deck));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupt, ignore */ }
    return null;
  }

  function startAutosave() {
    // Already saving on every change, this is a placeholder for interval-based if needed
  }

  function exportJSON() {
    const clean = JSON.parse(JSON.stringify(deck));
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (deck.title || 'presentation').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.slides || !Array.isArray(data.slides)) throw new Error('Invalid deck format');
          data.slides.forEach(s => s.elements.forEach(el => { if (!el.id) el.id = genId(); }));
          deck = data;
          currentSlide = 0;
          selectedElement = null;
          renderSlidePanel();
          renderCanvas();
          renderProps();
          saveDraft();
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function setTheme(newTheme) {
    theme = newTheme;
    deck.theme = newTheme.name ? newTheme.name.toLowerCase() : deck.theme;
    applyTheme();
    renderCanvas();
    renderSlidePanel();
    saveDraft();
  }

  function updateDeckMeta(key, value) {
    deck[key] = value;
    saveDraft();
  }

  function previewInViewer() {
    sessionStorage.setItem('slides-preview', JSON.stringify(deck));
    window.open('view.html?preview=1', '_blank');
  }

  /* ── Public API ─────────────────────────────────────────── */

  return {
    init,
    addElement,
    deleteElement,
    addSlide,
    deleteSlide,
    moveSlide,
    duplicateSlide,
    exportJSON,
    importJSON,
    setTheme,
    updateDeckMeta,
    previewInViewer,
    loadDraft,
    get deck() { return deck; },
    get currentSlide() { return currentSlide; },
    get selectedElement() { return selectedElement; },
  };
})();

if (typeof window !== 'undefined') window.SlideEditor = SlideEditor;
