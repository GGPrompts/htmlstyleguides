# Interactive Stories

31 self-contained HTML interactive narratives that teach history through a style guide's visual aesthetic.

For deep reference (audio narration, parallel workflows, advanced patterns), see `STORY-CREATION-GUIDE.md` in this directory.

## Concept

Each story pairs a style guide from `/styles/` with a historical topic that matches the aesthetic. The style guide's CSS becomes the narrative's visual layer — components map to storytelling functions (cards become case files, alerts become discoveries, buttons become choices).

## File Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Story Title]</title>
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
    <style>
        /* Style guide CSS adapted for narrative use (~300-600 lines) */
        :root { /* palette, fonts, spacing */ }

        .game-container { max-width: 800px; margin: 0 auto; padding: 2rem; }
        .title-screen { /* landing page with Start button */ }
        .scene-wrapper { display: none; /* shown when game starts */ }
        .scene-header { /* HUD: era, year, progress */ }
        .clue-tracker { /* sidebar listing collected facts */ }

        /* Scene type classes */
        .scene-narration { /* body text scenes */ }
        .scene-investigation { /* discovery/exploration scenes */ }
        .scene-confrontation { /* tension/dialogue scenes */ }
        .scene-ending { /* conclusion scenes */ }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- Title Screen -->
        <div class="title-screen" id="titleScreen">
            <a href="index.html" class="back-to-stories">Stories</a>
            <h1>[Story Title]</h1>
            <p>[Tagline]</p>
            <button onclick="engine.start()">Begin</button>
        </div>

        <!-- Scene Display -->
        <div class="scene-wrapper" id="sceneWrapper">
            <div class="scene-header"><!-- era, year, progress --></div>
            <div id="sceneContent"></div>
            <div class="clue-tracker" id="clueTracker"><!-- collected facts --></div>
        </div>
    </div>

    <script>
        const STORY = {
            intro: {
                year: '1925',
                era: 'THE BEGINNING',
                content: `<div class="scene-narration">...</div>`,
                fact: 'Historical fact collected here',
                choices: [
                    { text: 'Choice A', next: 'scene_a' },
                    { text: 'Choice B', next: 'scene_b' }
                ]
            },
            // ... 10-15 scenes total
            ending_good: {
                content: `<div class="scene-ending">...</div>`,
                choices: [
                    { text: 'Play Again', next: 'intro' },
                    { text: 'Back to Stories', next: '_exit' }
                ]
            }
        };

        const engine = {
            currentScene: null,
            history: [],
            clues: [],
            init() { /* setup listeners, keyboard 1-9 for choices */ },
            start() { /* hide title, show scene wrapper, goTo('intro') */ },
            goTo(id) { /* transition + render scene */ },
            renderScene() { /* inject content, update HUD, add choices */ },
        };
        engine.init();
    </script>
</body>
</html>
```

## Story Structure Requirements

- **10-15 scenes** total
- **3-5 branching points** where player makes choices
- **2-3 endings** (varying outcomes based on choices)
- **1 convergence point** where branches rejoin
- **Every scene teaches** at least one real historical fact
- **Use real names, dates, and numbers** — not vague generalizations
- **Back-to-stories link** on the title screen: `<a href="index.html">`

## Scene Data Format

```javascript
scene_id: {
    year: '1925',              // Displayed in HUD
    era: 'DESSAU ERA',         // Header context
    content: `<div>...</div>`, // HTML with style-specific classes
    fact: 'One-sentence fact', // Added to clue tracker
    choices: [
        { text: 'Label', next: 'other_scene_id' }
    ]
}
```

## Creation Workflow

1. **Research** the style guide's cultural period — find 8-12 real historical facts
2. **Write a brief** in `briefs/[style-name]-brief.md` documenting facts, arc, and component mapping
3. **Map components** — decide which CSS classes serve which narrative functions
4. **Build the story** using an existing story as template reference
5. **Validate**: all `next` values point to defined scenes, no orphan scenes, keyboard 1-9 works

## Naming Convention

`[style-guide-name]-[short-descriptor].html`

Examples:
- `noir-the-morrison-case.html` (noir style + detective story)
- `bauhaus-the-last-semester.html` (bauhaus style + school history)
- `cosmic-the-golden-record.html` (cosmic style + space exploration)

## After Creating a New Story

1. Add a card to `stories/index.html` with scene count, ending count, and description
2. Optionally add audio narration in `audio/[story-name]/[sceneId].mp3`

## Common Pitfalls

- Choices pointing to undefined scene IDs (always cross-check `next` values against `STORY` keys)
- Orphan scenes that no choice leads to
- Missing `fact` property (every scene should teach something)
- Forgetting keyboard navigation support (1-9 keys)
- Missing back-to-stories link on title screen
