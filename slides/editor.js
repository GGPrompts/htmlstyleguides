/* ======================================================================
   Slides Editor — Visual slide editor with drag, resize, snapping,
   history, multi-select, and JSON export for the viewer engine.
====================================================================== */

const SlideEditor = (() => {
  let deck = null;
  let theme = null;
  let currentSlide = 0;
  let selectedIds = [];
  let activeId = null;
  let canvas = null;
  let slidePanel = null;
  let propsPanel = null;
  let draftKey = 'slides-draft';

  const HISTORY_LIMIT = 120;
  let history = [];
  let historyIndex = -1;

  let pointerState = null;
  let currentGuides = { x: [], y: [] };
  let contextMenuEl = null;

  let clipboard = [];
  let pasteCount = 0;

  const prefs = {
    showGrid: false,
    snapToGuides: true,
    snapToGrid: false,
    gridStep: 5,
    snapThreshold: 1,
  };

  /* -- Initialization ------------------------------------------------ */

  function init(options = {}) {
    canvas = document.getElementById('slide-canvas');
    slidePanel = document.getElementById('slide-panel');
    propsPanel = document.getElementById('props-panel');

    if (options.deck) {
      deck = deepClone(options.deck);
    } else {
      deck = createEmptyDeck();
    }

    draftKey = options.draftKey || 'slides-draft';
    theme = options.theme || window.SLIDE_THEME;

    loadPrefs();
    applyTheme();
    ensureSlideIntegrity();
    createContextMenu();

    renderSlidePanel();
    renderCanvas();
    renderProps();

    bindCanvasEvents();
    bindKeyboard();
    bindContextMenuEvents();
    bindClipboardEvents();

    resetHistory();
    startAutosave();
  }

  function createEmptyDeck() {
    return {
      title: 'Untitled Presentation',
      theme: 'default',
      mermaid: false,
      slides: [
        {
          layout: 'title',
          elements: [
            { id: genId(), type: 'text', content: 'Untitled', x: 50, y: 30, w: 80, style: 'title' },
            { id: genId(), type: 'text', content: 'Click to edit subtitle', x: 50, y: 52, w: 70, style: 'subtitle' },
          ],
          notes: '',
        },
      ],
    };
  }

  function ensureSlideIntegrity() {
    if (!deck.slides || !Array.isArray(deck.slides) || deck.slides.length === 0) {
      deck.slides = createEmptyDeck().slides;
    }
    deck.slides.forEach(slide => {
      if (!Array.isArray(slide.elements)) slide.elements = [];
      slide.elements.forEach(el => {
        if (!el.id) el.id = genId();
      });
      if (typeof slide.notes !== 'string') slide.notes = '';
    });
  }

  function genId() {
    return 'e' + Math.random().toString(36).slice(2, 9);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem('slides-editor-prefs');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.showGrid === 'boolean') prefs.showGrid = parsed.showGrid;
      if (typeof parsed.snapToGuides === 'boolean') prefs.snapToGuides = parsed.snapToGuides;
      if (typeof parsed.snapToGrid === 'boolean') prefs.snapToGrid = parsed.snapToGrid;
      if (typeof parsed.gridStep === 'number' && parsed.gridStep > 0) prefs.gridStep = parsed.gridStep;
      if (typeof parsed.snapThreshold === 'number' && parsed.snapThreshold > 0) prefs.snapThreshold = parsed.snapThreshold;
    } catch (e) {
      // ignore corrupt prefs
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem('slides-editor-prefs', JSON.stringify(prefs));
    } catch (e) {
      // ignore quota errors
    }
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

  /* -- History -------------------------------------------------------- */

  function makeHistoryState() {
    return {
      deck: deepClone(deck),
      currentSlide,
      selectedIds: [...selectedIds],
      activeId,
    };
  }

  function resetHistory() {
    history = [makeHistoryState()];
    historyIndex = 0;
  }

  function pushHistory() {
    const state = makeHistoryState();
    const currentHash = JSON.stringify(state);
    const prevHash = historyIndex >= 0 ? JSON.stringify(history[historyIndex]) : '';
    if (currentHash === prevHash) return;

    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }

    history.push(state);
    if (history.length > HISTORY_LIMIT) {
      history.shift();
    } else {
      historyIndex += 1;
    }

    if (history.length === HISTORY_LIMIT) {
      historyIndex = history.length - 1;
    }
  }

  function restoreHistoryState(state) {
    deck = deepClone(state.deck);
    currentSlide = Math.max(0, Math.min(deck.slides.length - 1, state.currentSlide || 0));
    activeId = state.activeId || null;
    selectedIds = (state.selectedIds || []).filter(id => getElementById(id));
    if (selectedIds.length === 0) activeId = null;

    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    restoreHistoryState(history[historyIndex]);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreHistoryState(history[historyIndex]);
  }

  /* -- Selection ------------------------------------------------------ */

  function clearSelection() {
    selectedIds = [];
    activeId = null;
  }

  function setSelection(ids, newActiveId) {
    const idSet = new Set(ids);
    const valid = deck.slides[currentSlide].elements
      .map(el => el.id)
      .filter(id => idSet.has(id));

    selectedIds = valid;
    if (selectedIds.length === 0) {
      activeId = null;
      return;
    }

    if (newActiveId && selectedIds.includes(newActiveId)) {
      activeId = newActiveId;
    } else if (activeId && selectedIds.includes(activeId)) {
      // keep existing active id
    } else {
      activeId = selectedIds[selectedIds.length - 1];
    }
  }

  function selectOnly(id) {
    setSelection([id], id);
  }

  function toggleSelection(id) {
    if (selectedIds.includes(id)) {
      setSelection(selectedIds.filter(x => x !== id), activeId === id ? null : activeId);
    } else {
      setSelection([...selectedIds, id], id);
    }
  }

  function isSelected(id) {
    return selectedIds.includes(id);
  }

  function getActiveElement() {
    if (!activeId) return null;
    return getElementById(activeId);
  }

  function getSelectedElements() {
    return selectedIds.map(id => getElementById(id)).filter(Boolean);
  }

  /* -- Slide Panel ---------------------------------------------------- */

  function renderSlidePanel() {
    if (!slidePanel) return;
    slidePanel.innerHTML = '';

    deck.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (i === currentSlide ? ' active' : '');
      thumb.dataset.index = String(i);

      const num = document.createElement('div');
      num.className = 'thumb-num';
      num.textContent = String(i + 1);
      thumb.appendChild(num);

      const preview = document.createElement('div');
      preview.className = 'thumb-preview';
      preview.style.background = 'var(--slide-bg, #fff)';
      renderMiniSlide(preview, slide);
      thumb.appendChild(preview);

      thumb.addEventListener('click', () => {
        currentSlide = i;
        clearSelection();
        hideContextMenu();
        clearGuides();
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
        const node = document.createElement('div');
        const centered = isCenteredText(el);
        node.style.cssText = [
          'position:absolute',
          `left:${el.x}%`,
          `top:${el.y}%`,
          centered ? 'transform:translateX(-50%)' : '',
          'font-size:3px',
          'color:var(--slide-text,#333)',
          'white-space:nowrap',
          'overflow:hidden',
          `max-width:${Math.max(1, Number(el.w) || 80)}%`,
        ].filter(Boolean).join(';');
        node.textContent = (el.content || '').split('\n')[0];
        container.appendChild(node);
      }

      if (el.type === 'shape') {
        const node = document.createElement('div');
        node.style.cssText = [
          'position:absolute',
          `left:${el.x}%`,
          `top:${el.y}%`,
          `width:${Math.max(1, Number(el.w) || 10)}%`,
          `height:${Math.max(1, Number(el.h) || Number(el.w) || 10)}%`,
          `background:${el.fill || 'var(--accent)'}`,
          `border-radius:${el.shape === 'circle' ? '50%' : ((el.radius || 0) * 0.3) + 'px'}`,
          'opacity:0.75',
        ].join(';');
        container.appendChild(node);
      }

      if (el.type === 'image') {
        const node = document.createElement('div');
        node.style.cssText = [
          'position:absolute',
          `left:${el.x}%`,
          `top:${el.y}%`,
          `width:${Math.max(1, Number(el.w) || 20)}%`,
          `height:${Math.max(1, Number(el.h) || 20)}%`,
          'background:rgba(128,128,128,0.2)',
          'border:1px solid rgba(80,80,80,0.5)',
        ].join(';');
        container.appendChild(node);
      }
    });
  }

  /* -- Canvas Rendering ---------------------------------------------- */

  function renderCanvas() {
    if (!canvas) return;
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    canvas.innerHTML = '';
    canvas.style.background = 'var(--slide-bg, #fff)';
    canvas.classList.toggle('show-grid', prefs.showGrid);
    canvas.style.setProperty('--grid-step', String(prefs.gridStep));

    slide.elements.forEach(el => {
      const node = createEditorElement(el);
      if (node) canvas.appendChild(node);
    });

    renderGuideLines();
    renderMarqueeBox();
  }

  function createEditorElement(el) {
    let node = null;
    if (el.type === 'text') node = createEditorText(el);
    if (el.type === 'shape') node = createEditorShape(el);
    if (el.type === 'line') node = createEditorLine(el);
    if (el.type === 'mermaid') node = createEditorMermaid(el);
    if (el.type === 'image') node = createEditorImage(el);
    if (!node) return null;

    node.dataset.elementId = el.id;
    if (isSelected(el.id)) node.classList.add('selected');
    if (activeId === el.id) node.classList.add('active');
    return node;
  }

  function createEditorText(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-text';

    const styleDef = theme.textStyles[el.style] || theme.textStyles.body || {};
    const centered = isCenteredText(el);

    div.style.cssText = [
      'position:absolute',
      `left:${el.x}%`,
      `top:${el.y}%`,
      `width:${Math.max(1, Number(el.w) || 20)}%`,
      centered ? 'transform:translateX(-50%)' : '',
      'cursor:move',
      'white-space:pre-wrap',
      'word-wrap:break-word',
      'min-height:1em',
      'outline:none',
    ].filter(Boolean).join(';');

    Object.entries(styleDef).forEach(([k, v]) => {
      div.style[k] = v;
    });

    if (el.color) div.style.color = el.color;
    if (el.fontSize) div.style.fontSize = el.fontSize;

    div.innerHTML = escapeHtml(el.content || '').replace(/\n/g, '<br>');

    div.addEventListener('dblclick', event => {
      event.stopPropagation();
      startTextEdit(div, el);
    });

    addResizeHandles(div, el);
    return div;
  }

  function createEditorShape(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-shape';

    const width = Math.max(1, Number(el.w) || 10);
    const height = Math.max(1, Number(el.h) || Number(el.w) || 10);

    div.style.cssText = [
      'position:absolute',
      `left:${el.x}%`,
      `top:${el.y}%`,
      `width:${width}%`,
      `height:${height}%`,
      `background:${el.fill || 'var(--accent)'}`,
      `border-radius:${el.shape === 'circle' ? '50%' : (el.radius || 0) + 'px'}`,
      el.stroke ? `border:${Number(el.strokeWidth) || 1}px solid ${el.stroke}` : '',
      'cursor:move',
    ].filter(Boolean).join(';');

    addResizeHandles(div, el);
    return div;
  }

  function createEditorImage(el) {
    const img = document.createElement('img');
    img.className = 'editor-element editor-image';
    img.src = el.src || '';
    img.alt = el.alt || '';
    img.draggable = false;

    img.style.cssText = [
      'position:absolute',
      `left:${el.x}%`,
      `top:${el.y}%`,
      `width:${Math.max(1, Number(el.w) || 30)}%`,
      `height:${Math.max(1, Number(el.h) || 30)}%`,
      `object-fit:${el.fit || 'contain'}`,
      `border-radius:${Number(el.radius) || 0}px`,
      'cursor:move',
      'background:rgba(128,128,128,0.08)',
      'border:1px dashed rgba(120,120,120,0.5)',
      'user-select:none',
    ].join(';');

    addResizeHandles(img, el);
    return img;
  }

  function createEditorLine(el) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-element editor-line';
    wrapper.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'width:100%;height:100%;';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hit.setAttribute('x1', el.x1);
    hit.setAttribute('y1', el.y1);
    hit.setAttribute('x2', el.x2);
    hit.setAttribute('y2', el.y2);
    hit.setAttribute('stroke', 'transparent');
    hit.setAttribute('stroke-width', '4');
    hit.style.pointerEvents = 'stroke';
    hit.style.cursor = 'move';
    svg.appendChild(hit);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', el.x1);
    line.setAttribute('y1', el.y1);
    line.setAttribute('x2', el.x2);
    line.setAttribute('y2', el.y2);
    line.setAttribute('stroke', el.stroke || 'var(--border)');
    line.setAttribute('stroke-width', (Number(el.strokeWidth) || 1) * 0.3);
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.style.pointerEvents = 'none';
    svg.appendChild(line);

    const makeHandle = (x, y, key) => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('cx', x);
      handle.setAttribute('cy', y);
      handle.setAttribute('r', '1.5');
      handle.setAttribute('fill', '#2563eb');
      handle.setAttribute('stroke', '#fff');
      handle.setAttribute('stroke-width', '0.3');
      handle.classList.add('line-handle');
      handle.dataset.prop = key;
      handle.style.pointerEvents = isSelected(el.id) ? 'all' : 'none';
      handle.style.display = isSelected(el.id) ? 'block' : 'none';
      handle.style.cursor = 'crosshair';
      svg.appendChild(handle);
    };

    makeHandle(el.x1, el.y1, 'start');
    makeHandle(el.x2, el.y2, 'end');

    wrapper.appendChild(svg);
    return wrapper;
  }

  function createEditorMermaid(el) {
    const div = document.createElement('div');
    div.className = 'editor-element editor-mermaid';
    div.style.cssText = [
      'position:absolute',
      `left:${el.x}%`,
      `top:${el.y}%`,
      `width:${Math.max(1, Number(el.w) || 60)}%`,
      `height:${Math.max(1, Number(el.h) || 40)}%`,
      'cursor:move',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(128,128,128,0.08)',
      'border:1px dashed var(--border,#ccc)',
      'overflow:hidden',
      'font-family:var(--font-code,monospace)',
      'font-size:0.75rem',
      'color:var(--muted,#999)',
      'white-space:pre-wrap',
    ].join(';');

    const pre = document.createElement('pre');
    pre.textContent = el.content || '';
    pre.style.cssText = 'margin:0;padding:4px;line-height:1.3;white-space:pre-wrap;word-break:break-word;overflow:hidden;width:100%;height:100%;font-size:0.65rem;';
    div.appendChild(pre);

    addResizeHandles(div, el);
    return div;
  }

  function addResizeHandles(node, el) {
    if (!['text', 'shape', 'mermaid', 'image'].includes(el.type)) return;
    ['se', 'e', 's'].forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${dir}`;
      handle.dataset.dir = dir;
      node.appendChild(handle);
    });
  }

  function renderGuideLines() {
    if (!currentGuides.x.length && !currentGuides.y.length) return;

    currentGuides.x.forEach(x => {
      const line = document.createElement('div');
      line.className = 'guide-line guide-v';
      line.style.left = `${x}%`;
      canvas.appendChild(line);
    });

    currentGuides.y.forEach(y => {
      const line = document.createElement('div');
      line.className = 'guide-line guide-h';
      line.style.top = `${y}%`;
      canvas.appendChild(line);
    });
  }

  function renderMarqueeBox() {
    if (!pointerState || pointerState.mode !== 'marquee' || !pointerState.rect) return;
    const box = document.createElement('div');
    box.className = 'marquee-box';
    box.style.left = `${pointerState.rect.left}%`;
    box.style.top = `${pointerState.rect.top}%`;
    box.style.width = `${pointerState.rect.width}%`;
    box.style.height = `${pointerState.rect.height}%`;
    canvas.appendChild(box);
  }

  function clearGuides() {
    currentGuides = { x: [], y: [] };
  }

  /* -- Text Editing --------------------------------------------------- */

  function startTextEdit(div, el) {
    const before = el.content || '';

    div.contentEditable = true;
    div.style.cursor = 'text';
    div.classList.add('editing');
    div.focus();

    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const finish = () => {
      div.contentEditable = false;
      div.style.cursor = 'move';
      div.classList.remove('editing');
      el.content = div.innerText;
      saveDraft();
      renderSlidePanel();
      if ((el.content || '') !== before) pushHistory();
    };

    div.addEventListener('blur', finish, { once: true });
    div.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        div.innerText = before;
        div.blur();
      }
    });
  }

  /* -- Canvas Interaction -------------------------------------------- */

  function bindCanvasEvents() {
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    canvas.addEventListener('pointermove', onCanvasPointerMove);
    canvas.addEventListener('pointerup', onCanvasPointerUp);
    canvas.addEventListener('pointercancel', onCanvasPointerUp);
    canvas.addEventListener('dblclick', onCanvasDoubleClick);
    canvas.addEventListener('contextmenu', onCanvasContextMenu);
  }

  function onCanvasPointerDown(event) {
    hideContextMenu();

    if (event.button !== 0) return;

    const target = event.target.closest('.editor-element');
    const resizeHandle = event.target.closest('.resize-handle');
    const lineHandle = event.target.closest('.line-handle');

    const point = pointToPct(event);
    const beforeHash = JSON.stringify(deck);

    if (resizeHandle && target) {
      const id = target.dataset.elementId;
      if (!id) return;
      if (!isSelected(id)) selectOnly(id);

      pointerState = {
        mode: 'resize',
        pointerId: event.pointerId,
        dir: resizeHandle.dataset.dir,
        id,
        pointStart: point,
        startMap: captureStartMap([id]),
        beforeHash,
      };
      clearGuides();
      renderCanvas();
      renderProps();
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    if (lineHandle) {
      const lineNode = event.target.closest('.editor-element');
      const id = lineNode ? lineNode.dataset.elementId : null;
      if (!id) return;
      if (!isSelected(id)) selectOnly(id);

      pointerState = {
        mode: 'line-handle',
        pointerId: event.pointerId,
        id,
        handle: lineHandle.dataset.prop,
        beforeHash,
      };
      clearGuides();
      renderCanvas();
      renderProps();
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    if (target) {
      const id = target.dataset.elementId;
      if (!id) return;

      if (event.shiftKey) {
        toggleSelection(id);
        renderCanvas();
        renderProps();
        event.preventDefault();
        return;
      }

      if (!isSelected(id)) {
        selectOnly(id);
        renderCanvas();
        renderProps();
      }

      pointerState = {
        mode: 'drag',
        pointerId: event.pointerId,
        pointStart: point,
        startMap: captureStartMap(selectedIds),
        beforeHash,
      };
      clearGuides();
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    const baseSelection = event.shiftKey ? [...selectedIds] : [];
    if (!event.shiftKey) {
      clearSelection();
      renderProps();
    }

    pointerState = {
      mode: 'marquee',
      pointerId: event.pointerId,
      pointStart: point,
      pointCurrent: point,
      baseSelection,
      rect: { left: point.x, top: point.y, width: 0, height: 0 },
      beforeHash,
    };

    clearGuides();
    renderCanvas();
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onCanvasPointerMove(event) {
    if (!pointerState || pointerState.pointerId !== event.pointerId) return;

    const point = pointToPct(event);

    if (pointerState.mode === 'drag') {
      event.preventDefault();
      const dxRaw = point.x - pointerState.pointStart.x;
      const dyRaw = point.y - pointerState.pointStart.y;
      applyDrag(pointerState.startMap, dxRaw, dyRaw);
      renderCanvas();
      return;
    }

    if (pointerState.mode === 'resize') {
      event.preventDefault();
      applyResize(pointerState.id, pointerState.startMap[pointerState.id], point, pointerState.dir);
      renderCanvas();
      return;
    }

    if (pointerState.mode === 'line-handle') {
      event.preventDefault();
      applyLineHandleMove(pointerState.id, pointerState.handle, point);
      renderCanvas();
      return;
    }

    if (pointerState.mode === 'marquee') {
      event.preventDefault();
      pointerState.pointCurrent = point;
      pointerState.rect = normalizedRect(pointerState.pointStart, point);
      applyMarqueeSelection(pointerState.rect, pointerState.baseSelection);
      renderCanvas();
      renderProps();
    }
  }

  function onCanvasPointerUp(event) {
    if (!pointerState || pointerState.pointerId !== event.pointerId) return;

    const changed = pointerState.beforeHash !== JSON.stringify(deck);

    if (pointerState.mode === 'marquee') {
      const tiny = pointerState.rect.width < 0.4 && pointerState.rect.height < 0.4;
      if (tiny && !event.shiftKey) {
        clearSelection();
      }
      renderProps();
    }

    pointerState = null;
    clearGuides();
    renderCanvas();
    renderSlidePanel();

    if (changed) {
      saveDraft();
      pushHistory();
    }
  }

  function onCanvasDoubleClick(event) {
    if (!event.target.closest('.editor-element')) {
      const p = pointToPct(event);
      addElement('text', { x: clamp(p.x, 5, 95), y: clamp(p.y, 5, 95), w: 30, style: 'body', content: 'New text' });
    }
  }

  function pointToPct(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  }

  function captureStartMap(ids) {
    const map = {};
    ids.forEach(id => {
      const el = getElementById(id);
      if (el) map[id] = deepClone(el);
    });
    return map;
  }

  function applyDrag(startMap, dxRaw, dyRaw) {
    let dx = dxRaw;
    let dy = dyRaw;
    clearGuides();

    const bounds = selectionBoundsFromStart(startMap, selectedIds, dx, dy);
    if (bounds) {
      const snap = computeSnapDelta(bounds, new Set(selectedIds));
      dx += snap.dx;
      dy += snap.dy;
      currentGuides = snap.guides;
    }

    selectedIds.forEach(id => {
      const startEl = startMap[id];
      const el = getElementById(id);
      if (!startEl || !el) return;

      if (el.type === 'line') {
        el.x1 = clamp(startEl.x1 + dx, 0, 100);
        el.y1 = clamp(startEl.y1 + dy, 0, 100);
        el.x2 = clamp(startEl.x2 + dx, 0, 100);
        el.y2 = clamp(startEl.y2 + dy, 0, 100);
      } else {
        el.x = clamp(startEl.x + dx, 0, 100);
        el.y = clamp(startEl.y + dy, 0, 100);

        if (prefs.snapToGrid) {
          el.x = quantize(el.x);
          el.y = quantize(el.y);
        }
      }
    });
  }

  function applyResize(id, startEl, point, dir) {
    const el = getElementById(id);
    if (!el || !startEl) return;

    clearGuides();

    const styleCentered = isCenteredText(startEl);

    if (dir.includes('e')) {
      let right = point.x;
      if (prefs.snapToGrid) right = quantize(right);

      if (prefs.snapToGuides) {
        const snap = snapAxis(right, 'x', id);
        right = snap.value;
        if (snap.guide !== null) currentGuides.x.push(snap.guide);
      }

      if (styleCentered) {
        const leftEdge = startEl.x - (Number(startEl.w) || 20) / 2;
        el.w = clamp(right - leftEdge, 5, 100);
      } else {
        el.w = clamp(right - startEl.x, 5, 100);
      }
    }

    if (dir.includes('s')) {
      let bottom = point.y;
      if (prefs.snapToGrid) bottom = quantize(bottom);

      if (prefs.snapToGuides) {
        const snap = snapAxis(bottom, 'y', id);
        bottom = snap.value;
        if (snap.guide !== null) currentGuides.y.push(snap.guide);
      }

      el.h = clamp(bottom - startEl.y, 5, 100);
    }
  }

  function applyLineHandleMove(id, handle, point) {
    const el = getElementById(id);
    if (!el || el.type !== 'line') return;

    clearGuides();

    let x = clamp(point.x, 0, 100);
    let y = clamp(point.y, 0, 100);

    if (prefs.snapToGrid) {
      x = quantize(x);
      y = quantize(y);
    }

    if (prefs.snapToGuides) {
      const snapX = snapAxis(x, 'x', id);
      const snapY = snapAxis(y, 'y', id);
      x = snapX.value;
      y = snapY.value;
      if (snapX.guide !== null) currentGuides.x.push(snapX.guide);
      if (snapY.guide !== null) currentGuides.y.push(snapY.guide);
    }

    if (handle === 'start') {
      el.x1 = x;
      el.y1 = y;
    } else {
      el.x2 = x;
      el.y2 = y;
    }
  }

  function applyMarqueeSelection(rect, baseSelection) {
    const hits = [];
    deck.slides[currentSlide].elements.forEach(el => {
      const box = getElementBox(el);
      if (!box) return;

      const intersects = !(
        box.right < rect.left ||
        box.left > rect.left + rect.width ||
        box.bottom < rect.top ||
        box.top > rect.top + rect.height
      );
      if (intersects) hits.push(el.id);
    });

    const merged = [...baseSelection];
    hits.forEach(id => {
      if (!merged.includes(id)) merged.push(id);
    });

    setSelection(merged, merged[merged.length - 1] || null);
  }

  function normalizedRect(a, b) {
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const right = Math.max(a.x, b.x);
    const bottom = Math.max(a.y, b.y);
    return { left, top, width: right - left, height: bottom - top };
  }

  /* -- Snapping ------------------------------------------------------- */

  function selectionBoundsFromStart(startMap, ids, dx, dy) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    ids.forEach(id => {
      const startEl = startMap[id];
      if (!startEl) return;
      const shifted = shiftedElement(startEl, dx, dy);
      const box = getElementBox(shifted);
      if (!box) return;

      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.bottom);
    });

    if (!isFinite(left) || !isFinite(top)) return null;

    return {
      left,
      right,
      top,
      bottom,
      cx: (left + right) / 2,
      cy: (top + bottom) / 2,
    };
  }

  function shiftedElement(el, dx, dy) {
    const copy = deepClone(el);
    if (copy.type === 'line') {
      copy.x1 += dx;
      copy.y1 += dy;
      copy.x2 += dx;
      copy.y2 += dy;
    } else {
      copy.x += dx;
      copy.y += dy;
    }
    return copy;
  }

  function computeSnapDelta(bounds, excludeIds) {
    const result = {
      dx: 0,
      dy: 0,
      guides: { x: [], y: [] },
    };

    if (!prefs.snapToGuides) return result;

    const xTargets = collectTargets('x', excludeIds);
    const yTargets = collectTargets('y', excludeIds);

    const xSnap = bestSnap([bounds.left, bounds.cx, bounds.right], xTargets, prefs.snapThreshold);
    const ySnap = bestSnap([bounds.top, bounds.cy, bounds.bottom], yTargets, prefs.snapThreshold);

    if (xSnap) {
      result.dx = xSnap.delta;
      result.guides.x.push(xSnap.target);
    }
    if (ySnap) {
      result.dy = ySnap.delta;
      result.guides.y.push(ySnap.target);
    }

    if (prefs.snapToGrid) {
      const qx = quantize(bounds.left + result.dx) - bounds.left;
      const qy = quantize(bounds.top + result.dy) - bounds.top;
      result.dx = qx;
      result.dy = qy;
      result.guides.x = [];
      result.guides.y = [];
    }

    result.guides.x = uniqueNumbers(result.guides.x);
    result.guides.y = uniqueNumbers(result.guides.y);
    return result;
  }

  function snapAxis(value, axis, excludeId) {
    const fallback = { value, guide: null };
    if (prefs.snapToGrid) fallback.value = quantize(fallback.value);
    if (!prefs.snapToGuides) return fallback;

    const targets = collectTargets(axis, new Set(excludeId ? [excludeId] : []));
    let bestTarget = null;
    let bestDistance = Infinity;

    targets.forEach(target => {
      const d = Math.abs(target - value);
      if (d <= prefs.snapThreshold && d < bestDistance) {
        bestDistance = d;
        bestTarget = target;
      }
    });

    if (bestTarget === null) return fallback;
    return { value: bestTarget, guide: bestTarget };
  }

  function collectTargets(axis, excludeIds = new Set()) {
    const targets = axis === 'x' ? [0, 50, 100] : [0, 50, 100];

    deck.slides[currentSlide].elements.forEach(el => {
      if (excludeIds.has(el.id)) return;
      const box = getElementBox(el);
      if (!box) return;
      if (axis === 'x') {
        targets.push(box.left, box.cx, box.right);
      } else {
        targets.push(box.top, box.cy, box.bottom);
      }
    });

    return uniqueNumbers(targets);
  }

  function bestSnap(anchors, targets, threshold) {
    let winner = null;

    anchors.forEach(anchor => {
      targets.forEach(target => {
        const delta = target - anchor;
        const distance = Math.abs(delta);
        if (distance > threshold) return;
        if (!winner || distance < winner.distance) {
          winner = { delta, target, distance };
        }
      });
    });

    return winner;
  }

  function uniqueNumbers(values) {
    const set = new Set(values.map(v => Number(v.toFixed(3))));
    return [...set];
  }

  function quantize(v) {
    const step = Math.max(0.1, prefs.gridStep);
    return Math.round(v / step) * step;
  }

  /* -- Context Menu --------------------------------------------------- */

  function createContextMenu() {
    contextMenuEl = document.createElement('div');
    contextMenuEl.className = 'editor-context-menu';
    contextMenuEl.innerHTML = [
      '<button data-action="duplicate">Duplicate</button>',
      '<button data-action="copy">Copy</button>',
      '<button data-action="paste">Paste</button>',
      '<button data-action="delete">Delete</button>',
      '<hr>',
      '<button data-action="front">Bring To Front</button>',
      '<button data-action="forward">Bring Forward</button>',
      '<button data-action="backward">Send Backward</button>',
      '<button data-action="back">Send To Back</button>',
      '<hr>',
      '<button data-action="align-left">Align Left</button>',
      '<button data-action="align-center">Align Center</button>',
      '<button data-action="align-right">Align Right</button>',
      '<button data-action="align-top">Align Top</button>',
      '<button data-action="align-middle">Align Middle</button>',
      '<button data-action="align-bottom">Align Bottom</button>',
      '<button data-action="distribute-h">Distribute Horizontally</button>',
      '<button data-action="distribute-v">Distribute Vertically</button>',
    ].join('');

    contextMenuEl.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      handleContextAction(button.dataset.action);
      hideContextMenu();
    });

    document.body.appendChild(contextMenuEl);
  }

  function bindContextMenuEvents() {
    document.addEventListener('click', event => {
      if (!contextMenuEl.contains(event.target)) hideContextMenu();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideContextMenu();
    });

    window.addEventListener('resize', hideContextMenu);
  }

  function onCanvasContextMenu(event) {
    const target = event.target.closest('.editor-element');
    if (!target) return;

    event.preventDefault();
    const id = target.dataset.elementId;
    if (!id) return;

    if (!isSelected(id)) selectOnly(id);
    renderCanvas();
    renderProps();

    showContextMenu(event.clientX, event.clientY);
  }

  function showContextMenu(clientX, clientY) {
    if (!contextMenuEl) return;
    const rect = contextMenuEl.getBoundingClientRect();
    let left = clientX;
    let top = clientY;

    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;

    contextMenuEl.style.left = `${Math.max(8, left)}px`;
    contextMenuEl.style.top = `${Math.max(8, top)}px`;
    contextMenuEl.classList.add('open');
  }

  function hideContextMenu() {
    if (!contextMenuEl) return;
    contextMenuEl.classList.remove('open');
  }

  function handleContextAction(action) {
    if (action === 'duplicate') duplicateSelection();
    if (action === 'copy') copySelection();
    if (action === 'paste') pasteSelection();
    if (action === 'delete') deleteSelection();
    if (action === 'front') bringToFront();
    if (action === 'forward') bringForward();
    if (action === 'backward') sendBackward();
    if (action === 'back') sendToBack();
    if (action === 'align-left') alignSelected('left');
    if (action === 'align-center') alignSelected('center');
    if (action === 'align-right') alignSelected('right');
    if (action === 'align-top') alignSelected('top');
    if (action === 'align-middle') alignSelected('middle');
    if (action === 'align-bottom') alignSelected('bottom');
    if (action === 'distribute-h') distributeSelected('horizontal');
    if (action === 'distribute-v') distributeSelected('vertical');
  }

  /* -- Properties Panel ---------------------------------------------- */

  function renderProps() {
    if (!propsPanel) return;

    const selected = getSelectedElements();
    if (selected.length === 0) {
      propsPanel.innerHTML = [
        '<div class="props-empty">',
        '<p>Select an element to edit properties</p>',
        '<p style="font-size:0.8rem;color:var(--muted,#999);margin-top:8px">',
        'Shift+click for multi-select. Double-click text to edit.',
        '</p>',
        '</div>',
      ].join('');
      return;
    }

    if (selected.length > 1) {
      renderMultiProps(selected.length);
      return;
    }

    const el = selected[0];
    let html = `<div class="props-section"><h3>${capitalize(el.type)}</h3>`;

    if (el.type === 'text') {
      html += [
        '<label>Style',
        '<select data-prop="style">',
        Object.keys(theme.textStyles)
          .map(style => `<option value="${style}" ${el.style === style ? 'selected' : ''}>${style}</option>`)
          .join(''),
        '</select></label>',
        `<label>Content<textarea data-prop="content" rows="4">${escapeHtml(el.content || '')}</textarea></label>`,
        `<label>Color<input type="text" data-prop="color" value="${escapeHtml(el.color || '')}" placeholder="optional"></label>`,
        `<label>Font Size<input type="text" data-prop="fontSize" value="${escapeHtml(el.fontSize || '')}" placeholder="e.g. 2rem"></label>`,
      ].join('');
    }

    if (el.type === 'shape') {
      html += [
        '<label>Shape',
        '<select data-prop="shape">',
        `<option value="rect" ${el.shape === 'rect' ? 'selected' : ''}>Rectangle</option>`,
        `<option value="circle" ${el.shape === 'circle' ? 'selected' : ''}>Circle</option>`,
        '</select></label>',
        `<label>Fill<input type="text" data-prop="fill" value="${escapeHtml(el.fill || 'var(--accent)')}"></label>`,
        `<label>Stroke<input type="text" data-prop="stroke" value="${escapeHtml(el.stroke || '')}"></label>`,
        `<label>Stroke Width<input type="number" data-prop="strokeWidth" value="${Number(el.strokeWidth) || 1}" min="1" max="30"></label>`,
        `<label>Radius<input type="number" data-prop="radius" value="${Number(el.radius) || 0}" min="0" max="200"></label>`,
      ].join('');
    }

    if (el.type === 'image') {
      html += [
        `<label>Image URL<textarea data-prop="src" rows="4">${escapeHtml(el.src || '')}</textarea></label>`,
        `<label>Alt Text<input type="text" data-prop="alt" value="${escapeHtml(el.alt || '')}"></label>`,
        '<label>Fit',
        '<select data-prop="fit">',
        `<option value="contain" ${el.fit === 'contain' ? 'selected' : ''}>Contain</option>`,
        `<option value="cover" ${el.fit === 'cover' ? 'selected' : ''}>Cover</option>`,
        `<option value="fill" ${el.fit === 'fill' ? 'selected' : ''}>Fill</option>`,
        `<option value="none" ${el.fit === 'none' ? 'selected' : ''}>None</option>`,
        '</select></label>',
        `<label>Radius<input type="number" data-prop="radius" value="${Number(el.radius) || 0}" min="0" max="200"></label>`,
      ].join('');
    }

    if (el.type === 'mermaid') {
      html += `<label>Mermaid Source<textarea data-prop="content" rows="10" style="font-family:var(--font-code,monospace);font-size:0.8rem;white-space:pre;tab-size:2">${escapeHtml(el.content || '')}</textarea></label>`;
    }

    if (el.type === 'line') {
      html += [
        `<label>X1 %<input type="number" data-prop="x1" value="${round(el.x1)}" min="0" max="100" step="0.1"></label>`,
        `<label>Y1 %<input type="number" data-prop="y1" value="${round(el.y1)}" min="0" max="100" step="0.1"></label>`,
        `<label>X2 %<input type="number" data-prop="x2" value="${round(el.x2)}" min="0" max="100" step="0.1"></label>`,
        `<label>Y2 %<input type="number" data-prop="y2" value="${round(el.y2)}" min="0" max="100" step="0.1"></label>`,
        `<label>Stroke<input type="text" data-prop="stroke" value="${escapeHtml(el.stroke || 'var(--border)')}"></label>`,
        `<label>Width<input type="number" data-prop="strokeWidth" value="${Number(el.strokeWidth) || 1}" min="1" max="20"></label>`,
      ].join('');
    } else {
      html += [
        `<label>X %<input type="number" data-prop="x" value="${round(el.x)}" min="0" max="100" step="0.1"></label>`,
        `<label>Y %<input type="number" data-prop="y" value="${round(el.y)}" min="0" max="100" step="0.1"></label>`,
        `<label>Width %<input type="number" data-prop="w" value="${round(el.w || 20)}" min="1" max="100" step="0.1"></label>`,
      ].join('');

      if (el.type !== 'text') {
        html += `<label>Height %<input type="number" data-prop="h" value="${round(el.h || el.w || 20)}" min="1" max="100" step="0.1"></label>`;
      }
    }

    html += [
      '<div class="props-inline-actions">',
      '<button data-action="copy">Copy</button>',
      '<button data-action="duplicate">Duplicate</button>',
      '</div>',
      '<button class="props-delete" data-action="delete">Delete Element</button>',
      '</div>',
      '<div class="props-section">',
      '<h3>Arrange</h3>',
      '<div class="props-grid-actions">',
      '<button data-action="front">To Front</button>',
      '<button data-action="forward">Forward</button>',
      '<button data-action="backward">Backward</button>',
      '<button data-action="back">To Back</button>',
      '</div>',
      '</div>',
      '<div class="props-section">',
      '<h3>Slide</h3>',
      `<label>Speaker Notes<textarea data-slide-prop="notes" rows="4">${escapeHtml(deck.slides[currentSlide].notes || '')}</textarea></label>`,
      '</div>',
    ].join('');

    propsPanel.innerHTML = html;

    bindPropsInputs(el);
  }

  function renderMultiProps(count) {
    propsPanel.innerHTML = [
      '<div class="props-section">',
      `<h3>${count} Selected</h3>`,
      '<div class="props-grid-actions">',
      '<button data-action="align-left">Align Left</button>',
      '<button data-action="align-center">Align Center</button>',
      '<button data-action="align-right">Align Right</button>',
      '<button data-action="align-top">Align Top</button>',
      '<button data-action="align-middle">Align Middle</button>',
      '<button data-action="align-bottom">Align Bottom</button>',
      '<button data-action="distribute-h">Distribute H</button>',
      '<button data-action="distribute-v">Distribute V</button>',
      '</div>',
      '</div>',
      '<div class="props-section">',
      '<h3>Arrange</h3>',
      '<div class="props-grid-actions">',
      '<button data-action="front">To Front</button>',
      '<button data-action="forward">Forward</button>',
      '<button data-action="backward">Backward</button>',
      '<button data-action="back">To Back</button>',
      '</div>',
      '<div class="props-inline-actions" style="margin-top:8px">',
      '<button data-action="copy">Copy</button>',
      '<button data-action="duplicate">Duplicate</button>',
      '</div>',
      '<button class="props-delete" data-action="delete">Delete Selected</button>',
      '</div>',
      '<div class="props-section">',
      '<h3>Slide</h3>',
      `<label>Speaker Notes<textarea data-slide-prop="notes" rows="4">${escapeHtml(deck.slides[currentSlide].notes || '')}</textarea></label>`,
      '</div>',
    ].join('');

    propsPanel.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        handleContextAction(button.dataset.action);
      });
    });

    propsPanel.querySelectorAll('[data-slide-prop]').forEach(input => {
      input.addEventListener('change', () => {
        deck.slides[currentSlide][input.dataset.slideProp] = input.value;
        saveDraft();
        pushHistory();
      });
    });
  }

  function bindPropsInputs(el) {
    propsPanel.querySelectorAll('[data-prop]').forEach(input => {
      input.addEventListener('change', () => {
        const prop = input.dataset.prop;
        const before = JSON.stringify(deck);
        let value = input.value;

        if (input.type === 'number') value = Number(value);
        if (prop === 'x' || prop === 'y' || prop === 'w' || prop === 'h' || prop === 'x1' || prop === 'y1' || prop === 'x2' || prop === 'y2') {
          value = clamp(Number(value), 0, 100);
        }

        if ((prop === 'radius' || prop === 'strokeWidth') && Number.isNaN(Number(value))) {
          value = 0;
        }

        el[prop] = value;
        renderCanvas();
        renderSlidePanel();
        saveDraft();

        if (before !== JSON.stringify(deck)) pushHistory();
      });
    });

    propsPanel.querySelectorAll('[data-slide-prop]').forEach(input => {
      input.addEventListener('change', () => {
        const before = JSON.stringify(deck);
        deck.slides[currentSlide][input.dataset.slideProp] = input.value;
        saveDraft();
        if (before !== JSON.stringify(deck)) pushHistory();
      });
    });

    propsPanel.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        handleContextAction(button.dataset.action);
      });
    });
  }

  /* -- Element Operations -------------------------------------------- */

  function getElementById(id) {
    if (!id) return null;
    const slide = deck.slides[currentSlide];
    if (!slide) return null;
    return slide.elements.find(el => el.id === id) || null;
  }

  function addElement(type, props = {}) {
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    const el = { id: genId(), type, ...props };

    if (type === 'text') {
      Object.assign(el, {
        content: 'New text',
        x: 50,
        y: 50,
        w: 40,
        style: 'body',
        ...props,
      });
    }

    if (type === 'shape') {
      Object.assign(el, {
        shape: 'rect',
        x: 30,
        y: 30,
        w: 20,
        h: 15,
        fill: 'var(--accent)',
        radius: 0,
        ...props,
      });
    }

    if (type === 'line') {
      Object.assign(el, {
        x1: 20,
        y1: 50,
        x2: 80,
        y2: 50,
        stroke: 'var(--border)',
        strokeWidth: 2,
        ...props,
      });
    }

    if (type === 'mermaid') {
      Object.assign(el, {
        content: 'graph TD\n  A[Start]-->B[End]',
        x: 12,
        y: 18,
        w: 76,
        h: 56,
        ...props,
      });
      deck.mermaid = true;
    }

    if (type === 'image') {
      Object.assign(el, {
        src: '',
        alt: '',
        x: 15,
        y: 20,
        w: 40,
        h: 40,
        fit: 'contain',
        radius: 0,
        ...props,
      });
    }

    slide.elements.push(el);
    setSelection([el.id], el.id);

    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function deleteElement(id) {
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    const before = slide.elements.length;
    slide.elements = slide.elements.filter(el => el.id !== id);
    if (slide.elements.length === before) return;

    clearSelection();
    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function deleteSelection() {
    if (!selectedIds.length) return;
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    const idSet = new Set(selectedIds);
    slide.elements = slide.elements.filter(el => !idSet.has(el.id));

    clearSelection();
    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function addSlide() {
    deck.slides.push({
      layout: 'freeform',
      elements: [
        { id: genId(), type: 'text', content: 'New Slide', x: 50, y: 20, w: 70, style: 'heading' },
      ],
      notes: '',
    });

    currentSlide = deck.slides.length - 1;
    clearSelection();
    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function deleteSlide(index) {
    if (deck.slides.length <= 1) return;

    deck.slides.splice(index, 1);
    currentSlide = Math.max(0, Math.min(currentSlide, deck.slides.length - 1));
    clearSelection();

    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function moveSlide(from, to) {
    if (to < 0 || to >= deck.slides.length || from === to) return;

    const [slide] = deck.slides.splice(from, 1);
    deck.slides.splice(to, 0, slide);
    currentSlide = to;

    renderSlidePanel();
    saveDraft();
    pushHistory();
  }

  function duplicateSlide(index) {
    const source = deck.slides[index];
    if (!source) return;

    const copy = deepClone(source);
    copy.elements.forEach(el => {
      el.id = genId();
    });

    deck.slides.splice(index + 1, 0, copy);
    currentSlide = index + 1;
    clearSelection();

    renderSlidePanel();
    renderCanvas();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function copySelection() {
    const selected = getSelectedElements();
    if (!selected.length) return;
    clipboard = selected.map(el => deepClone(el));
    pasteCount = 0;
  }

  function pasteSelection() {
    const slide = deck.slides[currentSlide];
    if (!slide || !clipboard.length) return;

    const offset = 2 + pasteCount;
    const pastedIds = [];

    clipboard.forEach(item => {
      const clone = deepClone(item);
      clone.id = genId();

      if (clone.type === 'line') {
        clone.x1 = clamp((clone.x1 || 0) + offset, 0, 100);
        clone.y1 = clamp((clone.y1 || 0) + offset, 0, 100);
        clone.x2 = clamp((clone.x2 || 0) + offset, 0, 100);
        clone.y2 = clamp((clone.y2 || 0) + offset, 0, 100);
      } else {
        clone.x = clamp((clone.x || 0) + offset, 0, 100);
        clone.y = clamp((clone.y || 0) + offset, 0, 100);
      }

      slide.elements.push(clone);
      pastedIds.push(clone.id);
    });

    pasteCount += 1;
    setSelection(pastedIds, pastedIds[pastedIds.length - 1] || null);

    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
    pushHistory();
  }

  function duplicateSelection() {
    copySelection();
    pasteSelection();
  }

  function addImageFromUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return;
    addElement('image', { src: trimmed });
  }

  function addImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        addElement('image', { src: String(event.target.result || '') });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* -- Arrange -------------------------------------------------------- */

  function bringToFront() {
    reorderSelection('front');
  }

  function sendToBack() {
    reorderSelection('back');
  }

  function bringForward() {
    reorderSelection('forward');
  }

  function sendBackward() {
    reorderSelection('backward');
  }

  function reorderSelection(mode) {
    const slide = deck.slides[currentSlide];
    if (!slide || !selectedIds.length) return;

    const before = JSON.stringify(slide.elements);
    const selectedSet = new Set(selectedIds);

    if (mode === 'front') {
      const selected = slide.elements.filter(el => selectedSet.has(el.id));
      const rest = slide.elements.filter(el => !selectedSet.has(el.id));
      slide.elements = [...rest, ...selected];
    }

    if (mode === 'back') {
      const selected = slide.elements.filter(el => selectedSet.has(el.id));
      const rest = slide.elements.filter(el => !selectedSet.has(el.id));
      slide.elements = [...selected, ...rest];
    }

    if (mode === 'forward') {
      for (let i = slide.elements.length - 2; i >= 0; i -= 1) {
        const here = slide.elements[i];
        const next = slide.elements[i + 1];
        if (selectedSet.has(here.id) && !selectedSet.has(next.id)) {
          slide.elements[i] = next;
          slide.elements[i + 1] = here;
        }
      }
    }

    if (mode === 'backward') {
      for (let i = 1; i < slide.elements.length; i += 1) {
        const here = slide.elements[i];
        const prev = slide.elements[i - 1];
        if (selectedSet.has(here.id) && !selectedSet.has(prev.id)) {
          slide.elements[i] = prev;
          slide.elements[i - 1] = here;
        }
      }
    }

    renderCanvas();
    renderSlidePanel();
    saveDraft();
    if (before !== JSON.stringify(slide.elements)) pushHistory();
  }

  /* -- Align / Distribute -------------------------------------------- */

  function alignSelected(mode) {
    const selected = getSelectedElements();
    if (selected.length < 2) return;

    const bounds = getAggregateBounds(selected);
    if (!bounds) return;

    const before = JSON.stringify(deck);

    selected.forEach(el => {
      const box = getElementBox(el);
      if (!box) return;

      let targetLeft = box.left;
      let targetTop = box.top;

      if (mode === 'left') targetLeft = bounds.left;
      if (mode === 'center') targetLeft = bounds.cx - box.width / 2;
      if (mode === 'right') targetLeft = bounds.right - box.width;

      if (mode === 'top') targetTop = bounds.top;
      if (mode === 'middle') targetTop = bounds.cy - box.height / 2;
      if (mode === 'bottom') targetTop = bounds.bottom - box.height;

      repositionElementToBox(el, targetLeft, targetTop, box.width, box.height);
    });

    renderCanvas();
    renderSlidePanel();
    saveDraft();
    if (before !== JSON.stringify(deck)) pushHistory();
  }

  function distributeSelected(direction) {
    const selected = getSelectedElements();
    if (selected.length < 3) return;

    const before = JSON.stringify(deck);

    if (direction === 'horizontal') {
      const list = selected
        .map(el => ({ el, box: getElementBox(el) }))
        .filter(item => item.box)
        .sort((a, b) => a.box.cx - b.box.cx);

      if (list.length < 3) return;

      const first = list[0].box.cx;
      const last = list[list.length - 1].box.cx;
      const gap = (last - first) / (list.length - 1);

      list.forEach((item, i) => {
        if (i === 0 || i === list.length - 1) return;
        const targetCx = first + gap * i;
        const targetLeft = targetCx - item.box.width / 2;
        repositionElementToBox(item.el, targetLeft, item.box.top, item.box.width, item.box.height);
      });
    }

    if (direction === 'vertical') {
      const list = selected
        .map(el => ({ el, box: getElementBox(el) }))
        .filter(item => item.box)
        .sort((a, b) => a.box.cy - b.box.cy);

      if (list.length < 3) return;

      const first = list[0].box.cy;
      const last = list[list.length - 1].box.cy;
      const gap = (last - first) / (list.length - 1);

      list.forEach((item, i) => {
        if (i === 0 || i === list.length - 1) return;
        const targetCy = first + gap * i;
        const targetTop = targetCy - item.box.height / 2;
        repositionElementToBox(item.el, item.box.left, targetTop, item.box.width, item.box.height);
      });
    }

    renderCanvas();
    renderSlidePanel();
    saveDraft();
    if (before !== JSON.stringify(deck)) pushHistory();
  }

  function getAggregateBounds(elements) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    elements.forEach(el => {
      const box = getElementBox(el);
      if (!box) return;
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
      top = Math.min(top, box.top);
      bottom = Math.max(bottom, box.bottom);
    });

    if (!isFinite(left) || !isFinite(top)) return null;
    return { left, right, top, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
  }

  function getElementBox(el) {
    if (!el) return null;

    if (el.type === 'line') {
      const left = Math.min(el.x1, el.x2);
      const right = Math.max(el.x1, el.x2);
      const top = Math.min(el.y1, el.y2);
      const bottom = Math.max(el.y1, el.y2);
      return {
        left,
        right,
        top,
        bottom,
        width: Math.max(0.2, right - left),
        height: Math.max(0.2, bottom - top),
        cx: (left + right) / 2,
        cy: (top + bottom) / 2,
      };
    }

    const width = Math.max(1, Number(el.w) || 20);
    const height = Math.max(1, Number(el.h) || (el.type === 'text' ? 12 : Number(el.w) || 20));

    let left = Number(el.x) || 0;
    if (isCenteredText(el)) left -= width / 2;

    const top = Number(el.y) || 0;
    const right = left + width;
    const bottom = top + height;

    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
      cx: left + width / 2,
      cy: top + height / 2,
    };
  }

  function repositionElementToBox(el, left, top, width, height) {
    if (el.type === 'line') {
      const box = getElementBox(el);
      if (!box) return;
      const dx = left - box.left;
      const dy = top - box.top;
      el.x1 = clamp(el.x1 + dx, 0, 100);
      el.y1 = clamp(el.y1 + dy, 0, 100);
      el.x2 = clamp(el.x2 + dx, 0, 100);
      el.y2 = clamp(el.y2 + dy, 0, 100);
      return;
    }

    el.y = clamp(top, 0, 100);

    if (isCenteredText(el)) {
      el.x = clamp(left + width / 2, 0, 100);
    } else {
      el.x = clamp(left, 0, 100);
    }

    if (typeof el.w !== 'undefined') el.w = clamp(width, 1, 100);
    if (el.type !== 'text') el.h = clamp(height, 1, 100);
  }

  /* -- Layout Presets ------------------------------------------------- */

  function applyLayoutPreset(name) {
    const slide = deck.slides[currentSlide];
    if (!slide) return;

    const preset = (name || '').trim();
    if (!preset) return;

    const hasContent = slide.elements.length > 0;
    if (hasContent) {
      const ok = window.confirm('Replace current slide elements with this layout preset?');
      if (!ok) return;
    }

    let elements = [];

    if (preset === 'blank') {
      elements = [];
    }

    if (preset === 'title-body') {
      elements = [
        { id: genId(), type: 'text', content: 'Slide Title', x: 50, y: 16, w: 82, style: 'heading' },
        { id: genId(), type: 'line', x1: 8, y1: 27, x2: 92, y2: 27, stroke: 'var(--border)', strokeWidth: 1 },
        { id: genId(), type: 'text', content: '• Point one\n• Point two\n• Point three', x: 10, y: 34, w: 80, style: 'body' },
      ];
    }

    if (preset === 'two-column') {
      elements = [
        { id: genId(), type: 'text', content: 'Two Column Layout', x: 50, y: 12, w: 84, style: 'heading' },
        { id: genId(), type: 'shape', shape: 'rect', x: 8, y: 24, w: 40, h: 62, fill: 'var(--accent-light)', radius: 6 },
        { id: genId(), type: 'shape', shape: 'rect', x: 52, y: 24, w: 40, h: 62, fill: 'var(--accent-light)', radius: 6 },
        { id: genId(), type: 'text', content: 'Left column\n\nAdd content here', x: 10, y: 30, w: 36, style: 'body' },
        { id: genId(), type: 'text', content: 'Right column\n\nAdd content here', x: 54, y: 30, w: 36, style: 'body' },
      ];
    }

    if (preset === 'section-break') {
      elements = [
        { id: genId(), type: 'shape', shape: 'rect', x: 0, y: 0, w: 100, h: 100, fill: 'var(--accent-light)' },
        { id: genId(), type: 'text', content: 'Section Title', x: 50, y: 38, w: 84, style: 'title' },
        { id: genId(), type: 'text', content: 'Optional subtitle', x: 50, y: 58, w: 70, style: 'subtitle' },
      ];
    }

    if (preset === 'comparison') {
      elements = [
        { id: genId(), type: 'text', content: 'Comparison', x: 50, y: 10, w: 84, style: 'heading' },
        { id: genId(), type: 'text', content: 'Option A', x: 27, y: 22, w: 35, style: 'subtitle' },
        { id: genId(), type: 'text', content: 'Option B', x: 73, y: 22, w: 35, style: 'subtitle' },
        { id: genId(), type: 'line', x1: 50, y1: 24, x2: 50, y2: 88, stroke: 'var(--border)', strokeWidth: 1 },
        { id: genId(), type: 'text', content: '• Pros\n• Cons\n• Tradeoffs', x: 10, y: 30, w: 34, style: 'body' },
        { id: genId(), type: 'text', content: '• Pros\n• Cons\n• Tradeoffs', x: 56, y: 30, w: 34, style: 'body' },
      ];
    }

    if (!elements.length && preset !== 'blank') return;

    slide.layout = preset;
    slide.elements = elements;

    clearSelection();
    renderCanvas();
    renderSlidePanel();
    renderProps();
    saveDraft();
    pushHistory();
  }

  /* -- Keyboard / Clipboard ------------------------------------------ */

  function bindKeyboard() {
    document.addEventListener('keydown', event => {
      const typingTarget = event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
      if (typingTarget) return;

      const isMod = event.ctrlKey || event.metaKey;

      if (isMod && (event.key === 'z' || event.key === 'Z')) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (isMod && (event.key === 'y' || event.key === 'Y')) {
        event.preventDefault();
        redo();
        return;
      }

      if (isMod && (event.key === 'c' || event.key === 'C')) {
        event.preventDefault();
        copySelection();
        return;
      }

      if (isMod && (event.key === 'v' || event.key === 'V')) {
        event.preventDefault();
        pasteSelection();
        return;
      }

      if (isMod && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        duplicateSelection();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length) {
          event.preventDefault();
          deleteSelection();
        }
        return;
      }

      if (event.key === 'Escape') {
        hideContextMenu();
        if (selectedIds.length) {
          clearSelection();
          renderCanvas();
          renderProps();
        }
        return;
      }

      if (event.key === 'ArrowUp' && isMod) {
        event.preventDefault();
        moveSlide(currentSlide, currentSlide - 1);
        return;
      }

      if (event.key === 'ArrowDown' && isMod) {
        event.preventDefault();
        moveSlide(currentSlide, currentSlide + 1);
        return;
      }

      if (selectedIds.length && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();

        let step = 1;
        if (event.shiftKey) step = 5;
        else if (event.altKey) step = 0.2;

        if (event.key === 'ArrowLeft') nudgeSelection(-step, 0);
        if (event.key === 'ArrowRight') nudgeSelection(step, 0);
        if (event.key === 'ArrowUp') nudgeSelection(0, -step);
        if (event.key === 'ArrowDown') nudgeSelection(0, step);
      }
    });
  }

  function bindClipboardEvents() {
    document.addEventListener('paste', event => {
      const target = event.target;
      const typingTarget = target && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName));
      if (typingTarget) return;
      if (clipboard.length) {
        event.preventDefault();
        pasteSelection();
      }
    });
  }

  function nudgeSelection(dx, dy) {
    const before = JSON.stringify(deck);

    selectedIds.forEach(id => {
      const el = getElementById(id);
      if (!el) return;

      if (el.type === 'line') {
        el.x1 = clamp(el.x1 + dx, 0, 100);
        el.y1 = clamp(el.y1 + dy, 0, 100);
        el.x2 = clamp(el.x2 + dx, 0, 100);
        el.y2 = clamp(el.y2 + dy, 0, 100);
      } else {
        el.x = clamp(el.x + dx, 0, 100);
        el.y = clamp(el.y + dy, 0, 100);
        if (prefs.snapToGrid) {
          el.x = quantize(el.x);
          el.y = quantize(el.y);
        }
      }
    });

    renderCanvas();
    renderSlidePanel();
    saveDraft();
    if (before !== JSON.stringify(deck)) pushHistory();
  }

  /* -- Save / Load ---------------------------------------------------- */

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(deck));
    } catch (e) {
      // ignore quota errors
    }
  }

  function loadDraft(optionalKey) {
    const key = optionalKey || draftKey || 'slides-draft';
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function startAutosave() {
    // Currently saving on every change.
  }

  function exportJSON() {
    const clean = deepClone(deck);
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
      reader.onload = event => {
        try {
          const data = JSON.parse(String(event.target.result || ''));
          if (!data.slides || !Array.isArray(data.slides)) {
            throw new Error('Invalid deck format');
          }

          data.slides.forEach(slide => {
            if (!Array.isArray(slide.elements)) slide.elements = [];
            slide.elements.forEach(el => {
              if (!el.id) el.id = genId();
            });
          });

          deck = data;
          currentSlide = 0;
          clearSelection();

          renderSlidePanel();
          renderCanvas();
          renderProps();
          saveDraft();
          resetHistory();

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
    pushHistory();
  }

  function updateDeckMeta(key, value) {
    deck[key] = value;
    saveDraft();
  }

  function previewInViewer() {
    sessionStorage.setItem('slides-preview', JSON.stringify(deck));
    window.open('view.html?preview=1', '_blank');
  }

  /* -- Grid / Snap toggles ------------------------------------------- */

  function setShowGrid(value) {
    prefs.showGrid = !!value;
    savePrefs();
    renderCanvas();
  }

  function setSnapToGuides(value) {
    prefs.snapToGuides = !!value;
    savePrefs();
  }

  function setSnapToGrid(value) {
    prefs.snapToGrid = !!value;
    savePrefs();
  }

  function getPrefs() {
    return { ...prefs };
  }

  /* -- Utils ---------------------------------------------------------- */

  function isCenteredText(el) {
    if (!el || el.type !== 'text') return false;
    const styleDef = theme.textStyles[el.style] || theme.textStyles.body || {};
    return styleDef.textAlign === 'center';
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, Number(v)));
  }

  function round(v) {
    return Math.round(Number(v) * 10) / 10;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  /* -- Public API ----------------------------------------------------- */

  return {
    init,
    addElement,
    addImageFromUrl,
    addImageFromFile,
    deleteElement,
    deleteSelection,
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
    undo,
    redo,
    copySelection,
    pasteSelection,
    duplicateSelection,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    alignSelected,
    distributeSelected,
    applyLayoutPreset,
    setShowGrid,
    setSnapToGuides,
    setSnapToGrid,
    getPrefs,
    get deck() { return deck; },
    get currentSlide() { return currentSlide; },
    get selectedElement() { return activeId; },
    get selectedElements() { return [...selectedIds]; },
  };
})();

if (typeof window !== 'undefined') window.SlideEditor = SlideEditor;
