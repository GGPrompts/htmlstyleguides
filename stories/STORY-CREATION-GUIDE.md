# Interactive Story Creation Guide

Instructions for creating interactive stories from HTML style guides. Each story is a self-contained HTML file that reuses a style guide's CSS/components as the visual layer for an educational, branching narrative.

## Architecture

Every story follows the same pattern:

```
single-file.html
├── <style>        CSS from the style guide (adapted for story use)
├── <body>         Title screen + scene wrapper + overlays
└── <script>
    ├── STORY = {} Story data (scenes, text, choices, facts)
    └── engine     Lightweight JS engine (~80 lines)
```

No frameworks. No build step. No external dependencies beyond Google Fonts.

## The Engine

The engine is ~80 lines of JS that handles:
- Scene rendering (picks template based on scene type)
- State management (current scene, collected facts/knowledge)
- Transitions between scenes (style-appropriate animation)
- Keyboard support (1/2/3 keys for choices)
- Knowledge/fact tracker sidebar
- Restart functionality

Copy the engine pattern from any existing story and adapt the `render()` method for the new style guide's components.

## Step-by-Step Process

### 1. Research Phase (Haiku)

For each style guide, research:

- **What cultural period/place does it represent?** (e.g., Bauhaus = Weimar Germany 1919-1933)
- **What real historical events happened in that period?** Find 8-12 key moments with real names, dates, numbers
- **What are the design principles of the style?** These become "lessons" woven into the story
- **What dramatic tension exists?** Every good story needs conflict (the crash, the Nazis, a mystery)
- **What component types exist in the style guide?** Map them to narrative functions

Output a research brief with:
```
Style: [name]
Period: [era and location]
Story concept: [1-2 sentence pitch]
Key historical facts: [8-12 bullet points with dates and numbers]
Dramatic arc: [setup → tension → climax → resolution]
Component mapping: [which CSS components map to which story elements]
Scene outline: [10-12 scenes with branching points]
```

### 2. Component Mapping

This is the key creative step. Map the style guide's CSS components to narrative functions:

| Narrative Need | How To Map It |
|---|---|
| Narration / voiceover | The style's "body text" component, or a distinctive element (typewriter paper for noir, message box for pixel art, narration block for bauhaus) |
| Exposition / world-building | Info cards, newspaper clippings, fact boxes — whatever the style uses to present secondary information |
| Dialogue / confrontation | Centered, dramatic presentation — interrogation light, game dialog box, quote blocks |
| Key reveals / plot points | The style's most visually striking component — game over screen, dark mode switch, composition grids |
| Choices | Buttons from the style guide, adapted to be full-width with numbering |
| Facts / knowledge collected | Badges, evidence tags, item cards — the style's "tag" or "label" component |
| Scene transitions | Animate a signature visual element — venetian blinds for noir, RGB color wipes for bauhaus, black flash for pixel art |
| Atmospheric background | Film grain, scanlines, fog, vignette — the style's overlay effects |

### 3. Story Structure

Aim for:
- **10-15 scenes** (enough for depth, short enough to finish in one sitting)
- **3-5 branching points** (real choices, not just "continue")
- **2-3 endings** (different perspectives on the same history)
- **1 convergence point** (branches rejoin before the climax so you don't need exponential scenes)

Standard arc:
```
Title Screen
  → Introduction (set the scene, establish the era)
  → Choice 1 (perspective/role selection — affects flavor, not plot)
  → Rising action (2-3 scenes of historical events)
  → Choice 2 (investigation/exploration branch)
  → Climax (the dramatic turning point)
  → Choice 3 (the big decision — affects ending)
  → Ending A / B / C
```

### 4. Scene Data Format

Each scene in the STORY object:

```javascript
scene_id: {
    // Metadata
    year: '1925',           // For HUD display (optional)
    era: 'DESSAU ERA',      // For header display (optional)
    health: 70,             // For health bar if applicable (optional)
    dark: false,            // Toggle dark mode for dramatic scenes (optional)

    // Content — raw HTML using the style guide's CSS classes
    content: `
        <div class="era-header">...</div>
        <div class="msg-box">
            <div class="msg-text">
                <p>Narrative text here...</p>
            </div>
        </div>
        <div class="fact-box">
            <div class="fact-label">// REAL HISTORY</div>
            <p>Educational content here...</p>
        </div>
    `,

    // Knowledge tracking
    fact: 'One-sentence fact that gets saved to the knowledge tracker',

    // Branching
    choices: [
        { text: 'Choice label', next: 'next_scene_id' },
        { text: 'Choice label', next: 'other_scene_id' }
    ]
}
```

### 5. Educational Content Guidelines

- **Real names, real dates, real numbers.** "Space Invaders earned $3.8 billion in quarters" is memorable. "The game was very popular" is not.
- **Teach through the experience, not lectures.** The CSS is doing half the teaching. The Bauhaus story uses Bauhaus geometry. The pixel art story uses health bars and game over screens.
- **Include surprising facts.** "Japan had a coin shortage" sticks. "The game sold well" doesn't.
- **Weave facts into narrative.** Don't separate "story" and "lesson" — the lesson IS the story. Use dedicated fact/lesson cards for deeper context.
- **Every scene should teach at least one thing** that gets added to the knowledge tracker.
- **The ending should connect past to present.** "Your phone descends from the Bauhaus" makes history feel alive.

### 6. Style Guide Component Reference

Read the target style guide HTML file and identify:

1. **Section/container components** — how content is grouped
2. **Card variants** — these become your scene "types"
3. **Typography classes** — headlines, body, captions
4. **Color palette** — especially accent colors for emphasis
5. **Special elements** — the unique, atmospheric stuff (film grain, scanlines, geometric shapes)
6. **Button styles** — these become your choice buttons
7. **Badge/tag components** — these become era markers and knowledge items
8. **Overlay effects** — these become transitions and atmosphere

### 7. File Naming

```
stories/[styleguide]-[short-title].html
```

Examples:
- `noir-the-morrison-case.html`
- `pixel-player-one.html`
- `bauhaus-the-last-semester.html`
- `art-deco-the-jazz-age.html`
- `parchment-the-scribes-tale.html`

## Existing Stories

| File | Style Guide | Topic | Scenes | Endings |
|---|---|---|---|---|
| `noir-the-morrison-case.html` | Noir | Interactive detective fiction | 15 | 3 |
| `pixel-player-one.html` | Pixel Art | History of video games 1972-1995 | 10 | 1 (+branch) |
| `bauhaus-the-last-semester.html` | Bauhaus | Bauhaus school history 1919-1933 | 10 | 3 |

## Style Guides Available (with story ideas)

Below are the 54 style guides in `../styles/` with suggested educational topics. Prioritize guides that have strong cultural/historical associations.

### Tier 1 — Strong cultural/historical connection

| Style Guide | Suggested Topic |
|---|---|
| `art-deco.html` | The Jazz Age / 1920s — Prohibition, flappers, the Harlem Renaissance, the stock market crash |
| `art-nouveau.html` | Belle Epoque Paris 1890-1910 — Mucha, absinthe, the 1900 World's Fair, birth of cinema |
| `parchment.html` | Medieval monks and the making of books — scriptoria, illuminated manuscripts, Gutenberg |
| `japanese-zen.html` | Japanese philosophy — wabi-sabi, the tea ceremony, Zen Buddhism, ikigai |
| `moroccan.html` | Islamic geometric art and mathematics — the Alhambra, trade routes, algebra's Arabic origins |
| `midcentury.html` | The Space Race 1957-1969 — Sputnik to Apollo 11, design optimism, the atomic age |
| `streamline-moderne.html` | The 1930s — Art Deco meets aerodynamics, ocean liners, the Chrysler Building, Depression-era dreams |
| `letterpress.html` | History of printing — Gutenberg to hot metal to desktop publishing, how typography shaped civilization |
| `nordic.html` | Scandinavian culture — Viking exploration, hygge, democratic design, the welfare state experiment |
| `copper-verdigris.html` | Statue of Liberty / metallurgy — how copper ages, the engineering of monuments, conservation science |

### Tier 2 — Strong thematic connection

| Style Guide | Suggested Topic |
|---|---|
| `cyberpunk.html` | The birth of the internet — ARPANET, hackers, the dot-com boom/bust, digital privacy |
| `retro-terminal.html` | Early computing — Turing, ENIAC, the command line, how we went from room-sized to pocket-sized |
| `dark-academia.html` | History of universities — medieval Oxford, secret societies, the Enlightenment, banned books |
| `film-grain.html` | History of cinema — Lumière brothers, silent film, Hitchcock, the studio system |
| `darkroom.html` | History of photography — daguerreotypes, war photography, Ansel Adams, the decisive moment |
| `risograph.html` | Zine culture and DIY publishing — punk zines, Riot Grrrl, independent press, self-publishing revolution |
| `vaporwave.html` | 1990s internet culture — GeoCities, early web design, the browser wars, digital nostalgia |
| `psychedelic.html` | The 1960s counterculture — Woodstock, civil rights, pop art, the Summer of Love |
| `cosmic.html` | Space exploration — Hubble, the Voyager Golden Record, black holes, are we alone? |
| `sketch.html` | History of drawing/illustration — cave paintings to Manga, how humans learned to draw |

### Tier 3 — Looser thematic fit (still fun)

| Style Guide | Suggested Topic |
|---|---|
| `brutalist-web.html` | Brutalist architecture — Le Corbusier, council housing, "béton brut", love-it-or-hate-it |
| `glassmorphism.html` | History of glass — stained glass, Venetian glassblowing, modern architecture, fiber optics |
| `holographic.html` | Light and optics — Newton's prism, lasers, holograms, the electromagnetic spectrum |
| `coffee.html` | History of coffee — Ethiopian origins, Ottoman coffee houses, the Enlightenment café, espresso culture |
| `denim.html` | History of denim — Gold Rush, Levi Strauss, workwear to fashion, cultural rebellion |
| `watercolor.html` | History of painting — pigments, watercolor technique, Turner, Impressionism |
| `verdant-grove.html` | Botany and ecology — how forests work, photosynthesis, the wood wide web, conservation |
| `neon-brutal.html` | Neon signs and urban nightlife — Times Square, Vegas, Tokyo, the art of neon bending |

## Parallel Creation Workflow

To create many stories at once:

### Phase 1: Research (Haiku agents in parallel)
For each style guide, spawn a Haiku agent to:
1. Read the style guide HTML (identify components and aesthetic)
2. Research the suggested historical topic using the **Wikipedia MCP server** (`wikipedia` tools: search articles, get summaries, pull sections for real dates/names/numbers)
3. Output a research brief (see format in Step 1 above)

> **Wikipedia MCP** is configured globally at `~/.claude/mcp.json`. Use it to get accurate historical facts — real dates, real names, real numbers. Training data alone is not reliable enough for educational content. Always prefer Wikipedia-sourced facts over recall.

### Phase 2: Create (Opus agents in parallel)
For each research brief, spawn an Opus agent to:
1. Read the research brief
2. Read the target style guide HTML for CSS/component reference
3. Read one existing story as a pattern reference (noir is the most complete)
4. Write the complete HTML story file
5. Validate: all choice targets have matching scene definitions, no orphan scenes

### Validation Checklist
After creation, verify each story:
- [ ] All `next:` targets point to defined scenes (or `_restart`)
- [ ] No unreachable scenes (except the start scene)
- [ ] DOCTYPE, html, head, body tags present and closed
- [ ] Google Fonts link included
- [ ] Keyboard support (1-9 keys) works
- [ ] Knowledge tracker updates with facts
- [ ] Title screen → start → scenes → ending → restart loop works
- [ ] At least 8 real historical facts with dates/numbers
- [ ] At least 2 meaningful choices (not just "continue")
- [ ] File saved as `stories/[style]-[title].html`
