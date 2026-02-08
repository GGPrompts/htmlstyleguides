# Art Deco Research Brief: Interactive Story

## Style: Art Deco

## Period: The Jazz Age, 1920s America

## Story Concept:
A player navigates the glamorous yet perilous world of a Manhattan speakeasy during Prohibition, from the euphoric height of the Jazz Age in 1925 through the devastating stock market crash of 1929. Choices determine whether the protagonist becomes a legendary jazz performer, a corrupt bootlegger, or a ruined investor—capturing the rise and fall of an era in three acts.

---

## Key Historical Facts

1. **Prohibition Ratified (January 16, 1919)**: The 18th Amendment was ratified when Nebraska became the 36th state to ratify it, officially establishing the federal ban on manufacture, transport, and sale of alcohol.

2. **Volstead Act Enacted (October 28, 1919)**: Congress passed the National Prohibition Act (Volstead Act) as the enforcement mechanism for the 18th Amendment, creating a 13-year experiment that fundamentally altered American nightlife.

3. **Duke Ellington's Rise to Fame (1923)**: Edward Kennedy "Duke" Ellington began leading his orchestra from New York City starting in 1923, eventually becoming the bandleader at the prestigious Cotton Club in Harlem by the mid-1920s.

4. **The Great Gatsby Published (April 10, 1925)**: F. Scott Fitzgerald published his masterwork, establishing himself as the voice of the Jazz Age and immortalizing the era's excess and moral uncertainty on the pages of American literature.

5. **Josephine Baker's Sensation in Paris (September 22, 1925 - 1927)**: The St. Louis-born dancer arrived in France on September 22, 1925, performed her debut at the Théâtre des Champs-Élysées, and by 1927 became Europe's highest-paid entertainer, symbolizing the international reach of Jazz Age culture.

6. **Louis Armstrong's "West End Blues" (August 1928)**: Armstrong recorded this landmark solo trumpet piece with his Hot Five ensemble, establishing the virtuoso soloist as the center of jazz music and popularizing wordless "scat singing" starting with "Heebie Jeebies" in 1926.

7. **Art Deco's International Debut (1925)**: The Exposition Internationale des Arts Décoratifs et Industriels Modernes in Paris in 1925 marked the pinnacle of the Art Deco movement, introducing the world to geometric forms, luxury materials, and streamlined modernism.

8. **Harlem Renaissance Peak Years (1918-1935)**: The cultural movement flourished with African American writers, musicians, and artists creating unprecedented works; Alain Locke termed it a "spiritual coming of age" of Black America, with figures like Langston Hughes, Claude McKay, and Zora Neale Hurston defining an era.

9. **Black Thursday Stock Crash (October 24, 1929)**: A record 12.9 million shares were traded as panic seized Wall Street; the Dow Jones Industrial Average dropped from 305.85 to 230.07 points, representing a catastrophic 25% decline over four business days.

10. **Black Tuesday Crash (October 29, 1929)**: Some 16.4 million shares traded hands as the market fell an additional 12%, marking the absolute nadir of investor confidence and the official beginning of the Great Depression.

11. **Kid Ory's Historic Recording (1922)**: Kid Ory's Original Creole Jazz Band became the first Black jazz band from New Orleans to make commercial recordings, signaling the transition of jazz from regional folk music to national entertainment.

12. **Great Migration Peak Period (1915-1930)**: African Americans fled the oppressive rural South in massive numbers, with many settling in northern cities including Harlem, New Orleans, and Chicago, creating the demographic foundation for the Harlem Renaissance and jazz's explosive growth.

---

## Dramatic Arc

**Setup (Scenes 1-3)**: Player arrives at the speakeasy in 1925 at the height of the Jazz Age; introduced to the glamorous underworld, Prohibition's thrills, and the illicit culture of bootlegging. Encounters musicians, gangsters, investors, and socialites. Stakes are established through dialogue and environmental storytelling.

**Rising Tension (Scenes 4-7)**: Player makes crucial choices regarding relationships, alliances, and moral compromises. Build reputation as musician, criminal, or trader. Witness the intensifying sophistication of speakeasy culture, the wealth accumulation of the era, and the first whispers of economic instability.

**Climax (Scenes 8-10)**: October 1929 arrives. The stock market crashes. The atmosphere shifts from celebration to panic. Player's path converges with historical reality—those invested in the market face ruin, bootleggers face new pressures, and musicians confront an uncertain future for their art form.

**Resolution (Scenes 11-12)**: Multiple endings based on player choices. If jazz musician: legendary status or obscurity. If bootlegger: wealth and danger or prison. If investor: wealth to ruin or redemption. Epilogue reveals the repeal of Prohibition (1933) and the transformation of the era into legend.

---

## Component Mapping

- **Narration**: `.type-body` for prose exposition; `.header p` for contextual scene-setting
- **Exposition**: `.card` elements for historical facts, character backstories, and location descriptions with `.card-title` and `.card-content`
- **Dialogue**: `.input-field` style for character speech blocks, or styled `.type-subheading` for character names preceding dialogue
- **Key Reveals**: `.badge-filled` for important historical facts; `.section-title` for revelations that shift understanding
- **Choices**: `.btn` and `.btn-diamond` for interactive decision points; `.btn-filled` for irreversible choices
- **Facts/Knowledge**: `.badge` (unfilled) for supplementary information players can discover; popup or tooltip style using `.frame` container
- **Transitions**: `.divider` with ornamental `.span` to mark temporal shifts and location changes
- **Atmosphere**: `.pattern-bg` for ambient texture; `.geo-fan` for decorative flourishes; `.shadow-gold` glow effects for emotional emphasis; `.frame` with `.corner-ornaments` for memory/dream sequences

---

## Scene Outline

### Scene 1: "The Golden Door"
**Setting**: The speakeasy's entrance, late night, 1925
**Description**: Player approaches a nondescript brownstone on Manhattan's Lower East Side. A shadow asks for a password. The door opens to reveal the glittering underworld: chandeliers, golden trim, tuxedoed musicians taking the stage. First encounter with opportunity.
**Branching Points**: Apply to work as server/musician/security, or gamble on the stock market tip overheard at the bar.
**Components**: Header, section-title, dialogue, three distinct btn choices

### Scene 2: "The Band and the Bottle"
**Setting**: Behind the bar and on the stage
**Description**: Introduction to key NPCs—the charismatic bandleader (inspired by Duke Ellington), the savage bartender running the operation, the ingénue singer seeking fame. Learn the rules: never ask questions, always watch your back, and never trust a cop.
**Branching Points**: Form close relationship with bandleader, bartender, or singer. Each opens different narrative paths.
**Components**: Cards for character introductions, badges for "rules of the speakeasy," dialogue exchanges

### Scene 3: "Prohibition's Gold"
**Setting**: Speakeasy office, early morning
**Description**: The owner explains the lucrative bootlegging operation. Vast sums flow through the city. Organized crime is business. Everyone is complicit. The player gets a deeper understanding of economic incentives and moral compromise.
**Branching Points**: Accept involvement in distribution network or maintain distance and focus on music/trading.
**Components**: Frame container with corner-ornaments for official feeling, exposition text, btn for major choice

### Scene 4: "The Jazz Ascendant"
**Setting**: Multiple speakeasies across Harlem and Manhattan
**Description**: If pursuing music path: practice sessions, performances, growing reputation. If pursuing crime: first bootlegging runs, close calls with authorities. If pursuing finance: stock tips, investment meetings, wealth accumulation. Time marker: 1926.
**Branching Points**: Maintain ethical lines or cross them for more profit/fame.
**Components**: Card-grid for parallel activity descriptions, section-header for time passage, divider for transitions

### Scene 5: "The Harlem Nights"
**Setting**: Cotton Club and rival establishments
**Description**: Experience the peak of the Harlem Renaissance. Encounter artists and musicians at their height. The city feels invincible. Wealth pours in. (Reference to Louis Armstrong, Josephine Baker's international fame, Langston Hughes's literary success). The story's moment of greatest optimism.
**Branching Points**: Celebrate the culture or remain cynical about its future.
**Components**: Badge-row for cultural achievements, card elements for encounters, type-heading for atmospheric description

### Scene 6: "Gatsby's Dream"
**Setting**: Luxury hotel, exclusive party
**Description**: A lavish party references F. Scott Fitzgerald's novel (published 1925). Meet wealthy traders, socialites, bootleggers, all mingling. Everyone believes the good times are endless. Foreshadowing notes appear—conversations about the market being "too high" or "too risky."
**Branching Points**: Invest heavily in stocks or exercise caution; consolidate criminal operations or exit; cement position in the music world.
**Components**: Frame container for party scene, multiple badge elements for overheard economic "wisdom," button choices for major financial/moral decisions

### Scene 7: "Cracks in the Gold"
**Setting**: Market ticker room, speakeasy back office, rehearsal hall
**Description**: October 1929 approaches. First signs of market trouble. The atmosphere becomes tense. Some characters express nervousness. The golden pattern in the background seems to flicker.
**Branching Points**: Players can begin taking protective actions or remain confident.
**Components**: Divider to mark beginning of Act II, section-title with foreboding language, type-secondary color text for uncertainty

### Scene 8: "Black Tuesday"
**Setting**: The speakeasy on October 29, 1929
**Description**: THE CRASH. The ticker tape falls behind. Fortunes evaporate in hours. Clients who were millionaires arrive as desperate men. Music continues but the mood shifts from celebration to requiem. The bandleader plays a melancholic solo.
**Branching Points**: Help others, save yourself, or respond based on moral choices from earlier scenes.
**Components**: Header with dark gold color emphasis, frame for financial reports, cards showing lives destroyed, badge-filled for critical historical facts

### Scene 9: "Aftermath"
**Setting**: Multiple locations reflecting player's path
**Description**:
- **If Musician**: Clients can no longer afford the speakeasy. Music venues close. But jazz endures. Opportunities emerge in other cities.
- **If Bootlegger**: The crash affects distribution but creates new desperate customers. Greater danger from organized crime and authorities.
- **If Investor**: Ruin or recovery depending on choices; guilt over others' suffering.

**Branching Points**: How to respond to the changed world. Redemption, survival, or revenge?
**Components**: Multiple card-grid scenarios, button choices for next phase of life

### Scene 10: "The Question"
**Setting**: Back room conversation
**Description**: A mentor figure asks: "Was it worth it?" This scene forces the player to confront the meaning of their choices. The glamour is gone. What remains?
**Branching Points**: Idealism vs. pragmatism; nostalgia vs. forward momentum.
**Components**: Section-header with philosophical tone, type-body for extended monologue, input-field style for player's response

### Scene 11: "Repeal and Reflection"
**Setting**: The speakeasy in 1933
**Description**: The 21st Amendment repeals Prohibition (December 5, 1933). The illegal world becomes legal, but loses its mystique. Bonus scene showing the transformation of jazz culture, the evolution of blues and swing, the cultural legacy.
**Branching Points**: No mechanical choices here—a reflective epilogue.
**Components**: Divider to mark final transition, footer-like section for epilogue, type-display for final image

### Scene 12: "Legacy"
**Setting**: Timeless/abstract
**Description**: Final scene shows the historical consequences of the era. Brief references to World War II, Civil Rights movement, the enduring legacy of jazz, the architectural monuments of Art Deco. The story ends not with the character's individual fate but with how they fit into history.
**Branching Points**: Multiple final images based on player's path (musician-turned-legend, bootlegger-turned-legitimate-businessman, investor-turned-philanthropist or recluse, etc.).
**Components**: Footer content, multiple ending cards, final badge statements of historical consequence

---

## CSS Classes Reference

### Structural & Container
- **`.container`**: Main content wrapper with centered max-width (1100px) and padding
- **`.pattern-bg`**: Fixed background with subtle geometric gold crosshatch pattern (45-degree lines at 3% opacity)
- **`.frame`**: Decorative bordered container with double gold borders (outer 1px, inner 1px with 8px offset)
- **`.corner-ornaments`** + **`.corner`** variants (`.corner-tl`, `.corner-tr`, `.corner-bl`, `.corner-br`): Corner accent marks (24px gold borders, partial corners only)

### Header & Footer
- **`.header`**: Centered header with top/bottom gradient lines, padding, and margin-bottom
- **`.header-ornament`**: Decorative symbol text in gold (◇ ◆ ◇), letter-spaced
- **`.footer`**: Bottom section with top gradient line, centered text, small font size
- **`.footer-logo`**: Display-font footer brand mark in gold

### Section Organization
- **`.section`**: Large bottom margin (96px) for content grouping
- **`.section-header`**: Centered header within section
- **`.section-number`**: Large display-font number (3rem) in gold, 30% opacity
- **`.section-title`**: Display-font heading (2.5rem) in gold, uppercase, letter-spaced
- **`.section-line`**: Horizontal accent line with gradient fade (100px wide)

### Typography
- **`.type-display`**: 4rem display font (Poiret One) in gold, letter-spaced
- **`.type-heading`**: 2.5rem display font (Poiret One), letter-spaced
- **`.type-subheading`**: 1.5rem body font (Josefin Sans) weight 400, uppercase, letter-spaced
- **`.type-body`**: 1rem regular text, max 60 characters width, centered
- **`.type-label`**: 0.75rem uppercase label, letter-spaced, gold color
- **`.type-specimen`**: Container for typography samples, centered, bottom border (except last)
- **`.type-scale`**: Flex column container for type specimens with large gap spacing

### Color Swatches
- **`.color-grid`**: Responsive grid (min 180px, auto-fit)
- **`.color-swatch`**: Individual color container with border and inner decorative border
- **`.color-preview`**: 80x80px colored diamond shape (hexagon clip-path)
- **`.color-name`**: Display-font color label (1.25rem)
- **`.color-value`**: Monospace hex code (0.8125rem), secondary text color

### Buttons
- **`.button-grid`**: Flex wrap container, centered, gap spacing
- **`.btn`**: Standard button with transparent background, gold border, uppercase letter-spacing, sliding gold background on hover (pseudo-element animation)
- **`.btn-filled`**: Filled button variant—inverse colors (gold background, black text), reverses on hover
- **`.btn-diamond`**: Diamond-shaped button (hexagon clip-path), adjusted padding
- Button hover effects: smooth color transitions (0.3s ease), pseudo-element slide animation for fill

### Form Elements
- **`.input-grid`**: Responsive grid layout for input groups (min 280px)
- **`.input-group`**: Margin-bottom for spacing between groups
- **`.input-label`**: Small uppercase label in gold
- **`.input-field`**: Full-width text input or textarea, transparent background, gold border, focus box-shadow (gold glow), placeholder text in secondary color

### Cards
- **`.card-grid`**: Responsive grid (min 300px, auto-fit)
- **`.card`**: Bordered container with double border decoration (inner border via pseudo-element), center text, hover shadow effect
- **`.card-icon`**: 2.5rem emoji/symbol
- **`.card-title`**: 1.5rem display-font in gold
- **`.card-content`**: Secondary text color, increased line-height (1.7)

### Badges & Labels
- **`.badge-row`**: Flex wrap container, centered, small gap
- **`.badge`**: Small (0.6875rem), uppercase, letter-spaced, bordered outline style in gold
- **`.badge-filled`**: Solid gold background, black text (inverse)
- **`.badge-diamond`**: Diamond clip-path variant (hexagon)

### Dividers & Ornaments
- **`.divider`**: Flex centered container with horizontal lines (gradient left/right) flanking a centered symbol
- **`.divider span`**: 1.5rem gold symbol within divider
- **`.geo-fan`**: Decorative fan shape (120x60px) made with pseudo-elements, nested arc borders in gold

### Spacing (Reference Only)
- **`.spacing-demo`**: Flex column demo of spacing scale
- **`.spacing-item`**: Row layout showing spacing label and bar
- **`.spacing-label`**: Right-aligned 60px label
- **`.spacing-bar`**: Visual bar with chevron clip-path, gold gradient (dark to light)

---

## Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Gold** | #D4AF37 | Primary accent, borders, text, glow effects |
| **Gold Light** | #F4D03F | Lighter variant, emphasis highlights |
| **Gold Dark** | #A67C00 | Darker variant, depth in gradients |
| **Noir (Black)** | #0D0D0D | Primary background, button fill on hover |
| **Charcoal** | #1A1A1A | Secondary background, subtle depth |
| **Cream** | #F5F0E1 | Primary text color, high contrast on dark |
| **Ivory** | #FFFFF0 | Light background alternative (rarely used) |
| **Teal** | #008080 | Accent/secondary color (accent palette) |
| **Burgundy** | #800020 | Accent/secondary color (accent palette) |

### Special Effects
- **`--shadow-gold`**: `0 0 20px rgba(212, 175, 55, 0.3)` — soft gold glow for focus and hover states
- **`--border-gold`**: `2px solid #D4AF37` — primary border treatment

---

## Fonts

- **Display Font**: `'Poiret One'` (cursive, Google Fonts) — used for headers, section titles, card titles, large display text. Elegant, elongated letterforms evoke 1920s elegance.
- **Body Font**: `'Josefin Sans'` (sans-serif, Google Fonts, weights: 300, 400, 500, 600, 700) — used for body text, subheadings, labels, buttons. Clean, geometric geometric sans with art deco sensibility.
- **Monospace** (system default): Used for color hex codes and technical labels
- **Letter-spacing**: Generous throughout (0.02em base, up to 0.3em in headings) for luxurious, spacious feel
- **Line-height**: 1.6 for body, 1.7 for cards—readable yet airy

---

## Design Philosophy for Story Implementation

The Art Deco style guide emphasizes:
- **Geometric precision**: Use shapes, symmetry, and borders to create visual structure
- **Luxury and restraint**: Gold accents against dark backgrounds convey exclusivity
- **Ornamental elegance**: Corner ornaments, dividers, and decorative elements add sophistication without clutter
- **Clear hierarchy**: Display and body fonts, color contrast, and spacing create intuitive readability

For the interactive story:
- Use **sections** and **dividers** to separate scenes and time periods
- Employ **cards** for character introductions and historical exposition
- Leverage **buttons** with clear labeling for player choices (filled for major decisions, diamond for special/forbidden choices)
- Use **badges** to flag historical facts and "rules of the world"
- Implement **frames** for memory sequences, official documents, or dream scenes
- Apply **color-shift** (subtle teal/burgundy overlays on sections) to indicate mood changes from jubilation to despair
- Use **spacing and typography** to pace information—generous space during exposition, tighter layouts during climactic moments
- Employ the **pattern-bg** as a constant ambient texture, suggesting the omnipresent surveillance and geometric order of the era

The visual language mirrors the story's thematic arc: from geometric precision and golden optimism in scenes 1-5, through ornamental complexity in scenes 6-8, to stripped-down, minimal design in the post-crash world of scenes 9-12.
