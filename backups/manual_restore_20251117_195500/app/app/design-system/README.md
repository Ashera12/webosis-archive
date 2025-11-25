# Design System — Mini Editorial Suite

This folder contains a compact design system scaffold and three ready-to-use editorial-grade variants.

- `styles.css` — design tokens and CSS variable-based variations `ds-variation-a|b|c`.
- `components/Button.tsx` — small, reusable button component.
- `components/Hero.tsx` — two-column editorial hero that supports variations.
- `variants/VariationA.tsx` — Minimalism mastery.
- `variants/VariationB.tsx` — Design system excellence.
- `variants/VariationC.tsx` — Interaction sophistication.

How to preview locally:

1. Import a variant into a page (example):

```tsx
import VariationA from './design-system/variants/VariationA';
export default function Page(){ return <VariationA /> }
```

2. Or navigate to the component in your dev environment by placing a route that renders one of the variants.

Notes:
- Colors use soft pastels and low saturation.
- Typography is editorial: headings use serif, bodies use Inter (system fallback).
- Motion timing uses a shared easing token `--ds-ease` tuned for 0.18–0.25s.
