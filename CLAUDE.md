# HTML Style Guides Project

A collection of self-contained HTML design systems, interactive educational stories, and styled tech reference guides. Everything runs on GitHub Pages with zero build tools or frameworks.

## Project Structure

```
/
├── index.html              # Master index (links to all 3 sections)
├── styles/                 # 103 CSS design system showcases
│   └── CLAUDE.md           # How to build style guides
├── stories/                # 32 interactive educational narratives
│   ├── CLAUDE.md           # How to build stories
│   ├── STORY-CREATION-GUIDE.md  # Deep reference (audio, parallel workflows)
│   ├── briefs/             # Research briefs (Markdown)
│   ├── audio/              # Optional narration MP3s
│   └── [story-name]/       # Each story in its own folder
│       └── index.html      # Story file (may include media assets alongside)
└── techguides/             # 23 styled developer reference docs
    └── CLAUDE.md           # How to build tech guides
```

## Core Principles

- **Self-contained HTML**: Every file is a single `.html` with inline `<style>` and optional inline `<script>`. No external CSS/JS files.
- **Google Fonts only**: The sole external dependency. Loaded via `<link>` in `<head>`.
- **No build step**: Files open directly in a browser. Deployed via GitHub Pages.
- **No frameworks**: Vanilla HTML/CSS/JS only.
- **Media in stories**: Stories may embed YouTube iframes and link to external resources (Wikipedia, Know Your Meme). Style guides and tech guides remain strictly self-contained.

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
