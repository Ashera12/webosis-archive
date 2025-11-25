# Response Formatting Options

## Overview
Both Vision (`/api/ai/vision`) and Chat (`/api/ai/chat`) endpoints support consistent cleaning of AI output:
- Removes all markdown bold (**text**) and italics *text*
- Normalizes bullets to `•`
- Collapses >2 blank lines
- Converts (Benar)/(Salah) to ✓ / ✗
- Eliminates stray leading asterisks

## Optional Emphasis
Use `"emphasis": true` in request body to apply light highlighting:
- Uppercases simple section headers ending with `:` (e.g. `Detail:` → `DETAIL:`)
- Leaves content body plain (no bold reintroduction) to maintain clarity

## Vision Request Example
```jsonc
{
  "image": "data:image/jpeg;base64,...",
  "question": "Analisis gambar ini",
  "provider": "auto",
  "structured": true,
  "emphasis": true
}
```

## Chat Request Example
```jsonc
{
  "history": [
    { "role": "system", "content": "You are an OSIS assistant." },
    { "role": "user", "content": "Tolong jelaskan struktur organisasi." }
  ],
  "emphasis": true
}
```

## Returned Fields
- Vision: `result` (string) or `items[].raw` (multi/structured) already cleaned
- Chat: `reply` cleaned; includes `historyEnabled` and `resetApplied` flags if history mode

## Design Rationale
We avoid reintroducing markdown bold to maintain consistent plain-text rendering across varied chat clients. Emphasis uses uppercase headers—accessible, parsable, and resistant to model over-formatting.

## Extensibility
Future possible flags:
- `emphasisStyle: "caps" | "none" | "marker"` (prepend ▶ to headers)
- `includeFacesStructured: true` (populate per-face arrays)

Last Updated: 2025-11-21
