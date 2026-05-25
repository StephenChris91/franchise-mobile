# Franchise Design System

> Gold on warm black. Editorial serif. Rejoicing forever.

This folder is the source of truth for all visual decisions across the Franchise Church web app and mobile app. Both codebases consume the same tokens — consistency is guaranteed.

---

## Files

| File | Purpose |
|------|---------|
| `mobile-mockups.html` | Interactive HTML reference — open in browser to see all 9 screens |
| `design-tokens.json` | Machine-readable token definitions with descriptions |
| `design-tokens.css` | Same tokens as CSS custom properties for the web app |
| `tailwind.config.tokens.js` | Tailwind/NativeWind extension — import into both apps |
| `screens/` | PNG screenshots of each target screen (for Claude Code vision) |

---

## Brand Identity

### Color palette

| Role | Value | Usage |
|------|-------|-------|
| **Gold** | `#d4a64a` | Primary accent — buttons, active states, badges, CTAs |
| **Gold Bright** | `#e8bc5e` | Gradients, highlights |
| **Gold Deep** | `#a87f2d` | Labels on dark, decorative |
| **Black canvas** | `#0a0807` | Screen background — warm black, not cool grey |
| **Card** | `#1a1614` | Cards, list items |
| **Ink Primary** | `#f7f3ec` | Body text — warm white |
| **Cream** | `#f0e4cf` | Warm secondary accent |
| **Live Red** | `#c93a3a` | LIVE badge only — universal convention |

> **Rule:** Blue is not part of this brand. Any blue in a codebase is a mistake.

### Typography

| Role | Font | Notes |
|------|------|-------|
| **Logo wordmark** | Dancing Script 700 | Gold colour only. Never used for headings or body. |
| **Editorial headings** | Fraunces | Italic variants carry brand emphasis (`<em>` = gold italic) |
| **Body / UI** | Inter | All buttons, labels, metadata, body copy |

### Logo treatment
```
font-family: 'Dancing Script', cursive;
font-weight: 700;
color: #d4a64a;
```
The sub-label ("Church") appears beneath in:
```
font-family: Inter;
font-size: 9-10px;
letter-spacing: 0.4em;
text-transform: uppercase;
color: #a87f2d;
```

### Gradients

All gradients flow black → bronze → gold (never cold tones):
- **Hero backgrounds:** `linear-gradient(135deg, #1a0e05 0%, #4a2a1a 50%, #8b6f3e 100%)`
- **Profile cover:** `linear-gradient(135deg, #1a0e05 0%, #6b4e1f 40%, #d4a64a 100%)`
- **Avatars:** 5 variants, all warm-toned (see tokens for each)

### Italic emphasis

In headlines and pull quotes, key faith-laden words receive italic serif treatment in gold:
```jsx
<h1 className="font-serif text-3xl tracking-snug">
  A generation, <em className="italic text-gold font-normal">awakened</em> to eternity.
</h1>
```
Words that typically get this treatment: *awakened*, *gather*, *carry*, *hope*, *together*, service names like *The Unshakeable*.

---

## Component Patterns

### Buttons
```jsx
// Primary
<button className="bg-gold text-ink-inverse font-bold rounded-pill h-btn shadow-gold-glow px-5">
  Join the Service
</button>

// Ghost
<button className="bg-transparent text-ink-primary border border-default rounded-pill h-btn px-5">
  I have an account
</button>
```

### Role badges
```jsx
<span className="bg-gold-soft text-gold border border-subtle rounded text-xs font-bold tracking-badge uppercase px-1.5 py-0.5">
  Pastor
</span>
```

### Prayer card accent
```jsx
<div className="border-l-2 border-gold/50 pl-4">
  <p className="font-serif italic text-md leading-relaxed text-ink-primary">
    Prayer request content here...
  </p>
</div>
```

### Eyebrow label (above headings)
```jsx
<p className="font-sans text-xs tracking-eyebrow uppercase text-gold font-bold mb-2">
  The Prayer Wall
</p>
```

### Section title (list headers)
```jsx
<p className="font-sans text-xs tracking-wider uppercase text-ink-muted font-bold">
  This Week
</p>
```

### LIVE badge
```jsx
<span className="flex items-center gap-1.5 bg-live text-white font-bold text-xs tracking-wider uppercase rounded-pill px-3 py-1.5">
  <span className="w-1.5 h-1.5 bg-white rounded-full animate-fc-pulse" />
  Live Now
</span>
```

### Tab bar active indicator
```jsx
// Active tab: text-gold with a 4px gold dot 12px above
// Inactive tab: text-ink-muted
```

### Countdown numbers
```jsx
<span className="font-serif text-3xl text-gold tracking-tight tabular-nums">
  02
</span>
<span className="font-sans text-xs tracking-widest uppercase text-ink-muted font-bold mt-1.5">
  Days
</span>
```

---

## Using with Claude Code

### Starting a phase prompt
> "Before writing any code, read `docs/design/design-tokens.json` for the complete color, font, and radius system. Read `docs/design/tailwind.config.tokens.js` and merge it into the app's tailwind config. When building [screen name], reference `docs/design/screens/[N]-[name].png` for the target layout."

### Key rules to enforce
1. **No blue.** The brand uses gold, not blue.
2. **Warm blacks only.** Use `#0a0807` for backgrounds, not `#000000` or grey-based darks.
3. **Italic gold for editorial emphasis.** `<em>` inside Fraunces headings = gold italic.
4. **Logo font is script only.** Dancing Script only appears in the wordmark — never in headings or body.
5. **Avatars use warm gradients.** Never cool-toned (blue/purple/green) for user avatars.
6. **Gold is the primary action color.** All primary buttons, active tabs, and key interactive states use `#d4a64a`.
7. **Red is for LIVE only.** No red anywhere except the LIVE badge.

---

## Screen inventory

| # | Screen | Tab | Key component |
|---|--------|-----|---------------|
| 01 | Welcome | — | Script logo, gold CTA |
| 02 | Feed | Feed | Post cards, group pills |
| 03 | Prayer Wall | Prayer | Italic serif, prayer accent bar |
| 04 | Event Detail | — | Hero gradient, gold RSVP |
| 05 | Composer | — | Post type selector |
| 06 | Profile | Profile | Cover gradient, gold stats |
| 07 | Live & Gather Hub | Live | Hero live card, service list |
| 08 | In-App Live Player | Live | YouTube embed, live chat |
| 09 | Friday Prayer Zoom Lobby | Live | Countdown, joining section |
