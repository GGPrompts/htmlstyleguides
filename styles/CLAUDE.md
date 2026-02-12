# Style Guides

104 self-contained HTML files, each showcasing a complete CSS design system.

## What a Style Guide Is

A style guide demonstrates a visual design language — colors, typography, spacing, buttons, forms, cards, alerts, and other UI components — all styled to a specific aesthetic (e.g., Bauhaus, Cyberpunk, Art Deco, Cottagecore).

## File Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Style Name] — HTML Style Guide</title>
    <!-- Google Fonts (curated for this aesthetic) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
    <style>
        :root {
            /* Color palette */
            --primary: #...;
            --secondary: #...;
            --bg: #...;
            --text: #...;
            /* Spacing scale */
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 16px;
            --space-lg: 32px;
            --space-xl: 64px;
            /* Typography */
            --font-display: '...', serif;
            --font-body: '...', sans-serif;
        }
        /* Full design system CSS here (~400-1500 lines) */
    </style>
</head>
<body>
    <div class="container">
        <header><!-- Title + tagline --></header>

        <section><!-- 01. Color Palette --></section>
        <section><!-- 02. Typography --></section>
        <section><!-- 03. Spacing --></section>
        <section><!-- 04. Buttons --></section>
        <section><!-- 05. Forms --></section>
        <section><!-- 06. Cards --></section>
        <section><!-- 07. Alerts --></section>
        <!-- Additional sections as appropriate -->

        <footer><!-- Credits/metadata --></footer>
    </div>

    <!-- Optional: minimal vanilla JS for theme toggle, etc. -->
    <script>/* ... */</script>
</body>
</html>
```

## Required Sections

Every style guide should include at minimum:

1. **Color Palette** — Named swatches with hex values and usage philosophy
2. **Typography** — Display, heading, body, and caption font samples with sizes/weights
3. **Spacing** — Visual scale demonstration (base unit typically 4px or 8px)
4. **Buttons** — Primary, secondary, disabled states; multiple sizes
5. **Forms** — Text inputs, selects, checkboxes, radio buttons with labels
6. **Cards/Panels** — Content containers styled to the aesthetic

Optional but common: Alerts, Navigation, Modals, Grid System, Design Principles section.

## Rules

- **Fully self-contained**: All CSS inline in `<style>`. No external stylesheets.
- **CSS variables in `:root`**: Colors, spacing, fonts all as custom properties.
- **Responsive**: Include mobile breakpoint (`@media (max-width: 768px)`).
- **Semantic HTML**: Use `<section>`, `<header>`, `<footer>`, `<label>`, etc.
- **No frameworks**: Pure HTML/CSS. Vanilla JS only if needed (theme toggle, etc.).
- **File naming**: `kebab-case.html` matching the aesthetic name.

## Naming Convention

Files are named for the design aesthetic they represent:
- Design movements: `bauhaus.html`, `art-deco.html`, `de-stijl.html`
- Digital aesthetics: `cyberpunk.html`, `vaporwave.html`, `neumorphism.html`
- Material/texture: `watercolor.html`, `terrazzo-atelier.html`, `denim.html`
- Cultural: `japanese-zen.html`, `moroccan.html`, `nordic.html`

## After Creating a New Style Guide

1. Add a themed card to `/index.html` with class `.card-{name}` and matching CSS
2. Consider whether this style could support a story (`/stories/`) or tech guide (`/techguides/`)

## Typical Size

450-2000 lines per file. Average ~1100 lines.
