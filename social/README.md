# Social cards

Compositor for X/social card images in the portfolio's design language
(charcoal ground, Krana-mix product names, Saol italic one-liners,
MICA-yellow index, portfolio URL tag).

- `card.html` — the template. Cards are defined in the `CARDS` array;
  paths to fonts and images are relative to this folder. Add a card,
  bump the `0n / 0n` indexes, done.
- `cards/` — rendered 1600×900 PNGs, ready to attach to a post
  (X shows four images as a 2×2 grid; tap = swipeable carousel).

Render (from repo root):

```bash
chrome --headless --no-sandbox --allow-file-access-from-files \
  --virtual-time-budget=4000 --window-size=1600,900 --hide-scrollbars \
  --screenshot=social/cards/card-1.png "file://$PWD/social/card.html?i=0"
```

Repeat with `?i=1..n` for the rest.
