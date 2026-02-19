# HTML Style Guides Project

A collection of CSS design system showcases, interactive educational stories, styled tech reference guides, a chiptune music studio, and browser games. Everything runs on GitHub Pages with zero build tools or frameworks.

## Project Structure

```
/
├── index.html              # Master index (links to all sections)
├── styles/                 # 155 CSS design system showcases
│   └── CLAUDE.md           # How to build style guides
├── stories/                # 33 interactive educational narratives
│   ├── CLAUDE.md           # How to build stories
│   ├── STORY-CREATION-GUIDE.md  # Deep reference (audio, parallel workflows)
│   ├── briefs/             # Research briefs (Markdown)
│   ├── audio/              # Optional narration MP3s
│   └── [story-name]/       # Each story in its own folder
│       └── index.html      # Story file (may include media assets alongside)
├── techguides/             # 43 styled developer reference docs
│   └── CLAUDE.md           # How to build tech guides
├── slides/                 # HTML presentation viewer & editor
│   ├── CLAUDE.md           # How to build slide decks
│   ├── index.html          # Hub page — lists presentations
│   ├── view.html           # Presentation viewer (?deck=name)
│   ├── edit.html           # Visual slide editor
│   ├── engine.js           # Viewer engine (nav, transitions, rendering)
│   ├── editor.js           # Editor engine (drag, resize, text editing)
│   ├── themes/             # Theme JS modules (default, graffiti, cyberpunk)
│   ├── assets/             # Deck images (prefix with deck name)
│   └── decks/              # JSON presentation files
├── music/                  # Chiptune music studio (Mozart's Study)
│   ├── CLAUDE.md           # How to use the music section
│   ├── index.html          # Hub page — song browser + tool links
│   ├── audio-tracker/      # FamiTracker-inspired sequencer + organ
│   └── visualizer/         # Canvas visualizer + music videos
│       └── CLAUDE.md       # How to build renderers
└── games/                  # Browser games (modular JS)
    └── survivors/          # Survivors roguelike (arena + shop + themes)
```

## Core Principles

- **No build step**: All files work directly in a browser. Deployed via GitHub Pages.
- **No frameworks**: Vanilla HTML/CSS/JS only.
- **Google Fonts**: The only external CDN dependency. Loaded via `<link>` in `<head>`.

### Style guides & tech guides — single-file, self-contained
- Each is one `.html` file with inline `<style>` and optional inline `<script>`. No external CSS/JS.

### Stories & games — modular is fine
- Stories and games can use multiple files (shared JS, theme configs, JSON data, media assets).
- The only hard rule: it must work on GitHub Pages with no build step.
- Stories may embed YouTube iframes and link to external resources (Wikipedia, etc.).

## Cross-Cutting Patterns

- **Naming**: All files use kebab-case (`dark-academia.html`, `curl-wget.html`)
- **CSS variables**: Every file defines its palette/spacing/fonts in `:root {}`
- **Responsive**: All files include `@media (max-width: 768px)` breakpoints
- **Navigation**: Each section has its own `index.html` with card grid; cards link to individual files

## Index Updates

When adding new content, update the relevant index:
- Style guides: `/index.html` (add card with `.card-{name}` class + CSS)
- Stories: `/stories/index.html` (add card with metadata tags)
- Tech guides: `/techguides/index.html` (add card in appropriate tier)

Also update the counts/descriptions in the master `/index.html` nav links if applicable.

## Git

- Push with: `git config --global credential.helper store && echo "https://GGPrompts:$(gh auth token --user GGPrompts)@github.com" > ~/.git-credentials && git push origin main`
- Always use `--user GGPrompts` explicitly
