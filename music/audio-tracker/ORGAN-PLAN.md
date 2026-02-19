# Virtual Organ - Implementation Plan

A browser-based virtual organ with visual keyboard that responds to keyboard input, plays sounds using the existing Synth engine, and visualizes song playback so users can learn by watching.

## Status

**v2 complete.** All 7 core steps + scrolling sheet music stretch goal. Files: `organ.html` + `sheet-music.js`.

Listed in the games index under a new "The Studio" section (alongside Audio Tracker).

## What Was Built

- Gothic cathedral aesthetic matching the style guide (palette, fonts, grain overlay, rose window)
- 4 flickering candle sconces with wrought-iron brackets (desktop only)
- 3-octave keyboard (C3-B5) with ivory white keys and dark wood black keys
- Keyboard shortcuts on lower 2 octaves (Z-M, Q-U), 3rd octave is mouse/touch only
- 14 decorative organ pipes with parabolic height curve, metallic gradients
- Pipes and keys glow with channel-specific colors during song playback (gold/rose/purple/white)
- Per-channel sustained note tracking (notes stay highlighted until note-off or new note)
- Song dropdown loaded from songs/index.json, Play/Stop transport
- Voice/instrument selector (9 presets, affects manual play only)
- Octave shift buttons (range 1-6)
- Mouse click + touch support for playing keys
- Responsive at 840px and 620px breakpoints (keys and pipes scale dynamically via JS)
- Back link to games index, "Open in Tracker" link

## File Structure

```
music/audio-tracker/
├── organ.html          # The virtual organ (complete)
├── sheet-music.js      # Scrolling grand-staff canvas renderer
├── synth.js            # Reused as-is
├── tracker.js          # Reused for song playback + setOnRowChange
├── presets.js          # Reused for instruments
└── songs/              # Loaded via songs/index.json
```

## Keyboard Layout

```
Lower octave (C to B):
  White: Z(C) X(D) C(E) V(F) B(G) N(A) M(B)
  Black: S(C#) D(D#) G(F#) H(G#) J(A#)

Upper octave (C to B):
  White: Q(C) W(D) E(E) R(F) T(G) Y(A) U(B)
  Black: 2(C#) 3(D#) 5(F#) 6(G#) 7(A#)

3rd octave: no keyboard shortcuts (mouse/touch only)
```

## Channel Glow Colors

| Channel | Instrument | Color |
|---------|-----------|-------|
| 0 | Pulse 1 | Gold (#b8954a) |
| 1 | Pulse 2 | Rose (#c06080) |
| 2 | Triangle | Purple (#9b7ab8) |
| 3 | Noise | White |

## Implementation Steps (all complete)

- [x] **Step 1**: HTML shell + gothic CSS (palette, fonts, grain, candles, rose window)
- [x] **Step 2**: Keyboard renderer (3 octaves, white/black keys, shortcut + note labels)
- [x] **Step 3**: Keyboard input → Synth.noteOn/noteOff with voice tracking
- [x] **Step 4**: Organ pipes with parabolic heights, channel-colored glow
- [x] **Step 5**: Song playback visualization via Tracker.setOnRowChange
- [x] **Step 6**: Controls bar (play/stop, song select, octave, instrument, BPM, tracker link)
- [x] **Step 7**: Responsive sizing, touch support, games index card + Studio section

## Stretch Goals

- [x] **Scrolling sheet music**: Render tracker note data as standard notation on a grand staff below the keyboard, scrolling right-to-left during playback — learn-to-play mode like Synthesia. Implemented in `sheet-music.js` (canvas-based renderer). Toggle via "Sheet Music" button in controls.
- Recording mode: play the organ and record into a tracker pattern
- Multi-instrument: switch between organ, harpsichord, choir sounds
- Sustain pedal (hold Shift to sustain notes)
- MIDI input support (navigator.requestMIDIAccess)
