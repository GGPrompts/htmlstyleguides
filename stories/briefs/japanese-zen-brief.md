# Japanese Zen Design System - Research Brief

## Style: Japanese Zen
**Period:** Japanese philosophical traditions, ~1200-1600 (with modern connections)

**Story Concept:** An interactive meditation on the intersecting paths of Zen Buddhism and Japanese aesthetics, exploring how a tea master's lineage, a poet's insight, and a philosophy of imperfection shaped an entire civilization's approach to beauty and meaning. The user becomes a seeker discovering the hidden connections between wabi-sabi, the tea ceremony, and the search for ikigai.

## Key Historical Facts

- **Bodhidharma travels to China (circa 520 CE):** Bodhidharma, a South Indian Buddhist monk, arrived at the Shaolin Temple around 527 CE and is credited with establishing the foundation of Chan Buddhism, which later became known as Zen in Japan.

- **Zen Buddhism arrives in Japan (12th century):** Although Bodhidharma died in the 6th century, Zen Buddhism did not take root in Japan until approximately 700 years later, around the 12th century during the medieval period.

- **Dōgen founds Sōtō Zen (1200-1253):** Dōgen Zenji (January 26, 1200 – September 22, 1253) was born into nobility and at age 12 studied at Mount Hiei. He traveled to China and studied with Zen Master Tiantong Rujing, returning to establish the Sōtō school of Zen in Japan, which remains the largest Buddhist sect with over 10 million adherents today supporting approximately 14,000 temples.

- **Tea ceremony develops during Muromachi period (1336-1573):** During this period, tea transformed from a luxury for nobles into a formal spiritual practice, emphasizing simplicity and natural beauty over extravagance.

- **Sen no Rikyū revolutionizes tea ceremony (1522-1591):** Born in 1522, Sen no Rikyū became the most influential tea master in Japanese history. On April 21, 1591, at age 69, he established the four core principles still central to tea today: harmony (wa), respect (kei), purity (sei), and tranquility (jaku).

- **Sen no Rikyū's lineage continues (post-1591):** Rikyū's three great-grandchildren founded the Omotesenke, Urasenke, and Mushakōjisenke schools of tea ceremony, spreading the practice from feudal lords and samurai to the general public throughout Japan.

- **Ashikaga Yoshimasa and the origins of Kintsugi (1436-1490):** The 8th Ashikaga Shogun, Ashikaga Yoshimasa, sent a damaged Chinese tea bowl to China for repairs in the late 15th century. When it returned with displeasing metal staples, he ordered a new approach, leading to the development of kintsugi, the art of repairing pottery with gold lacquer.

- **Kintsugi becomes formalized (16th century):** Gold lacquer pottery repairs became a standardized art form during the 16th century alongside the flourishing of tea bowl vessels used in chanoyu (the Japanese tea ceremony), embodying the wabi-sabi philosophy of embracing imperfection.

- **Wabi-sabi emerges from tea ceremony philosophy (15th century):** Wabi-sabi developed from the aesthetic philosophy of cha-no-yu during 15th-century Japan, finding beauty in things imperfect, impermanent, and incomplete—a direct response to Zen Buddhist teachings on transience and simplicity.

- **Matsuo Bashō synthesizes Zen and poetry (1644-1694 era):** Matsuo Bashō was a Zen Buddhist lay monk who revolutionized haiku by focusing on microscopic scenes from everyday life that reveal enormous truths, compressing volumes of insight into seventeen syllables and embodying the principles of wabi-sabi in poetry.

- **Mieko Kamiya introduces Ikigai philosophy (1966):** Japanese psychiatrist and academic Mieko Kamiya first popularized the concept of ikigai in her 1966 book "On the Meaning of Life," defining it as what brings value and joy to life, from cherished people to meaningful activities and work.

- **Urushi lacquer tradition dating back (2400 BC):** Japanese urushi lacquer, used in traditional kintsugi repairs, has been used in Japan since at least 2400 BC, with one 20-year-old tree producing only a single cup of lacquer before needing to be cut down, reflecting the philosophy of deep respect for natural resources.

## Dramatic Arc

**Setup:** The user arrives as a seeker at a traditional Zen temple garden, encountering the concept of ma (negative space) and learning how emptiness gives meaning to form. They meet the ghost of a tea master explaining the four principles of chanoyu.

**Exposition:** Through interactive discoveries, the user learns the 13-century journey of Zen from Bodhidharma's arrival in China to Dōgen's founding of Sōtō Zen in 1200. They explore how wabi-sabi emerged from tea ceremony philosophy in the 15th century as a celebration of imperfection and impermanence.

**Rising Tension:** The user encounters a broken tea bowl (symbolizing kintsugi's origin with Ashikaga Yoshimasa in the 15th century) and must decide whether to discard it or repair it. They learn about the lineage of Sen no Rikyū (1522-1591) and his four principles, understanding how a single master's vision shaped 400+ years of Japanese culture.

**Climax:** The user discovers the interconnection between all philosophical threads—Zen Buddhism's simplicity, wabi-sabi's embrace of imperfection, kintsugi's respect for broken things, the tea ceremony's four principles, ikigai's search for meaning, and Bashō's poetic compression of wisdom. They realize these are not separate philosophies but reflections of a single truth: beauty emerges from impermanence and intention.

**Resolution/Reflection:** The user completes their own "tea ceremony" of daily life, understanding ikigai—that their reason for being lies at the intersection of what they love, what they're good at, what the world needs, and what brings fulfillment. They leave with a personal haiku they've composed, reflecting their newfound understanding of Zen simplicity.

## Component Mapping

| Story Element | CSS Component | Details |
|---|---|---|
| **Narration** | `.quote-block` | Contemplative passages reflecting Zen teaching and philosophy |
| **Exposition** | `.card` with `.card-number` | Historical facts presented in numbered cards (Bodhidharma, Dōgen, Sen no Rikyū, etc.) |
| **Dialogue** | `.principle-block` | The voice of historical figures (Bodhidharma, Dōgen, Sen no Rikyū, Matsuo Bashō) explaining their philosophies |
| **Key Reveals** | `.card-featured` | Critical moments when concepts interconnect (Kintsugi origin, Four Principles, Ikigai definition) |
| **Choices/Branching** | `.button-row` with `.btn`, `.btn-primary`, `.btn-accent` | Paths through the narrative (Repair or discard the bowl? Seek contemplation or action? What is your ikigai?) |
| **Facts/Knowledge** | `.table` | Historical timeline of Zen Buddhism, tea ceremony masters, and philosophical milestones |
| **Transitions** | `.divider` | Moments between scenes, representing the pause between thoughts (ma) |
| **Atmosphere** | `.enso`, `.brush-stroke`, texture overlays | Visual manifestations of Zen simplicity, imperfect circles, ink brush effects |
| **Context/Categories** | `.badge`, `.badge-rust`, `.badge-bamboo` | Tagging scenes by philosophical school (Sōtō Zen, Wabi-sabi, Chanoyu, Ikigai) |
| **Primary Action** | `.btn-primary` | "Continue to Next Scene," "Learn More," "Contemplate This" |
| **Secondary Action** | `.btn-subtle` | "Skip," "Revisit Concept," "Reflect" |
| **Accent Action** | `.btn-accent` | "Make Your Choice," "Plant Your Seed," "Write Your Haiku" |

## Scene Outline

1. **Gate of Arrival (The Tea Garden)**
   - The user enters a stylized zen garden rendered in CSS with the `.ma-demo` concept
   - Brief meditation on ma (negative space) introducing the core principle
   - *Branching:* Continue to historical timeline or skip to philosophy section

2. **The Messenger from the West (Bodhidharma, ~527 CE)**
   - Scene in a mountain temple with a Buddhist monk arriving from India/China
   - Introduces Zen Buddhism's foundation: simplicity, mind-to-mind transmission
   - *Branching:* Learn more about Zen, or move forward to Japan

3. **Seven Centuries of Silence (Journey to Japan, 527-1200 CE)**
   - A montage-style explanation of why Zen took so long to arrive in Japan
   - Introduce the concept of wabi-sabi emerging from Japanese culture
   - *Branching:* Deep dive into wabi-sabi philosophy, or continue timeline

4. **The Mountain Scholar (Dōgen, 1200-1253)**
   - Dōgen as a young seeker, his journey to Mount Hiei at age 12
   - His travel to China to study with Tiantong Rujing
   - His founding of Sōtō Zen and writing of Shōbōgenzō
   - *Branching:* Explore Sōtō Zen teachings, or move to tea ceremony era

5. **The Master of Tea (Sen no Rikyū, 1522-1591)**
   - A detailed interactive scene of a tea ceremony in progress
   - Introduction of the Four Principles: wa (harmony), kei (respect), sei (purity), jaku (tranquility)
   - The user participates in the ceremony, making choices about presence and attention
   - *Branching:* Master one principle, or learn how they all interconnect

6. **The Broken Bowl (Kintsugi Origin Story, ~1470s)**
   - Ashikaga Yoshimasa's damaged tea bowl returns from China with metal staples
   - A craftsman proposes repairing it with gold lacquer instead
   - The user decides: discard it as failure, or repair it as art
   - *Branching:* Learn the philosophy of mottainai (respect for resources), or continue

7. **Three Schools, One Spirit (The Rikyū Legacy, 1591-1600s)**
   - The three great-grandchildren of Sen no Rikyū founding Omotesenke, Urasenke, Mushakōjisenke
   - How tea ceremony spreads from shogunate to commoners
   - The democratization of Zen aesthetics
   - *Branching:* Choose which school's philosophy to explore deeper, or move on

8. **The Poet's Lightness (Matsuo Bashō, ~1644-1694)**
   - Bashō writing haiku after losing his house to fire, embracing emptiness
   - The user learns to compress profound truths into 17 syllables
   - Interactive haiku creation reflecting Zen principles
   - *Branching:* Create your own haiku, or explore how poetry connects to daily life

9. **The Search for Purpose (Ikigai, Modern Connection)**
   - Interactive diagram of ikigai: What you love? What you're good at? What the world needs? What sustains you?
   - Reference to Mieko Kamiya's 1966 popularization of the concept
   - The user plots their own ikigai intersection
   - *Branching:* Reflect on each quadrant, or see ikigai in historical figures (Rikyū, Dōgen, Bashō)

10. **The Golden Repair (Kintsugi as Living Philosophy)**
    - Kintsugi extended metaphor for fixing broken relationships, dreams, and self-perception
    - Gallery of kintsugi vessels with their stories
    - The user identifies something "broken" in their life to repair with gold (acceptance)
    - *Branching:* Choose a personal "broken bowl" to repair, or return to meditation

11. **The Circle Closes (Enso and Return)**
    - The user completes the enso circle (though imperfectly, like all things)
    - Reflection on how Bodhidharma → Dōgen → Rikyū → Bashō's lineage continues in them
    - They leave with their own haiku, their ikigai intention, and their golden repair
    - *Branching:* Share their haiku, meditate again, or exit the temple

12. **Epilogue: Ichi-go Ichi-e (One Time, One Meeting)**
    - Final contemplation that this moment, this meeting with the story, was unique and precious
    - Encouragement to live each moment with the awareness of the four principles
    - Return to the tea garden, transformed

## CSS Classes Reference

### Typography & Text
- `.lead` — Lead paragraphs with secondary text color
- `.small` — Small caption text
- `.japanese-text` — Japanese characters with expanded letter spacing
- `.label-text` — Uppercase labels for forms and categories
- `.header-label` — Section header labels with decorative line
- `.section-title-jp` — Japanese section titles
- `.quote-text` — Italic quotations
- `.quote-source` — Citation for quotes
- `.type-name`, `.type-specs`, `.type-sample` — Typography scale demonstration

### Layout & Structure
- `.container` — Max-width container with asymmetrical padding (ma principle)
- `.grid`, `.col-12`, `.col-8`, `.col-7`, `.col-6`, `.col-5`, `.col-4`, `.col-3` — 12-column grid system
- `.section` — Major content sections with top border divider
- `.section-header` — Header for each section
- `.header` — Page header with decorative circles
- `.footer` — Footer with centered content
- `.button-row` — Row container for buttons with flex layout
- `.badge-row` — Row container for badges

### Components
- `.card` — Content card with subtle border and texture
- `.card-featured` — Card with rust-colored left border accent
- `.card-icon` — Icon container (48x48px)
- `.card-icon.enso-icon` — Imperfect circle icon
- `.card-icon.bamboo-icon` — Vertical bamboo line icon
- `.card-icon.stone-icon` — Stone/rock icon
- `.card-number` — Large serif numbers for card display
- `.btn`, `.btn-primary`, `.btn-subtle`, `.btn-accent` — Button variants
- `.btn-sm`, `.btn-lg` — Button sizes
- `.badge`, `.badge-ink`, `.badge-rust`, `.badge-bamboo`, `.badge-outline` — Badge variants

### Form Elements
- `.input-group` — Wrapper for input with label
- `.input-label` — Label text for inputs
- `.input-field` — Text input and textarea
- `.input-underline` — Minimal input with only bottom border
- `.select-field` — Select dropdown
- `.checkbox-group` — Checkbox with label
- `.checkbox-input` — Checkbox element

### Data & Tables
- `.table-wrapper` — Horizontal scroll wrapper for tables
- `.table` — Table element
- `.color-grid` — Grid for color swatches
- `.color-block` — Individual color swatch
- `.color-name`, `.color-jp`, `.color-value` — Color information labels

### Decorative & Atmospheric
- `.enso` — Zen circle with imperfect brush stroke effect (pseudo-element)
- `.brush-stroke` — Fading brush stroke underline effect
- `.vertical-accent` — Vertical decorative line
- `.circle-accent` — Circular decorative element
- `.divider` — Horizontal line with centered dot
- `.ma-demo` — Negative space demonstration with asymmetrical elements
- `.ma-element` — Individual elements in ma demonstration
- `.spacing-bar` — Visual representation of spacing scale
- `.spacing-label`, `.spacing-value` — Spacing scale labels

### Principles & Philosophy
- `.principle-block` — Container for design principle with dot bullet
- `.principle-title` — Principle name (Kanso, Fukinsei, etc.)
- `.principle-jp` — Japanese principle name
- `.quote-block` — Container for philosophical quotes

### Utilities
- `.text-center`, `.text-right` — Text alignment
- `.mb-0`, `.mb-4`, `.mt-4`, `.mt-6`, `.mt-8` — Margin utilities
- `.offset-left` — Left margin offset for asymmetry
- `.hover-line` — Animated underline on hover

### Special Effects & States
- `.header::before`, `.header::after` — Decorative circles in header
- `body::before` — Washi paper texture overlay (fixed, very subtle)
- `.card::before` — Subtle noise texture on cards
- `.color-block::before` — Noise texture on color swatches
- `.btn::before` — Background animation on button hover
- Various `::before` and `::after` pseudo-elements for decorative effects

## Color Palette

### Primary Colors (Natural, Muted Tones)
| Color | Hex | Japanese Name | CSS Variable |
|---|---|---|---|
| Ink (Deep Black) | #1A1A1A | Sumi | `--ink` |
| Ink Light | #3D3D3D | — | `--ink-light` |
| Ink Faded | #5C5C5C | — | `--ink-faded` |
| Stone (Gray) | #6B6B6B | Ishi | `--stone` |
| Stone Light | #8A8A8A | — | `--stone-light` |
| Stone Muted | #A3A3A3 | — | `--stone-muted` |

### Secondary Colors (Natural Materials)
| Color | Hex | Japanese Name | CSS Variable |
|---|---|---|---|
| Sand | #E8E4DE | Suna | `--sand` |
| Sand Light | #F2EFE9 | — | `--sand-light` |
| Sand Warm | #F7F4EE | — | `--sand-warm` |
| Washi (Paper) | #FAF8F5 | Washi | `--washi` |
| Washi Cream | #FDFCFA | — | `--washi-cream` |

### Accent Colors
| Color | Hex | Japanese Name | CSS Variable |
|---|---|---|---|
| Bamboo | #7A8B6E | Take | `--bamboo` |
| Bamboo Light | #96A78A | — | `--bamboo-light` |
| Bamboo Muted | #B8C4AD | — | `--bamboo-muted` |
| Rust | #8B5A4A | Sabi | `--rust` |
| Rust Light | #A67563 | — | `--rust-light` |
| Rust Muted | #C49A8A | — | `--rust-muted` |
| Indigo | #3D4F6F | Ai | `--indigo` |
| Indigo Light | #5A6D8A | — | `--indigo-light` |
| Indigo Muted | #8A9BB5 | — | `--indigo-muted` |

### Semantic Colors
- `--text-primary`: #1A1A1A (var(--ink))
- `--text-secondary`: #3D3D3D (var(--ink-light))
- `--text-muted`: #6B6B6B (var(--stone))
- `--bg-primary`: #FAF8F5 (var(--washi))
- `--bg-secondary`: #F2EFE9 (var(--sand-light))
- `--bg-accent`: #E8E4DE (var(--sand))
- `--border-color`: #E8E4DE (var(--sand))
- `--border-subtle`: #E0DCD6
- `--accent`: #8B5A4A (var(--rust))
- `--accent-secondary`: #7A8B6E (var(--bamboo))

## Typography

### Font Families
| Type | Font Stack | Usage |
|---|---|---|
| **Serif (Primary)** | Noto Serif JP, Hiragino Mincho ProN, Yu Mincho, serif | Body text, headings, main content |
| **Sans (Secondary)** | Zen Kaku Gothic New, Hiragino Sans, sans-serif | Labels, buttons, captions, UI text |
| **Monospace** | monospace | Hex color codes, technical information |

### Font Weights
- **Light** (300): Display headings, large titles (h1)
- **Regular** (400): Body text, section headings (h2, h3), main content
- **Medium** (500): Labels, buttons, small headings, badges
- **SemiBold** (600): Emphasis text within paragraphs
- **Bold** (700): Strong emphasis when needed

### Font Sizes & Usage
| Element | Size | Weight | Letter Spacing |
|---|---|---|---|
| h1 / Display | 64px (clamp) | 300 | 0.05em |
| h2 / Heading 1 | 40px | 400 | 0.03em |
| h3 / Heading 2 | 20px | 500 | 0.02em |
| h4-h6 | 16px | 400 | 0.02em |
| Body / Lead | 16px | 300-400 | 0em |
| Small | 14px | 400 | 0em |
| Label | 12px | 500 | 0.15em |
| Japanese Text | Varies | 300-400 | 0.1em |

### Line Heights
- Headings: 1.3
- Body text: 1.8
- Lead paragraphs: 1.9

## Spacing Scale

Based on tatami mat proportions and the concept of ma (negative space):

| Scale | Pixels | Poetic Name | CSS Variable |
|---|---|---|---|
| 1 | 4px | Hair | `--space-1` |
| 2 | 8px | Breath | `--space-2` |
| 3 | 12px | — | `--space-3` |
| 4 | 16px | Pause | `--space-4` |
| 5 | 24px | Rest | `--space-5` |
| 6 | 32px | Moment | `--space-6` |
| 7 | 48px | Silence | `--space-7` |
| 8 | 64px | Stillness | `--space-8` |
| 9 | 96px | Emptiness | `--space-9` |
| 10 | 128px | — | `--space-10` |
| 11 | 192px | — | `--space-11` |

## Transitions & Animations

- `--transition-slow`: 0.4s cubic-bezier(0.4, 0, 0.2, 1) — Contemplative, graceful animations
- `--transition-base`: 0.3s cubic-bezier(0.4, 0, 0.2, 1) — Default interactions
- `--transition-fast`: 0.15s ease — Quick feedback without harshness

## Border Radius

- `--radius-sm`: 2px — Subtle, almost imperceptible rounding
- `--radius-md`: 4px — Gentle curves
- `--radius-lg`: 8px — Softer, more prominent rounding

## Special Features & Atmospheric Elements

### Washi Paper Texture
- Fixed background overlay using SVG fractal noise pattern
- Opacity: 0.03 (barely perceptible)
- Creates tactile handmade paper feel

### Enso (Zen Circle)
- Imperfect, asymmetrical circle (scale 1, 0.95 on Y-axis)
- Represents enlightenment and wholeness despite imperfection
- Used as visual header accent and card icon

### Brush Stroke Effects
- Gradient underline that fades right (0% to 100% opacity)
- Mimics the natural fade of a brush stroke
- Applied to headings and emphasized text

### Ma (Negative Space)
- Asymmetrical container padding (left: 96px, right: 48px)
- Breathing room in grid layouts (gap: 32px)
- Sparse, intentional element placement
- Demonstrates that emptiness has value

### Decorative Circles & Lines
- Header features two overlapping imperfect circles
- Vertical accent line on left edge
- Dividers with centered dot icon
- All with subtle opacity for restraint

---

*This design system embodies the seven aesthetic principles: Kanso (simplicity), Fukinsei (asymmetry), Shibui (subtle beauty), Shizen (naturalness), Yugen (profound grace), Datsuzoku (freedom), and Seijaku (tranquility).*
