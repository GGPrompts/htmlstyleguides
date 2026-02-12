# Tech Guides

24 self-contained HTML reference documents for developer tools and concepts, each styled with a design system from `/styles/`.

## Concept

Each tech guide is a comprehensive cheat-sheet/reference for a developer tool (Git, Docker, Python, etc.), presented using one of the project's style guide aesthetics. The styling makes the reference visually distinctive and pleasant to use.

## File Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Tool Name] — Tech Guide</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
    <style>
        :root {
            /* Colors, spacing, fonts from chosen style guide */
        }

        /* Back link */
        .back-link { /* styled arrow link */ }

        /* Sticky jump navigation */
        .jump-nav {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            gap: var(--space-xs);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
        }

        html { scroll-padding-top: 44px; /* match nav height */ }

        /* Section structure */
        .section { }
        .section-header { }
        .section-number { /* 01, 02, etc. */ }
        .section-title { }
        .section-description { }
        .subsection { }
        .subsection-title { }

        /* Content components */
        pre code { /* code blocks */ }
        table { /* comparison/reference tables */ }
        .command-grid { /* responsive grid of command cards */ }
        .alert { /* callout boxes: .alert-info, .alert-warning */ }
        .badge { /* inline labels */ }

        /* Footer */
        .site-footer { }
    </style>
</head>
<body>
    <a href="index.html" class="back-link">Tech Guides</a>

    <header>
        <h1>[Tool Name]</h1>
        <p class="tagline">[Subtitle]</p>
    </header>

    <!-- Sticky Jump Nav -->
    <nav class="jump-nav">
        <a href="#cheatsheet">Cheat Sheet</a>
        <a href="#basics">Basics</a>
        <a href="#advanced">Advanced</a>
        <!-- ... one link per section -->
    </nav>

    <!-- Sections -->
    <section id="cheatsheet" class="section">
        <div class="section-header">
            <span class="section-number">01</span>
            <h2 class="section-title">Quick Reference</h2>
        </div>
        <div class="section-content">
            <div class="subsection">
                <h3 class="subsection-title">Common Commands</h3>
                <pre><code>command --flag argument</code></pre>
            </div>
        </div>
    </section>
    <!-- ... 8-12 sections total -->

    <footer class="site-footer">
        <a href="index.html">Back to Tech Guides</a>
    </footer>
</body>
</html>
```

## Content Structure

A typical tech guide includes **8-12 sections**:

1. **Quick Reference / Cheat Sheet** — Most common commands at a glance
2. **Setup / Installation** — Getting started
3. **Core Concepts** — Fundamental operations
4. **Common Workflows** — Day-to-day usage patterns
5. **Configuration** — Settings, config files, environment
6. **Advanced Usage** — Power-user techniques
7. **Troubleshooting** — Common errors and fixes
8. **Tips & Tricks** — Pro tips, aliases, shortcuts

Each section has 2-5 subsections with code examples, tables, or command grids.

## Required Components

- **Back link**: `<a href="index.html" class="back-link">` at top of page
- **Sticky jump nav**: Horizontal nav bar that stays visible on scroll
- **Numbered sections**: `01`, `02`, etc. with ID anchors matching jump nav links
- **Code blocks**: `<pre><code>` for all command/code examples
- **Footer**: Link back to `index.html`

## Sticky Jump Nav

The nav must be:
- `position: sticky; top: 0; z-index: 100;`
- Horizontally scrollable on mobile (`overflow-x: auto`)
- Anchors match section IDs
- Set `html { scroll-padding-top: 44px; }` so sections aren't hidden behind nav

## Style Guide Pairing

Each tech guide uses a style guide's aesthetic. When creating a new guide:
1. Pick a style from `/styles/` that hasn't been used by another tech guide
2. Adapt its CSS variables, typography, and visual patterns
3. Style all components (code blocks, tables, alerts) to match the aesthetic
4. Note the style pairing in the index card's "kicker" label

Current pairings include: Git/Letterpress, Docker/Shipping-Container, Python/Swiss-International, Vim/Retro-Terminal, Bash/Hacker, etc.

## Naming Convention

Kebab-case matching the tool/topic name:
- `git.html`, `docker.html`, `python.html`
- `curl-wget.html` (compound topics)
- `claude-code.html`, `cloud-platforms.html`
- `software-architecture.html` (concept guides)

## After Creating a New Tech Guide

1. Add a card to `techguides/index.html` in the appropriate tier:
   - **Tier 1 — Core Tools**: Essential developer tools
   - **Tier 2 — Essential Toolkit**: Common languages/utilities
   - **Tier 3 — Infrastructure & Ops**: Server/deployment/architecture
2. Card needs: `.card-{style-name}` class, title, description, style kicker, and matching CSS

## Planning Files

For complex guides, create research/planning docs as hidden files:
- `.{topic}-guide-plan.md` — Section outline, component mapping, content plan
- `.{topic}-guide-research.md` — Raw research data, current best practices

## Typical Size

1500-4000 lines per file depending on topic breadth.
