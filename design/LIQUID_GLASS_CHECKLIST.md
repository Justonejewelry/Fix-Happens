# Clear Crystal Liquid Glass — Design Checklist

Use this checklist for every new screen, component, or visual change in Fix Happens.

---

## 1. Material & Surface

- [ ] Surface uses translucent white (`rgba(255,255,255,0.12–0.18)`)
- [ ] Backdrop blur is present (target 24px) or has an explicit fallback
- [ ] Thin luminous border is applied (`rgba(255,255,255,0.25–0.36)`)
- [ ] Corner radius follows tokens (28px cards / 24px panels / 999 pills)
- [ ] Soft shadow is present for depth (blur 18–30)
- [ ] Panel feels like floating crystal, not a flat solid block

## 2. Color Discipline

- [ ] Only one accent color is used: `#FF5AA5`
- [ ] Accent is reserved for interactive or high-priority elements
- [ ] Text is white or muted white — no competing hues
- [ ] Background remains a dark gradient field
- [ ] No new brand or secondary accent colors introduced

## 3. Hierarchy & Depth

- [ ] Hierarchy is created through layering and opacity, not extra colors
- [ ] Primary content sits on the strongest / most elevated surface
- [ ] Secondary panels are visually lighter and recessed
- [ ] Active states gain a soft pink glow or accent border
- [ ] Content remains readable over translucent surfaces

## 4. Layout & Spacing

- [ ] Large continuous curves are preserved (no sharp small radii on major surfaces)
- [ ] Consistent spacing is used between glass panels
- [ ] Navigation remains a floating crystal panel
- [ ] Main workspace has clear visual weight
- [ ] Side stacks do not compete with the primary case surface

## 5. Interaction & Motion

- [ ] Transitions stay in the 200–300ms range
- [ ] No animated blur effects
- [ ] Motion remains subtle and precise
- [ ] `prefers-reduced-motion` is respected where possible
- [ ] Focus states are clearly visible even without blur

## 6. Accessibility & Fallbacks

- [ ] Text contrast remains readable on glass surfaces
- [ ] A reduced-transparency / higher-opacity mode exists or is planned
- [ ] A solid surface fallback is available (same radii and spacing)
- [ ] Layout and hierarchy still work when blur is disabled
- [ ] Low-power mode can drop heavy effects without breaking the UI

## 7. Component Integrity

- [ ] New components follow existing patterns (CrystalCard, GlassButton, EvidenceCard, Timeline, etc.)
- [ ] Pills / badges use full-round radius and restrained styling
- [ ] Primary actions use the pink accent treatment
- [ ] Secondary actions stay outline / crystal style
- [ ] No component introduces a second visual language

## 8. Final Gate

- [ ] The screen still feels like one coherent crystal material system
- [ ] Pink accent remains scarce and intentional
- [ ] Nothing relies on blur alone for structure or separation
- [ ] The design supports a calm, technical, field-ready experience

---

**Source of truth:** `design/tokens.json`  
**Related:** `design/components.md` · `design/accessibility.md` · `design/fallbacks.md` · `docs/UI_GUIDELINES.md`
