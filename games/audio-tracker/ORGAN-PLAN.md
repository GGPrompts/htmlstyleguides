# Virtual Organ - Implementation Plan

A browser-based virtual organ with visual keyboard that responds to keyboard input, plays sounds using the existing Synth engine, and visualizes song playback so users can learn by watching.

## Concept

- Gothic cathedral organ aesthetic (matches the gothic-cathedral style guide)
- 2 octaves of keys visible (C3-B4 by default), scrollable via octave +/-
- White keys show the keyboard letter mapped to them (Z, X, C, V... and Q, W, E, R...)
- Black keys show their keyboard shortcuts too (S, D, G, H... and 2, 3, 5, 6...)
- Keys visually depress when played (CSS transform + color change)
- Organ pipes above the keyboard — tall decorative pipes that subtly glow when their note plays
- When a song plays back from the tracker, the organ keys light up in real-time

## File Structure

```
games/audio-tracker/
├── organ.html          # New page - the virtual organ
├── synth.js            # Existing - reuse as-is
├── tracker.js          # Existing - reuse for song playback
├── presets.js          # Existing - reuse for instruments
└── songs/              # Existing - load songs to visualize
```

## Architecture

### Reuse from Tracker
- `Synth` module — all audio (noteOn, noteOff, triggerNoise, init)
- `Tracker` module — song data model, sequencer, importFull
- `Presets` module — default instruments
- Song JSON files + songs/index.json for the song browser

### New Code (all in organ.html, self-contained)
- Organ keyboard renderer (HTML/CSS)
- Key-press handler (keyboard → Synth.noteOn)
- Playback visualizer (Tracker.setOnRowChange → highlight keys)
- Song loader (same fetch pattern as tracker's Songs modal)

## Keyboard Layout

The tracker already maps keys to MIDI offsets:

```
Lower octave (C to B):
  White: Z(C) X(D) C(E) V(F) B(G) N(A) M(B)
  Black: S(C#) D(D#) G(F#) H(G#) J(A#)

Upper octave (C to B):
  White: Q(C) W(D) E(E) R(F) T(G) Y(A) U(B)
  Black: 2(C#) 3(D#) 5(F#) 6(G#) 7(A#)
```

Each key element shows both the note name AND the keyboard shortcut.

## Visual Design

### Gothic Organ Aesthetic
- Dark background (#1a1520 nave-stone)
- Ornate header with UnifrakturMaguntia font
- Decorative organ pipes above the keyboard (CSS gradients, varying heights)
- Gold (#b8954a) and purple (#5c3d6e) accents
- Grain texture overlay (same SVG feTurbulence as style guide)
- Candle sconces on the sides (reuse from style guide)

### Key Styling
- **White keys**: Ivory gradient, ~50px wide, ~200px tall
- **Black keys**: Dark wood gradient, ~30px wide, ~130px tall, overlapping
- **Pressed state**: Key shifts down 3px (translateY), darker shade, subtle inner shadow
- **Active during playback**: Warm amber glow (box-shadow) on the active key
- **Channel colors**: Each of the 4 tracker channels gets a distinct glow color:
  - Ch 1 (Pulse 1): Gold glow
  - Ch 2 (Pulse 2): Rose glow
  - Ch 3 (Triangle): Purple glow
  - Ch 4 (Noise): Dim white flash

### Organ Pipes (decorative + functional)
- Row of CSS pipes above the keyboard, one per white key
- Heights vary (taller in center, shorter at edges — classic organ look)
- When a note plays, the corresponding pipe subtly glows/pulses
- Use CSS gradients: linear-gradient with metallic silver/gold tones
- Pipe tops are rounded (border-radius)

## Implementation Steps

### Step 1: HTML Shell + CSS
- Create organ.html with DOCTYPE, Google Fonts, inline style
- CSS variables (reuse gothic-cathedral palette)
- Body with grain overlay
- Header: "Cathedral Organ" in display font
- Container for pipes + keyboard + controls

### Step 2: Keyboard Renderer
- Generate keys programmatically in JS (2 octaves = 24 keys)
- Each key is a div with:
  - `data-midi` attribute (MIDI note number)
  - `data-key` attribute (keyboard shortcut letter)
  - Class for white/black
  - Inner span showing the keyboard letter
- Position black keys absolutely overlapping white keys
- CSS for default, hover, pressed, and active-playback states

### Step 3: Keyboard Input → Sound
- Listen for keydown/keyup on document
- Map key to MIDI note using same LOWER_KEYS/UPPER_KEYS + currentOctave
- On keydown: call Synth.noteOn(), add .pressed class to visual key
- On keyup: call Synth.noteOff(), remove .pressed class
- Track active voices per key to handle noteOff correctly
- Octave +/- buttons to shift the visible range

### Step 4: Organ Pipes
- Generate one pipe div per white key
- Heights follow a parabolic curve (tallest in center)
- Each pipe has a `data-midi` matching its key
- When a note plays, add .pipe-active class (glow animation)
- CSS transition for smooth glow on/off

### Step 5: Song Playback Visualization
- Include synth.js, tracker.js, presets.js via script tags
- Song browser (same modal as tracker — fetch songs/index.json)
- "Play" loads song via Tracker.importFull(), then Tracker.play('song')
- Use Tracker.setOnRowChange callback to:
  1. Read the current row's note data across all 4 channels
  2. For each note-on, add .active class to matching organ key + pipe
  3. For each note-off or new note, remove .active from previous
  4. Use channel-specific glow colors
- "Stop" button calls Tracker.stop(), clears all .active classes

### Step 6: Controls Bar
- Play Song / Stop buttons
- Song selector dropdown (populated from songs/index.json)
- Octave display + up/down buttons
- Instrument selector (changes the sound when playing manually)
- Tempo display (shows current BPM)
- Link back to tracker: "Open in Tracker →"

### Step 7: Polish
- Responsive: on smaller screens, reduce key width, hide pipes
- Smooth transitions on key press/release (60-80ms)
- Sustain pedal? (hold Shift to sustain notes) — optional/stretch
- Add to games index page

## Key Technical Details

### Voice Tracking for Manual Play
```js
var activeVoices = {};  // keyed by MIDI note number

function onKeyDown(midi, inst) {
    if (activeVoices[midi]) return; // prevent repeat
    Synth.init();
    var voice = Synth.noteOn(0, midi, inst, 0);
    activeVoices[midi] = voice;
    highlightKey(midi, true);
}

function onKeyUp(midi) {
    if (!activeVoices[midi]) return;
    Synth.noteOff(activeVoices[midi], 0);
    delete activeVoices[midi];
    highlightKey(midi, false);
}
```

### Playback Visualization Hook
```js
Tracker.setOnRowChange(function(row, seqRow) {
    clearAllHighlights();
    var song = Tracker.getSong();
    var seq = song.sequence[seqRow];

    for (var ch = 0; ch < 4; ch++) {
        var patId = seq[ch];
        var pat = findPatternById(patId);
        if (!pat) continue;
        var cell = pat.channels[ch][row];
        if (cell && cell.note > 0) {
            highlightKey(cell.note, true, ch); // ch for color
        }
    }
});
```

### MIDI Note → Key Element Lookup
```js
function highlightKey(midi, on, channel) {
    var el = document.querySelector('[data-midi="' + midi + '"]');
    if (!el) return;
    if (on) {
        el.classList.add('active');
        if (channel !== undefined) {
            el.dataset.channel = channel;
        }
    } else {
        el.classList.remove('active');
    }
    // Also highlight corresponding pipe
    var pipe = document.querySelector('.pipe[data-midi="' + midi + '"]');
    if (pipe) pipe.classList.toggle('pipe-active', on);
}
```

## Stretch Goals (Future)
- Recording mode: play the organ and record into a tracker pattern
- Multi-instrument: switch between organ, harpsichord, choir sounds
- Sheet music display above the pipes
- Touch support for mobile/tablet
- MIDI input support (navigator.requestMIDIAccess)
