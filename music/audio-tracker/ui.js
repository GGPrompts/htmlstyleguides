/**
 * UI -- Canvas grid, DOM panels, keyboard input for the chiptune tracker.
 * Global IIFE. Depends on: Synth, Tracker, Presets.
 */
var UI = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var ROW_HEIGHT = 20;
  var HEADER_HEIGHT = 28;
  var ROW_NUM_WIDTH = 36;
  var CHANNEL_NAMES = ['Pulse 1', 'Pulse 2', 'Triangle', 'Noise'];
  var NOTE_NAMES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];

  // Colors (FamiTracker-inspired dark theme)
  var COL_BG        = '#1a1a2e';
  var COL_GRID      = '#16213e';
  var COL_TEXT      = '#e0e0e0';
  var COL_ROW_HI    = '#0f3460';
  var COL_BEAT      = '#1f1f3a';
  var COL_HEADER    = '#e94560';
  var COL_NOTE      = '#00ff88';
  var COL_INST      = '#ffc107';
  var COL_VOL       = '#29b6f6';
  var COL_CURSOR_BORDER = '#e94560';
  var COL_CURSOR_FILL   = 'rgba(233,69,96,0.2)';
  var COL_PLAY_ROW  = '#4a0080';

  // Piano keyboard -> MIDI offset from C of the octave
  var LOWER_KEYS = {
    'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5,
    'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11
  };
  var UPPER_KEYS = {
    'q': 0, '2': 1, 'w': 2, '3': 3, 'e': 4, 'r': 5,
    '5': 6, 't': 7, '6': 8, 'y': 9, '7': 10, 'u': 11
  };
  var HEX_CHARS = '0123456789abcdef';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  var canvas = null;
  var ctx = null;
  var canvasWidth = 0;
  var canvasHeight = 0;
  var channelWidth = 0;

  var cursorRow = 0;
  var cursorChannel = 0;
  var cursorColumn = 0;     // 0=note, 1=instrument, 2=volume
  var currentPattern = 0;   // index into song.patterns
  var currentOctave = 4;
  var currentInstrument = 0;

  var hasFocus = false;
  var playingRow = -1;
  var playingSeqRow = -1;
  var scrollOffset = 0;     // first visible row

  var clipboard = null;     // cloned cell for copy/paste
  var hexBuffer = '';        // accumulates hex digits for inst/vol entry
  var hexTarget = '';        // 'inst' or 'vol'

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function noteToString(midi) {
    if (midi === null || midi === undefined) return '---';
    if (midi === -1) return 'OFF';
    var octave = Math.floor(midi / 12) - 1;
    var name = NOTE_NAMES[midi % 12];
    return name + octave;
  }

  function hexByte(val) {
    if (val === null || val === undefined) return '..';
    var hi = (val >> 4) & 0xf;
    var lo = val & 0xf;
    return HEX_CHARS[hi] + HEX_CHARS[lo];
  }

  function hexNibble(val) {
    if (val === null || val === undefined) return '..';
    if (val < 16) return '0' + HEX_CHARS[val];
    return HEX_CHARS[(val >> 4) & 0xf] + HEX_CHARS[val & 0xf];
  }

  function getCurrentPatternObj() {
    var song = Tracker.getSong();
    if (!song || !song.patterns || !song.patterns[currentPattern]) return null;
    return song.patterns[currentPattern];
  }

  function getPatternLength() {
    var pat = getCurrentPatternObj();
    return pat ? pat.length : 16;
  }

  function getVisibleRows() {
    return Math.floor((canvasHeight - HEADER_HEIGHT) / ROW_HEIGHT);
  }

  function clampCursor() {
    var len = getPatternLength();
    if (cursorRow < 0) cursorRow = 0;
    if (cursorRow >= len) cursorRow = len - 1;
    if (cursorChannel < 0) cursorChannel = 0;
    if (cursorChannel > 3) cursorChannel = 3;
    if (cursorColumn < 0) cursorColumn = 0;
    if (cursorColumn > 2) cursorColumn = 2;
    ensureCursorVisible();
  }

  function ensureCursorVisible() {
    var vis = getVisibleRows();
    if (cursorRow < scrollOffset) {
      scrollOffset = cursorRow;
    } else if (cursorRow >= scrollOffset + vis) {
      scrollOffset = cursorRow - vis + 1;
    }
    if (scrollOffset < 0) scrollOffset = 0;
  }

  // ---------------------------------------------------------------------------
  // Canvas rendering
  // ---------------------------------------------------------------------------

  function renderCanvas() {
    if (!ctx || !canvas) return;
    var song = Tracker.getSong();
    if (!song) return;

    var pat = getCurrentPatternObj();
    if (!pat) return;

    var w = canvasWidth;
    var h = canvasHeight;
    channelWidth = Math.floor((w - ROW_NUM_WIDTH) / 4);

    // Clear
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, w, h);

    // Channel headers
    ctx.font = 'bold 13px "Share Tech Mono", "Courier New", monospace';
    ctx.fillStyle = COL_HEADER;
    for (var ch = 0; ch < 4; ch++) {
      var hx = ROW_NUM_WIDTH + ch * channelWidth + 8;
      ctx.fillText(CHANNEL_NAMES[ch], hx, HEADER_HEIGHT - 8);
    }

    // Header separator
    ctx.strokeStyle = COL_GRID;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(w, HEADER_HEIGHT);
    ctx.stroke();

    // Rows
    var visRows = getVisibleRows();
    var totalRows = pat.length;
    ctx.font = '13px "Share Tech Mono", "Courier New", monospace';

    for (var vi = 0; vi < visRows; vi++) {
      var row = scrollOffset + vi;
      if (row >= totalRows) break;

      var ry = HEADER_HEIGHT + vi * ROW_HEIGHT;

      // Row background
      if (row === playingRow) {
        ctx.fillStyle = COL_PLAY_ROW;
        ctx.fillRect(0, ry, w, ROW_HEIGHT);
      } else if (row % 4 === 0) {
        ctx.fillStyle = COL_BEAT;
        ctx.fillRect(0, ry, w, ROW_HEIGHT);
      }

      // Current row highlight
      if (row === cursorRow && !Tracker.isPlaying()) {
        ctx.fillStyle = COL_ROW_HI;
        ctx.fillRect(0, ry, w, ROW_HEIGHT);
      }

      // Grid lines
      ctx.strokeStyle = COL_GRID;
      ctx.beginPath();
      ctx.moveTo(0, ry + ROW_HEIGHT);
      ctx.lineTo(w, ry + ROW_HEIGHT);
      ctx.stroke();

      // Row number
      var rowStr = row < 10 ? '0' + row : '' + row;
      ctx.fillStyle = (row % 4 === 0) ? COL_HEADER : COL_TEXT;
      ctx.fillText(rowStr, 4, ry + 15);

      // Cells for each channel
      for (var c = 0; c < 4; c++) {
        var cx = ROW_NUM_WIDTH + c * channelWidth;
        var cell = pat.channels[c][row];

        // Vertical channel separator
        ctx.strokeStyle = COL_GRID;
        ctx.beginPath();
        ctx.moveTo(cx, ry);
        ctx.lineTo(cx, ry + ROW_HEIGHT);
        ctx.stroke();

        if (!cell) continue;

        // Note
        var noteStr = noteToString(cell.note);
        var instStr = hexNibble(cell.inst);
        var volStr = (cell.vol !== null && cell.vol !== undefined) ? hexNibble(cell.vol) : '..';

        // Positions within the channel cell
        var textX = cx + 4;
        var noteW = ctx.measureText('C-4').width + 4;
        var instX = textX + noteW + 2;
        var instW = ctx.measureText('00').width + 4;
        var volX = instX + instW + 2;

        // Draw note
        ctx.fillStyle = (cell.note !== null) ? COL_NOTE : '#555';
        ctx.fillText(noteStr, textX, ry + 15);

        // Draw instrument
        ctx.fillStyle = (cell.inst !== null && cell.inst !== undefined) ? COL_INST : '#555';
        ctx.fillText(instStr, instX, ry + 15);

        // Draw volume
        ctx.fillStyle = (cell.vol !== null && cell.vol !== undefined) ? COL_VOL : '#555';
        ctx.fillText(volStr, volX, ry + 15);

        // Cursor highlight
        if (row === cursorRow && c === cursorChannel) {
          var curX, curW;
          if (cursorColumn === 0) {
            curX = textX - 2;
            curW = noteW + 2;
          } else if (cursorColumn === 1) {
            curX = instX - 2;
            curW = instW + 2;
          } else {
            curX = volX - 2;
            curW = instW + 2;
          }
          ctx.fillStyle = COL_CURSOR_FILL;
          ctx.fillRect(curX, ry, curW, ROW_HEIGHT);
          ctx.strokeStyle = COL_CURSOR_BORDER;
          ctx.lineWidth = 2;
          ctx.strokeRect(curX, ry, curW, ROW_HEIGHT);
          ctx.lineWidth = 1;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DOM Panel: Pattern List
  // ---------------------------------------------------------------------------

  function renderPatternList() {
    var el = document.getElementById('pattern-list');
    if (!el) return;
    var song = Tracker.getSong();
    if (!song) return;

    var html = '<h3>Patterns</h3>';
    for (var i = 0; i < song.patterns.length; i++) {
      var pat = song.patterns[i];
      var cls = (i === currentPattern) ? 'pat-item active' : 'pat-item';
      html += '<div class="' + cls + '" data-idx="' + i + '">'
            + '<span class="pat-id">' + hexNibble(pat.id) + '</span> '
            + '<span class="pat-name">' + pat.name + '</span>'
            + '</div>';
    }
    html += '<button id="btn-new-pattern" class="panel-btn">+ New Pattern</button>';
    el.innerHTML = html;

    // Bind clicks
    var items = el.querySelectorAll('.pat-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', (function (idx) {
        return function () {
          currentPattern = idx;
          cursorRow = 0;
          scrollOffset = 0;
          render();
        };
      })(parseInt(items[j].getAttribute('data-idx'), 10)));
    }

    var btnNew = document.getElementById('btn-new-pattern');
    if (btnNew) {
      btnNew.addEventListener('click', function () {
        Tracker.addPattern();
        var song = Tracker.getSong();
        currentPattern = song.patterns.length - 1;
        cursorRow = 0;
        scrollOffset = 0;
        render();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // DOM Panel: Arrangement
  // ---------------------------------------------------------------------------

  function renderArrangement() {
    var el = document.getElementById('arrangement');
    if (!el) return;
    var song = Tracker.getSong();
    if (!song) return;

    var html = '<h3>Arrangement</h3>'
             + '<table class="arr-table"><thead><tr>'
             + '<th>#</th><th>Pulse 1</th><th>Pulse 2</th><th>Triangle</th><th>Noise</th><th></th>'
             + '</tr></thead><tbody>';

    for (var i = 0; i < song.sequence.length; i++) {
      var cls = (i === playingSeqRow && Tracker.isPlaying()) ? 'arr-row playing' : 'arr-row';
      html += '<tr class="' + cls + '" data-seq="' + i + '">';
      html += '<td class="arr-idx">' + hexNibble(i) + '</td>';
      for (var ch = 0; ch < 4; ch++) {
        var val = song.sequence[i][ch];
        html += '<td class="arr-cell" data-seq="' + i + '" data-ch="' + ch + '">'
              + hexNibble(val)
              + '</td>';
      }
      html += '<td><button class="arr-del" data-seq="' + i + '">x</button></td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    html += '<button id="btn-add-seq-row" class="panel-btn">+ Add Row</button>';
    el.innerHTML = html;

    // Bind cell clicks: cycle pattern
    var cells = el.querySelectorAll('.arr-cell');
    for (var k = 0; k < cells.length; k++) {
      cells[k].addEventListener('click', (function (cell) {
        return function () {
          var seqIdx = parseInt(cell.getAttribute('data-seq'), 10);
          var chIdx = parseInt(cell.getAttribute('data-ch'), 10);
          var song = Tracker.getSong();
          var cur = song.sequence[seqIdx][chIdx];
          var next = (cur + 1) % song.patterns.length;
          Tracker.setSequenceEntry(seqIdx, chIdx, song.patterns[next].id);
          renderArrangement();
        };
      })(cells[k]));
    }

    // Delete row buttons
    var delBtns = el.querySelectorAll('.arr-del');
    for (var d = 0; d < delBtns.length; d++) {
      delBtns[d].addEventListener('click', (function (btn) {
        return function (ev) {
          ev.stopPropagation();
          var seqIdx = parseInt(btn.getAttribute('data-seq'), 10);
          Tracker.deleteSequenceRow(seqIdx);
          renderArrangement();
        };
      })(delBtns[d]));
    }

    var btnAddRow = document.getElementById('btn-add-seq-row');
    if (btnAddRow) {
      btnAddRow.addEventListener('click', function () {
        Tracker.addSequenceRow();
        renderArrangement();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // DOM Panel: Instrument Editor
  // ---------------------------------------------------------------------------

  function renderInstrumentEditor() {
    var el = document.getElementById('instrument-editor');
    if (!el) return;
    var song = Tracker.getSong();
    if (!song) return;

    var inst = song.instruments[currentInstrument];
    if (!inst) {
      currentInstrument = 0;
      inst = song.instruments[0];
      if (!inst) return;
    }

    // Instrument selector dropdown
    var html = '<h3>Instrument</h3>';
    html += '<div class="inst-row">';
    html += '<select id="inst-select">';
    for (var i = 0; i < song.instruments.length; i++) {
      var sel = (i === currentInstrument) ? ' selected' : '';
      html += '<option value="' + i + '"' + sel + '>'
            + hexNibble(i) + ' - ' + (song.instruments[i].name || 'Untitled')
            + '</option>';
    }
    html += '</select>';
    html += ' <button id="btn-new-inst" class="panel-btn">+ New</button>';
    html += ' <button id="btn-del-inst" class="panel-btn">Delete</button>';
    html += '</div>';

    // Name and wave type
    html += '<div class="inst-row">';
    html += '<label>Name: <input type="text" id="inst-name" value="'
          + (inst.name || '').replace(/"/g, '&quot;') + '"></label> ';
    html += '<label>Wave: <select id="inst-wave">';
    var waves = ['square', 'triangle', 'sawtooth', 'sine', 'noise', 'pulse25', 'pulse12'];
    for (var w = 0; w < waves.length; w++) {
      var wsel = (inst.wave === waves[w]) ? ' selected' : '';
      html += '<option value="' + waves[w] + '"' + wsel + '>' + waves[w] + '</option>';
    }
    html += '</select></label>';
    html += '</div>';

    // ADSR sliders
    html += '<div class="inst-row">';
    html += '<label>Attack: <input type="range" id="inst-attack" min="0" max="1" step="0.01" value="' + (inst.attack || 0) + '"> <span id="inst-attack-val">' + (inst.attack || 0).toFixed(2) + '</span></label> ';
    html += '<label>Decay: <input type="range" id="inst-decay" min="0" max="1" step="0.01" value="' + (inst.decay || 0) + '"> <span id="inst-decay-val">' + (inst.decay || 0).toFixed(2) + '</span></label>';
    html += '</div>';
    html += '<div class="inst-row">';
    html += '<label>Sustain: <input type="range" id="inst-sustain" min="0" max="1" step="0.01" value="' + (inst.sustain !== undefined ? inst.sustain : 0.6) + '"> <span id="inst-sustain-val">' + (inst.sustain !== undefined ? inst.sustain : 0.6).toFixed(2) + '</span></label> ';
    html += '<label>Release: <input type="range" id="inst-release" min="0" max="1" step="0.01" value="' + (inst.release || 0) + '"> <span id="inst-release-val">' + (inst.release || 0).toFixed(2) + '</span></label>';
    html += '</div>';

    // Detune
    html += '<div class="inst-row">';
    html += '<label><input type="checkbox" id="inst-detuneosc"' + (inst.detuneOsc ? ' checked' : '') + '> Detune 2nd Osc</label> ';
    html += '<label>Amount: <input type="number" id="inst-detuneamt" min="-100" max="100" value="' + (inst.detuneAmount || 0) + '"></label>';
    html += '</div>';

    // Filter
    html += '<div class="inst-row">';
    html += '<label>Filter: <select id="inst-filtertype">';
    var ftypes = ['none', 'lowpass', 'highpass', 'bandpass'];
    for (var f = 0; f < ftypes.length; f++) {
      var fsel = (inst.filterType === ftypes[f]) ? ' selected' : '';
      html += '<option value="' + ftypes[f] + '"' + fsel + '>' + ftypes[f] + '</option>';
    }
    html += '</select></label> ';
    html += '<label>Freq: <input type="number" id="inst-filterfreq" min="20" max="20000" value="' + (inst.filterFreq || 2000) + '"></label> ';
    html += '<label>Q: <input type="number" id="inst-filterq" min="0.1" max="30" step="0.1" value="' + (inst.filterQ || 1) + '"></label>';
    html += '</div>';

    // Volume
    html += '<div class="inst-row">';
    html += '<label>Volume: <input type="range" id="inst-volume" min="0" max="1" step="0.01" value="' + (inst.volume !== undefined ? inst.volume : 0.8) + '"> <span id="inst-volume-val">' + (inst.volume !== undefined ? inst.volume : 0.8).toFixed(2) + '</span></label>';
    html += '</div>';

    el.innerHTML = html;

    // Bind instrument selector
    var instSelect = document.getElementById('inst-select');
    if (instSelect) {
      instSelect.addEventListener('change', function () {
        currentInstrument = parseInt(this.value, 10);
        renderInstrumentEditor();
      });
      instSelect.addEventListener('focus', function () { hasFocus = false; });
    }

    // New / Delete instrument buttons
    var btnNewInst = document.getElementById('btn-new-inst');
    if (btnNewInst) {
      btnNewInst.addEventListener('click', function () {
        var idx = Tracker.addInstrument({
          name: 'New Instrument',
          wave: 'square',
          attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.1,
          detuneOsc: false, detuneAmount: 0,
          filterType: 'none', filterFreq: 2000, filterQ: 1,
          volume: 0.8
        });
        currentInstrument = idx;
        renderInstrumentEditor();
      });
    }

    var btnDelInst = document.getElementById('btn-del-inst');
    if (btnDelInst) {
      btnDelInst.addEventListener('click', function () {
        if (Tracker.deleteInstrument(currentInstrument)) {
          if (currentInstrument >= Tracker.getSong().instruments.length) {
            currentInstrument = Tracker.getSong().instruments.length - 1;
          }
          renderInstrumentEditor();
        }
      });
    }

    // Bind all instrument parameter changes
    bindInstInput('inst-name', 'name', 'string');
    bindInstSelect('inst-wave', 'wave');
    bindInstSlider('inst-attack', 'attack');
    bindInstSlider('inst-decay', 'decay');
    bindInstSlider('inst-sustain', 'sustain');
    bindInstSlider('inst-release', 'release');
    bindInstSlider('inst-volume', 'volume');
    bindInstCheck('inst-detuneosc', 'detuneOsc');
    bindInstNumber('inst-detuneamt', 'detuneAmount');
    bindInstSelect('inst-filtertype', 'filterType');
    bindInstNumber('inst-filterfreq', 'filterFreq');
    bindInstNumber('inst-filterq', 'filterQ');
  }

  function bindInstInput(id, prop, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var song = Tracker.getSong();
      if (!song || !song.instruments[currentInstrument]) return;
      song.instruments[currentInstrument][prop] = this.value;
    });
    el.addEventListener('focus', function () { hasFocus = false; });
    el.addEventListener('blur', function () { hasFocus = true; });
  }

  function bindInstSelect(id, prop) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      var song = Tracker.getSong();
      if (!song || !song.instruments[currentInstrument]) return;
      song.instruments[currentInstrument][prop] = this.value;
    });
    el.addEventListener('focus', function () { hasFocus = false; });
    el.addEventListener('blur', function () { hasFocus = true; });
  }

  function bindInstSlider(id, prop) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var val = parseFloat(this.value);
      var song = Tracker.getSong();
      if (!song || !song.instruments[currentInstrument]) return;
      song.instruments[currentInstrument][prop] = val;
      var span = document.getElementById(id + '-val');
      if (span) span.textContent = val.toFixed(2);
    });
    el.addEventListener('focus', function () { hasFocus = false; });
    el.addEventListener('blur', function () { hasFocus = true; });
  }

  function bindInstCheck(id, prop) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      var song = Tracker.getSong();
      if (!song || !song.instruments[currentInstrument]) return;
      song.instruments[currentInstrument][prop] = this.checked;
    });
  }

  function bindInstNumber(id, prop) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var val = parseFloat(this.value);
      if (isNaN(val)) return;
      var song = Tracker.getSong();
      if (!song || !song.instruments[currentInstrument]) return;
      song.instruments[currentInstrument][prop] = val;
    });
    el.addEventListener('focus', function () { hasFocus = false; });
    el.addEventListener('blur', function () { hasFocus = true; });
  }

  // ---------------------------------------------------------------------------
  // DOM Panel: Toolbar
  // ---------------------------------------------------------------------------

  var toolbarBound = false;

  function renderToolbar() {
    var song = Tracker.getSong();
    if (!song) return;

    // Update values in existing HTML elements
    var titleEl = document.getElementById('song-title');
    if (titleEl && document.activeElement !== titleEl) {
      titleEl.value = song.title || 'Untitled';
    }
    var bpmEl = document.getElementById('bpm');
    if (bpmEl && document.activeElement !== bpmEl) {
      bpmEl.value = song.bpm || 140;
    }
    var octEl = document.getElementById('octave-display');
    if (octEl) octEl.textContent = currentOctave;

    // Only bind events once
    if (toolbarBound) return;
    toolbarBound = true;

    if (titleEl) {
      titleEl.addEventListener('input', function () {
        Tracker.getSong().title = this.value;
      });
      titleEl.addEventListener('focus', function () { hasFocus = false; });
      titleEl.addEventListener('blur', function () { hasFocus = true; });
    }

    if (bpmEl) {
      bpmEl.addEventListener('input', function () {
        var v = parseInt(this.value, 10);
        if (v >= 40 && v <= 300) Tracker.getSong().bpm = v;
      });
      bpmEl.addEventListener('focus', function () { hasFocus = false; });
      bpmEl.addEventListener('blur', function () { hasFocus = true; });
    }

    var btnPlayPat = document.getElementById('btn-play-pattern');
    if (btnPlayPat) btnPlayPat.addEventListener('click', function () {
      Synth.init();
      Tracker.play('pattern');
      render();
    });

    var btnPlaySong = document.getElementById('btn-play-song');
    if (btnPlaySong) btnPlaySong.addEventListener('click', function () {
      Synth.init();
      Tracker.play('song');
      render();
    });

    var btnStop = document.getElementById('btn-stop');
    if (btnStop) btnStop.addEventListener('click', function () {
      Tracker.stop();
      playingRow = -1;
      playingSeqRow = -1;
      render();
    });

    var btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', function () {
      if (Tracker.saveToStorage()) {
        flashMessage('Saved!');
      }
    });

    var btnLoad = document.getElementById('btn-load');
    if (btnLoad) btnLoad.addEventListener('click', function () {
      if (Tracker.loadFromStorage()) {
        currentPattern = 0;
        currentInstrument = 0;
        cursorRow = 0;
        scrollOffset = 0;
        render();
        flashMessage('Loaded!');
      } else {
        flashMessage('No saved song found.');
      }
    });

    var btnExport = document.getElementById('btn-export');
    if (btnExport) btnExport.addEventListener('click', function () {
      var json = Tracker.exportFull();
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (Tracker.getSong().title || 'song').replace(/\s+/g, '-').toLowerCase() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    var btnNew = document.getElementById('btn-new');
    if (btnNew) btnNew.addEventListener('click', function () {
      if (confirm('Create a new song? Unsaved changes will be lost.')) {
        Tracker.newSong();
        currentPattern = 0;
        currentInstrument = 0;
        cursorRow = 0;
        scrollOffset = 0;
        render();
      }
    });

    var btnDemo = document.getElementById('btn-demo');
    if (btnDemo) btnDemo.addEventListener('click', function () {
      if (typeof Presets !== 'undefined' && Presets.demoSong) {
        loadDemoSong();
        render();
        flashMessage('Demo loaded!');
      } else {
        flashMessage('No demo available.');
      }
    });
  }

  function flashMessage(msg) {
    var el = document.getElementById('toolbar');
    if (!el) return;
    var span = document.createElement('span');
    span.className = 'tb-flash';
    span.textContent = ' ' + msg;
    el.appendChild(span);
    setTimeout(function () {
      if (span.parentNode) span.parentNode.removeChild(span);
    }, 2000);
  }

  // ---------------------------------------------------------------------------
  // Demo song loader (Presets.demoSong -> Tracker format)
  // ---------------------------------------------------------------------------

  function loadDemoSong() {
    var demo = Presets.demoSong;
    if (!demo) return;

    var songData = {
      title: demo.title || 'Demo',
      bpm: demo.bpm || 140,
      rowsPerBeat: demo.rowsPerBeat || 4,
      channels: [
        { name: 'Pulse 1' },
        { name: 'Pulse 2' },
        { name: 'Triangle' },
        { name: 'Noise' }
      ],
      instruments: [],
      patterns: [],
      sequence: []
    };

    // Copy instruments
    for (var i = 0; i < demo.instruments.length; i++) {
      var src = demo.instruments[i];
      songData.instruments.push({
        name: src.name || 'Inst ' + i,
        wave: src.wave || 'square',
        detune: src.detune || 0,
        detuneOsc: src.detuneOsc || false,
        detuneAmount: src.detuneAmount || 0,
        attack: src.attack || 0.01,
        decay: src.decay || 0.1,
        sustain: src.sustain !== undefined ? src.sustain : 0.6,
        release: src.release || 0.1,
        filterType: src.filterType || 'none',
        filterFreq: src.filterFreq || 2000,
        filterQ: src.filterQ || 1,
        volume: src.volume !== undefined ? src.volume : 0.8
      });
    }

    // Convert patterns from the demo format (array of rows, each row is array of 4 cells)
    // to the Tracker format (pattern object with channels array)
    for (var p = 0; p < demo.patterns.length; p++) {
      var srcPat = demo.patterns[p];
      var numRows = srcPat.length;
      var channels = [[], [], [], []];

      for (var r = 0; r < numRows; r++) {
        var srcRow = srcPat[r];
        for (var ch = 0; ch < 4; ch++) {
          var srcCell = srcRow ? srcRow[ch] : null;
          if (srcCell && srcCell.note !== undefined && srcCell.note !== null) {
            channels[ch].push({
              note: srcCell.note,
              inst: srcCell.inst !== undefined ? srcCell.inst : 0,
              vol: srcCell.vol !== undefined ? srcCell.vol : null,
              fx: srcCell.fx || null
            });
          } else {
            channels[ch].push({ note: null, inst: 0, vol: null, fx: null });
          }
        }
      }

      var padded = p < 10 ? '0' + p : '' + p;
      songData.patterns.push({
        id: p,
        name: 'Pattern ' + padded,
        length: numRows,
        channels: channels
      });
    }

    // Build sequence: demo.sequence is an array of pattern indices.
    // The Tracker expects each sequence row to be [patId, patId, patId, patId].
    // In the demo, each sequence entry means all 4 channels use the same pattern.
    for (var s = 0; s < demo.sequence.length; s++) {
      var pid = demo.sequence[s];
      songData.sequence.push([pid, pid, pid, pid]);
    }

    Tracker.setSong(songData);
    currentPattern = 0;
    currentInstrument = 0;
    cursorRow = 0;
    scrollOffset = 0;
  }

  // ---------------------------------------------------------------------------
  // Keyboard handling
  // ---------------------------------------------------------------------------

  function handleKeyDown(ev) {
    // Do not capture when focused on inputs
    if (!hasFocus) return;

    var key = ev.key;
    var code = ev.code;
    var ctrl = ev.ctrlKey || ev.metaKey;
    var shift = ev.shiftKey;

    // Prevent defaults for keys we handle
    var handled = false;

    // ---- Transport ----
    if (key === ' ') {
      ev.preventDefault();
      Synth.init();
      if (Tracker.isPlaying()) {
        Tracker.stop();
        playingRow = -1;
        playingSeqRow = -1;
      } else {
        Tracker.play('pattern');
      }
      render();
      return;
    }

    if (key === 'F5') {
      ev.preventDefault();
      Synth.init();
      Tracker.play('song');
      render();
      return;
    }

    if (key === 'F6') {
      ev.preventDefault();
      Synth.init();
      Tracker.play('pattern');
      render();
      return;
    }

    if (key === 'F8') {
      ev.preventDefault();
      Tracker.stop();
      playingRow = -1;
      playingSeqRow = -1;
      render();
      return;
    }

    // ---- Undo / Redo ----
    if (ctrl && key === 'z') {
      ev.preventDefault();
      Tracker.undo();
      render();
      return;
    }
    if (ctrl && key === 'y') {
      ev.preventDefault();
      Tracker.redo();
      render();
      return;
    }

    // ---- Copy / Paste ----
    if (ctrl && key === 'c') {
      ev.preventDefault();
      var pat = getCurrentPatternObj();
      if (pat) {
        var cell = pat.channels[cursorChannel][cursorRow];
        clipboard = cell ? {
          note: cell.note, inst: cell.inst, vol: cell.vol, fx: cell.fx
        } : null;
      }
      return;
    }
    if (ctrl && key === 'v') {
      ev.preventDefault();
      if (clipboard) {
        var patObj = getCurrentPatternObj();
        if (patObj) {
          Tracker.setCell(patObj.id, cursorChannel, cursorRow, {
            note: clipboard.note,
            inst: clipboard.inst,
            vol: clipboard.vol,
            fx: clipboard.fx
          });
          render();
        }
      }
      return;
    }

    // ---- Octave +/- ----
    if (key === '+' || key === '=') {
      if (!ctrl) {
        ev.preventDefault();
        if (currentOctave < 8) currentOctave++;
        updateOctaveDisplay();
        return;
      }
    }
    if (key === '-' && !ctrl) {
      ev.preventDefault();
      if (currentOctave > 1) currentOctave--;
      updateOctaveDisplay();
      return;
    }

    // ---- Navigation ----
    if (key === 'ArrowUp') {
      ev.preventDefault();
      cursorRow--;
      hexBuffer = '';
      clampCursor();
      renderCanvas();
      return;
    }
    if (key === 'ArrowDown') {
      ev.preventDefault();
      cursorRow++;
      hexBuffer = '';
      clampCursor();
      renderCanvas();
      return;
    }
    if (key === 'ArrowLeft') {
      ev.preventDefault();
      cursorColumn--;
      hexBuffer = '';
      if (cursorColumn < 0) {
        cursorColumn = 2;
        cursorChannel--;
        if (cursorChannel < 0) {
          cursorChannel = 0;
          cursorColumn = 0;
        }
      }
      renderCanvas();
      return;
    }
    if (key === 'ArrowRight') {
      ev.preventDefault();
      cursorColumn++;
      hexBuffer = '';
      if (cursorColumn > 2) {
        cursorColumn = 0;
        cursorChannel++;
        if (cursorChannel > 3) {
          cursorChannel = 3;
          cursorColumn = 2;
        }
      }
      renderCanvas();
      return;
    }
    if (key === 'Tab') {
      ev.preventDefault();
      hexBuffer = '';
      if (shift) {
        cursorChannel--;
        if (cursorChannel < 0) cursorChannel = 3;
      } else {
        cursorChannel++;
        if (cursorChannel > 3) cursorChannel = 0;
      }
      cursorColumn = 0;
      renderCanvas();
      return;
    }
    if (key === 'PageUp') {
      ev.preventDefault();
      cursorRow -= 16;
      hexBuffer = '';
      clampCursor();
      renderCanvas();
      return;
    }
    if (key === 'PageDown') {
      ev.preventDefault();
      cursorRow += 16;
      hexBuffer = '';
      clampCursor();
      renderCanvas();
      return;
    }
    if (key === 'Home') {
      ev.preventDefault();
      cursorRow = 0;
      scrollOffset = 0;
      hexBuffer = '';
      renderCanvas();
      return;
    }
    if (key === 'End') {
      ev.preventDefault();
      cursorRow = getPatternLength() - 1;
      hexBuffer = '';
      clampCursor();
      renderCanvas();
      return;
    }

    // ---- Editing: Delete ----
    if (key === 'Delete') {
      ev.preventDefault();
      var patDel = getCurrentPatternObj();
      if (patDel) {
        Tracker.clearCell(patDel.id, cursorChannel, cursorRow);
        render();
      }
      return;
    }

    // ---- Editing: Note-off (backtick) ----
    if (key === '`') {
      ev.preventDefault();
      var patOff = getCurrentPatternObj();
      if (patOff) {
        var offCell = patOff.channels[cursorChannel][cursorRow];
        Tracker.setCell(patOff.id, cursorChannel, cursorRow, {
          note: -1,
          inst: offCell ? offCell.inst : currentInstrument,
          vol: offCell ? offCell.vol : null,
          fx: null
        });
        cursorRow++;
        clampCursor();
        render();
      }
      return;
    }

    // ---- Note entry (when on note column) ----
    if (cursorColumn === 0 && !ctrl) {
      var lower = key.toLowerCase();
      var midiOffset = null;
      var octaveAdd = 0;

      if (LOWER_KEYS.hasOwnProperty(lower)) {
        midiOffset = LOWER_KEYS[lower];
        octaveAdd = 0;
        handled = true;
      } else if (UPPER_KEYS.hasOwnProperty(lower)) {
        midiOffset = UPPER_KEYS[lower];
        octaveAdd = 1;
        handled = true;
      }

      if (handled && midiOffset !== null) {
        ev.preventDefault();
        var midi = (currentOctave + octaveAdd + 1) * 12 + midiOffset;
        var patNote = getCurrentPatternObj();
        if (patNote) {
          var existingCell = patNote.channels[cursorChannel][cursorRow];
          Tracker.setCell(patNote.id, cursorChannel, cursorRow, {
            note: midi,
            inst: currentInstrument,
            vol: existingCell ? existingCell.vol : null,
            fx: null
          });

          // Preview note
          previewNote(midi);

          cursorRow++;
          clampCursor();
          render();
        }
        return;
      }
    }

    // ---- Hex entry (instrument or volume column) ----
    if ((cursorColumn === 1 || cursorColumn === 2) && !ctrl) {
      var lk = key.toLowerCase();
      var hexIdx = HEX_CHARS.indexOf(lk);
      if (hexIdx !== -1) {
        ev.preventDefault();
        hexBuffer += lk;

        if (hexBuffer.length >= 2) {
          var hexVal = parseInt(hexBuffer, 16);
          var patHex = getCurrentPatternObj();
          if (patHex) {
            var hexCell = patHex.channels[cursorChannel][cursorRow];
            var newCell = {
              note: hexCell ? hexCell.note : null,
              inst: hexCell ? hexCell.inst : 0,
              vol: hexCell ? hexCell.vol : null,
              fx: hexCell ? hexCell.fx : null
            };

            if (cursorColumn === 1) {
              // Instrument: clamp to available range
              var song = Tracker.getSong();
              if (hexVal >= song.instruments.length) hexVal = song.instruments.length - 1;
              newCell.inst = hexVal;
            } else {
              // Volume: 0-0F (15)
              if (hexVal > 15) hexVal = 15;
              newCell.vol = hexVal;
            }

            Tracker.setCell(patHex.id, cursorChannel, cursorRow, newCell);
            hexBuffer = '';
            cursorRow++;
            clampCursor();
            render();
          }
        }
        return;
      }
    }
  }

  function previewNote(midi) {
    Synth.init();
    var song = Tracker.getSong();
    var inst = song.instruments[currentInstrument];
    if (!inst) return;

    var handle = Synth.noteOn(cursorChannel, midi, inst);
    if (handle) {
      setTimeout(function () {
        Synth.noteOff(handle);
      }, 200);
    }
  }

  function updateOctaveDisplay() {
    var el = document.getElementById('octave-display');
    if (el) el.textContent = currentOctave;
  }

  // ---------------------------------------------------------------------------
  // Canvas mouse interaction
  // ---------------------------------------------------------------------------

  function handleCanvasClick(ev) {
    hasFocus = true;
    canvas.focus();

    var rect = canvas.getBoundingClientRect();
    var mx = ev.clientX - rect.left;
    var my = ev.clientY - rect.top;

    // Determine clicked row
    if (my < HEADER_HEIGHT) return;
    var rowIdx = Math.floor((my - HEADER_HEIGHT) / ROW_HEIGHT) + scrollOffset;
    if (rowIdx >= getPatternLength()) return;

    // Determine clicked channel and sub-column
    if (mx < ROW_NUM_WIDTH) return;
    var chIdx = Math.floor((mx - ROW_NUM_WIDTH) / channelWidth);
    if (chIdx > 3) chIdx = 3;

    // Determine sub-column within the channel
    var withinCh = mx - ROW_NUM_WIDTH - chIdx * channelWidth;
    var noteEnd = 4 + ctx.measureText('C-4').width + 6;
    var instEnd = noteEnd + ctx.measureText('00').width + 6;

    var col = 0;
    if (withinCh >= instEnd) {
      col = 2;
    } else if (withinCh >= noteEnd) {
      col = 1;
    }

    cursorRow = rowIdx;
    cursorChannel = chIdx;
    cursorColumn = col;
    hexBuffer = '';
    renderCanvas();
  }

  // ---------------------------------------------------------------------------
  // Playback row tracking
  // ---------------------------------------------------------------------------

  var pendingAnimFrame = null;

  function onRowChange(row, seqRow) {
    playingRow = row;
    playingSeqRow = seqRow;

    // Scroll to keep playing row visible
    var vis = getVisibleRows();
    if (playingRow < scrollOffset || playingRow >= scrollOffset + vis) {
      scrollOffset = Math.max(0, playingRow - Math.floor(vis / 2));
    }

    // Defer rendering to the next animation frame so that DOM work
    // never blocks the audio scheduler's tight scheduling loop.
    if (!pendingAnimFrame) {
      pendingAnimFrame = requestAnimationFrame(function () {
        pendingAnimFrame = null;
        renderCanvas();
        renderArrangement();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Resize handling
  // ---------------------------------------------------------------------------

  function handleResize() {
    if (!canvas) return;
    var container = canvas.parentElement;
    if (!container) return;

    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    renderCanvas();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function init() {
    // Initialize Synth eagerly (will wait for user gesture to resume)
    Synth.init();

    // Initialize Tracker with a new song if none loaded
    if (!Tracker.getSong()) {
      Tracker.newSong();
    }

    // Set up canvas
    canvas = document.getElementById('grid-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      hasFocus = true;
      canvas.setAttribute('tabindex', '0');

      // Size canvas to parent
      handleResize();

      canvas.addEventListener('click', handleCanvasClick);
      canvas.addEventListener('focus', function () { hasFocus = true; });
      canvas.addEventListener('blur', function () { hasFocus = false; });
    }

    // Register playback callback
    Tracker.setOnRowChange(onRowChange);
    Tracker.setOnPlaybackEnd(function () {
      // Optional: could stop or loop -- we let the Tracker handle looping
    });

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);

    // Window resize
    window.addEventListener('resize', handleResize);

    // Initial render
    render();
  }

  function render() {
    renderToolbar();
    renderPatternList();
    renderCanvas();
    renderArrangement();
    renderInstrumentEditor();
  }

  function resetAndRender() {
    currentPattern = 0;
    currentInstrument = 0;
    cursorRow = 0;
    scrollOffset = 0;
    render();
  }

  return {
    init: init,
    render: render,
    resetAndRender: resetAndRender
  };
})();
