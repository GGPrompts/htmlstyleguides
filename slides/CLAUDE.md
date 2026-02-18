# Slides

HTML presentation system — JSON decks rendered with theme support, visual editor, and GitHub Pages hosting.

## Architecture

- **Decks**: JSON files in `decks/` defining slides, elements, and metadata
- **Themes**: JS modules in `themes/` that set CSS variables and text styles
- **Viewer** (`view.html` + `engine.js`): Renders and presents decks with keyboard nav, transitions, fullscreen
- **Editor** (`edit.html` + `editor.js`): Visual drag/resize editor with undo/redo, snap guides, multi-select
- **Hub** (`index.html`): Lists available decks with present/edit links

## Deck JSON Format

```json
{
  "title": "Presentation Title",
  "theme": "default",
  "mermaid": false,
  "slides": [
    {
      "layout": "title",
      "elements": [
        { "id": "e1", "type": "text", "content": "Hello", "x": 50, "y": 30, "w": 80, "style": "title" }
      ],
      "notes": "Speaker notes for this slide"
    }
  ]
}
```

All coordinates (`x`, `y`, `w`, `h`) are **percentages** (0–100) relative to the slide canvas.

## Element Types

| Type | Key Properties |
|------|---------------|
| `text` | `content`, `x`, `y`, `w`, `style` (title/subtitle/heading/body/caption/code), optional `color`, `fontSize` |
| `shape` | `shape` (rect/circle), `x`, `y`, `w`, `h`, `fill`, optional `stroke`, `strokeWidth`, `radius` |
| `line` | `x1`, `y1`, `x2`, `y2`, `stroke`, `strokeWidth` |
| `mermaid` | `content` (Mermaid source), `x`, `y`, `w`, `h` — requires `"mermaid": true` on deck |
| `image` | `src`, `x`, `y`, `w`, `h`, optional `alt`, `fit` (contain/cover/fill/none), `radius` |

## Images

Images are stored in `assets/` and referenced by relative path from the deck JSON:

```json
{ "id": "img1", "type": "image", "src": "assets/diagram.png", "x": 10, "y": 20, "w": 40, "h": 40 }
```

### Conventions

- **Directory**: All deck images go in `slides/assets/`
- **Naming**: Use kebab-case with the deck name as prefix: `demo-architecture.png`, `demo-screenshot.webp`
- **Formats**: Prefer `.webp` or `.png`. Use `.svg` for diagrams where possible.
- **Paths in JSON**: Always use `assets/filename.ext` (relative to `slides/`)
- **External URLs**: Also supported (`"src": "https://..."`) but prefer local assets for reliability on GitHub Pages
- **Size**: Keep individual images under 1MB. Optimize before committing.

### AI Workflow

When creating or enhancing a deck with images:

1. Place image files in `slides/assets/` with the deck-name prefix
2. Reference them in the deck JSON as `"src": "assets/deckname-description.ext"`
3. Always include `alt` text for accessibility
4. Set `"fit": "contain"` unless the image should crop (`"cover"`)

## Text Styles

Text styles are defined by the active theme. The default theme provides: `title`, `subtitle`, `heading`, `body`, `caption`, `code`.

Centered styles (typically `title`, `subtitle`, `caption`) use `textAlign: 'center'` and the `x` coordinate represents the center point. Non-centered styles use `x` as the left edge.

## Adding a New Deck

1. Create `decks/your-deck-name.json`
2. Add any images to `assets/` with the `your-deck-name-` prefix
3. Register in `index.html` by adding to the `KNOWN_DECKS` array:

```js
{ file: 'your-deck-name', title: 'Title', description: 'Description.', slides: N, theme: 'default' }
```

## Available Themes

- `default` — Clean, minimal, professional
- `graffiti` — Street art energy, bold colors
- `cyberpunk` — Neon accents, dark background

Themes are JS files in `themes/` that export CSS variables and text style definitions via `window.SLIDE_THEME`.

## Layout Presets (Editor)

The editor provides quick-start layouts: `title-body`, `two-column`, `comparison`, `section-break`, `blank`. These replace the current slide's elements with a starter template.

## Mermaid Diagrams

Set `"mermaid": true` on the deck object to enable. Mermaid.js is loaded on demand. Security defaults to `strict` (override with `"mermaidSecurity"` on the deck object — avoid this unless necessary).
