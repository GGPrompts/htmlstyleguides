# Music — Mozart's Study

Chiptune music studio with 56+ songs, a sequencer, visualizer, music videos, and a virtual organ. Hub page styled with the Mozart's Study aesthetic (Cinzel/Cormorant Garamond/Crimson Pro, parchment/gold/mahogany).

## Structure

```
music/
  index.html              # Hub page — song browser + tool cards
  CLAUDE.md               # This file
  audio-tracker/          # FamiTracker-inspired sequencer
    index.html            # Sequencer UI
    organ.html            # Cathedral organ virtual instrument
    playback-engine.js    # ChipPlayer audio engine (shared dependency)
    synth.js              # Synthesizer module
    songs/
      index.json          # Song manifest (title, description, BPM, category)
      *.json              # Individual song files
  visualizer/             # Canvas visualizer
    CLAUDE.md             # Renderer authoring guide
    index.html            # Visualizer UI (full-viewport canvas + overlay)
    engine.js             # Core engine (audio, cursor, analysis, renderer dispatch)
    stick-fight-engine.js # Stick-figure skeleton/pose/ragdoll toolkit
    renderers/            # Pluggable renderer modules
    music-videos/         # Beat-synced stick-figure music videos
      index.html          # VHS tape deck video browser
      *-video.html        # Individual video files (53 videos)
```

## Hub Page (index.html)

- Loads song data dynamically from `audio-tracker/songs/index.json` via fetch()
- Song browser with search, category filter, and sortable columns (title/BPM/category)
- Action buttons per song: Tracker, Visualizer, Video (if available)
- Video availability determined by a JS lookup set (not all songs have videos)

## Cross-References

Games that use music resources (e.g., Survivors arena themes) reference files via `../../music/audio-tracker/` relative paths.

## Adding a New Song

1. Create the song JSON in `audio-tracker/songs/`
2. Add an entry to `audio-tracker/songs/index.json`
3. The hub page picks it up automatically (no hub page edits needed)
4. Optionally create a video in `visualizer/` and add its slug to the VIDEO_SLUGS set in `index.html`
