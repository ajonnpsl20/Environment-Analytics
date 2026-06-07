---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Anthropic — sourced from anthropics/claude-code (plugins/frontend-design). See https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a clear aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an intentional direction: brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this memorable? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive, characterful choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML; use the Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) beats scattered micro-interactions. Use scroll-triggering and surprising hover states.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the aesthetic — gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, grain overlays.

NEVER use generic AI-generated aesthetics: overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (especially purple gradients on white), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: don't hold back — commit fully to a distinctive vision.

---

## EnviroHub application note

For EnviroHub (a UK enterprise environmental-compliance SaaS pitched to sustainability leads), apply the **refined / professional** end of this spectrum, not maximalism:
- Trustworthy, data-dense, confident enterprise aesthetic — clean tables, clear hierarchy, generous-but-efficient spacing.
- A cohesive brand identity rooted in an environmental palette (deep greens / slate-teal) with a single sharp accent — explicitly NOT purple-on-white, NOT default shadcn slate-only.
- A distinctive but legible type pairing (characterful display for headings, highly-readable body/numerics for tables).
- Restraint over flourish: subtle motion on page/load and state changes; strong empty/loading/error states; full responsiveness. The polish is in precision, not effects.
