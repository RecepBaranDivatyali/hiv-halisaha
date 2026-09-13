# Design System Strategy: Kinetic Noir

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"Kinetic Noir."** 

In a saturated market of generic sports trackers, this system rejects the "flat and static" grid. Instead, it captures the raw energy of a stadium under floodlights. We achieve this through a high-contrast interplay between an impenetrable charcoal base and "hyper-luminescent" accents. The layout is driven by **Intentional Asymmetry**—using oversized typography and overlapping "shards" of color to create a sense of forward motion. We aren't just displaying data; we are visualizing momentum.

## 2. Colors & Tonal Depth
The palette is engineered for high-performance readability in low-light environments.

### The Palette
- **Core Base:** `surface` (#0e0e0e) provides the "pitch black" foundation.
- **Primary Kinetic:** `primary` (#8eff71) is our neon green, reserved for primary actions and "active" states.
- **Secondary Flow:** `secondary` (#6e9bff) is our electric blue, used for data visualization and navigational anchors.
- **Error/Alert:** `error` (#ff7351) provides a high-visibility contrast against the cool-toned base.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through **Background Shift**. To separate a live match card from the feed, place a `surface-container-low` (#131313) card onto a `surface` (#0e0e0e) background. The contrast is felt, not seen.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of carbon-fiber sheets:
1.  **Level 0 (Base):** `surface` (#0e0e0e) - The deep background.
2.  **Level 1 (Sections):** `surface-container-low` (#131313) - Large content areas.
3.  **Level 2 (Cards):** `surface-container-highest` (#262626) - Individual interactable units.
4.  **Level 3 (Pop-overs):** `surface-bright` (#2c2c2c) - Modals and floating menus.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "heavy," use **Glassmorphism** for floating headers. Apply a 20% opacity to your `surface-variant` with a 16px backdrop-blur. 
**Signature Gradients:** Use a linear gradient (Top-Left to Bottom-Right) from `primary` (#8eff71) to `primary-container` (#2ff801) on hero CTA buttons to simulate a glowing light source.

## 3. Typography
We utilize a dual-typeface system to balance "Athletic Aggression" with "Editorial Precision."

- **The Voice (Lexend):** Used for `display`, `headline`, and `label` roles. Lexend’s geometric clarity provides an "at-a-glance" speed necessary for sports.
    - *Usage:* `display-lg` (3.5rem) should be used for scores and big-moment headlines, often overlapping background elements to create depth.
- **The Data (Manrope):** Used for `title` and `body` roles. Manrope offers superior legibility for long-form player stats and news articles.
    - *Hierarchy Note:* Always pair a `headline-sm` (Lexend) with a `body-md` (Manrope) to create a distinct "header-to-content" texture.

## 4. Elevation & Depth
In "Kinetic Noir," depth is an atmospheric effect, not a structural one.

### The Layering Principle
Avoid "Drop Shadows" in the traditional sense. Instead, use **Tonal Layering**. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a natural "recessed" look. 

### Ambient Shadows
If an element must "float" (e.g., a Floating Action Button), use an **Ambient Shadow**:
- **Color:** `on-background` at 6% opacity.
- **Blur:** 24px to 32px.
- **Spread:** -4px.
This creates a subtle "glow" rather than a harsh black shadow.

### The "Ghost Border" Fallback
If contrast testing fails for accessibility, use a **Ghost Border**: a 1px stroke using `outline-variant` (#484847) at 15% opacity. Never use 100% opaque outlines.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`). `DEFAULT` (0.25rem) rounded corners. Text is `on-primary-fixed` (#064200) for maximum punch.
- **Secondary:** Surface-only. `outline` (#767575) Ghost Border with `on-surface` text.
- **Tertiary:** No container. Underlined `label-md` using `secondary` (#6e9bff).

### Kinetic Cards
Forbid the use of divider lines. Separate content using `Spacing Scale 4` (1rem) and `surface-container` shifts. For live scores, use a `primary` (#8eff71) vertical accent bar (4px wide) on the left edge to indicate "Active" status.

### Input Fields
- **Background:** `surface-container-highest` (#262626).
- **Active State:** Change Ghost Border to 40% opacity `primary` (#8eff71).
- **Typography:** Placeholder text must be `on-surface-variant` (#adaaaa).

### Progress & Stat Bars
Use a "Dual-Track" system: The track is `surface-variant` (#262626) and the progress fill is a gradient of `secondary` (#6e9bff) to `tertiary` (#88f6ff). This creates a "Neon Tube" effect.

### Selection Chips
Roundedness `full` (9999px). Unselected: `surface-container-high` background. Selected: `primary` background with `on-primary` text.

## 6. Do's and Don'ts

### Do:
- **Use "Scale as Contrast":** Make scores huge. Use `display-lg` for 2-digit numbers.
- **Embrace Negative Space:** Use `Spacing Scale 10` (2.5rem) between major sections to let the "Noir" background breathe.
- **Apply Motion:** Elements should slide in from the right (momentum) rather than fading in place.

### Don't:
- **Don't use Grey:** If you need a "grey," use a desaturated version of `secondary` or `outline-variant`. Pure greys feel "dead" in this system.
- **Don't use Dividers:** Never use a horizontal line to separate list items. Use a `1px` shift in surface color or `Spacing Scale 2`.
- **Don't Over-Round:** Keep corners to `DEFAULT` (0.25rem) or `md` (0.375rem). Too much rounding (xl/24px) loses the "aggressive" athletic edge.