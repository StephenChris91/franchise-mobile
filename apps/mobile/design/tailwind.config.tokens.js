/**
 * Franchise Church — Tailwind Config Token Extension
 *
 * Merge this into your existing tailwind.config.js/ts using spread:
 *
 *   import { franchiseTokens } from './docs/design/tailwind.config.tokens'
 *
 *   export default {
 *     ...franchiseTokens,
 *     content: [...],
 *     plugins: [...],
 *   }
 *
 * Works with both the web app (apps/web) and NativeWind (apps/mobile).
 * In NativeWind, import this same file into your tailwind.config.js.
 *
 * Usage examples:
 *   className="bg-page text-ink-primary"
 *   className="text-gold font-serif"
 *   className="bg-gold text-ink-inverse rounded-pill"
 *   className="border border-default"
 */

export const franchiseTokens = {
  darkMode: 'class',
  theme: {
    extend: {

      // ─────────────────────────────────────
      // COLORS
      // ─────────────────────────────────────
      colors: {
        // Backgrounds
        page:     '#0a0807',
        elevated: '#14110f',
        card:     '#1a1614',

        // Ink
        ink: {
          primary:   '#f7f3ec',
          secondary: '#a5a09a',
          muted:     '#6b6661',
          inverse:   '#0a0807',
        },

        // Gold — the signature
        gold: {
          DEFAULT: '#d4a64a',
          bright:  '#e8bc5e',
          deep:    '#a87f2d',
          soft:    'rgba(212, 166, 74, 0.12)',
          glow:    'rgba(212, 166, 74, 0.25)',
        },

        // Cream
        cream: {
          DEFAULT: '#f0e4cf',
          soft:    'rgba(240, 228, 207, 0.08)',
        },

        // Borders
        border: {
          subtle:  'rgba(212, 166, 74, 0.08)',
          default: 'rgba(212, 166, 74, 0.18)',
          strong:  'rgba(212, 166, 74, 0.35)',
          neutral: 'rgba(255, 255, 255, 0.06)',
        },

        // Status
        live:    '#c93a3a',
        success: '#4a9e6b',
      },

      // ─────────────────────────────────────
      // TYPOGRAPHY
      // ─────────────────────────────────────
      fontFamily: {
        serif:  ['Fraunces', 'Georgia', 'serif'],
        sans:   ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },

      fontSize: {
        xs:   ['10px', { lineHeight: '1.4' }],
        sm:   ['12px', { lineHeight: '1.4' }],
        base: ['14px', { lineHeight: '1.55' }],
        md:   ['15px', { lineHeight: '1.55' }],
        lg:   ['18px', { lineHeight: '1.4' }],
        xl:   ['22px', { lineHeight: '1.1' }],
        '2xl':['28px', { lineHeight: '1.1' }],
        '3xl':['36px', { lineHeight: '1.0' }],
        '4xl':['44px', { lineHeight: '1.0' }],
        hero: ['52px', { lineHeight: '1.05' }],
      },

      letterSpacing: {
        tight:   '-0.03em',
        snug:    '-0.02em',
        normal:  '0',
        wide:    '0.05em',
        wider:   '0.1em',
        widest:  '0.2em',
        brand:   '0.4em',  // ALL CAPS labels
        eyebrow: '0.25em', // Section eyebrows
        badge:   '0.06em', // Badge text
      },

      // ─────────────────────────────────────
      // BORDER RADIUS
      // ─────────────────────────────────────
      borderRadius: {
        sm:     '8px',
        md:     '12px',
        lg:     '16px',
        xl:     '20px',
        '2xl':  '24px',
        pill:   '100px',
        phone:  '38px',
        screen: '48px',
      },

      // ─────────────────────────────────────
      // SPACING (extends Tailwind defaults)
      // ─────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '5':   '20px',
        '6':   '24px',
        '18':  '72px',  // Tab bar height
      },

      // ─────────────────────────────────────
      // SHADOWS
      // ─────────────────────────────────────
      boxShadow: {
        card:       '0 1px 3px rgba(0, 0, 0, 0.4)',
        'gold-glow':'0 8px 24px -8px rgba(212, 166, 74, 0.5)',
        phone:      '0 0 0 2px #2a2522, 0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -20px rgba(212,166,74,0.15)',
      },

      // ─────────────────────────────────────
      // BACKGROUND IMAGES (gradients)
      // ─────────────────────────────────────
      backgroundImage: {
        'hero-warm':
          'linear-gradient(135deg, #1a0e05 0%, #4a2a1a 50%, #8b6f3e 100%)',
        'profile-cover':
          'linear-gradient(135deg, #1a0e05 0%, #6b4e1f 40%, #d4a64a 100%)',
        'welcome-glow':
          'radial-gradient(ellipse at 50% 0%, rgba(212, 166, 74, 0.18) 0%, transparent 55%)',
        'avatar-default':
          'linear-gradient(135deg, #5a3a1a 0%, #d4a64a 100%)',
        'avatar-deep':
          'linear-gradient(135deg, #2a1d0a 0%, #6b4e1f 100%)',
        'avatar-warm':
          'linear-gradient(135deg, #8b6f3e 0%, #f0e4cf 100%)',
        'avatar-bronze':
          'linear-gradient(135deg, #4a2a1a 0%, #b8702e 100%)',
        'avatar-amber':
          'linear-gradient(135deg, #6b4e1f 0%, #e8bc5e 100%)',
      },

      // ─────────────────────────────────────
      // HEIGHT — named sizes
      // ─────────────────────────────────────
      height: {
        'status-bar': '44px',
        'tab-bar':    '72px',
        'btn':        '52px',
        'btn-sm':     '36px',
        'icon-btn':   '36px',
        'avatar-sm':  '22px',
        'avatar-md':  '38px',
        'avatar-lg':  '56px',
        'avatar-xl':  '80px',
      },

      width: {
        'icon-btn':   '36px',
        'avatar-sm':  '22px',
        'avatar-md':  '38px',
        'avatar-lg':  '56px',
        'avatar-xl':  '80px',
      },

      // ─────────────────────────────────────
      // ANIMATION
      // ─────────────────────────────────────
      transitionDuration: {
        instant: '80ms',
        fast:    '150ms',
        DEFAULT: '200ms',
        slow:    '350ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)',
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      keyframes: {
        'fc-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(1.3)' },
        },
        'fc-shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'fc-pulse':   'fc-pulse 1.5s ease-in-out infinite',
        'fc-shimmer': 'fc-shimmer 1.5s linear infinite',
      },
    },
  },
}

/**
 * NativeWind-specific additions
 *
 * In apps/mobile/tailwind.config.js, also add these
 * to handle React Native platform differences:
 *
 * theme: {
 *   extend: {
 *     ...franchiseTokens.theme.extend,
 *
 *     // RN uses unitless numbers for some properties
 *     // NativeWind handles px conversion automatically
 *   }
 * }
 */

/**
 * Quick Reference — most used class combinations
 *
 * Screen background:   bg-page
 * Card background:     bg-card
 * Elevated surface:    bg-elevated
 *
 * Body text:           text-ink-primary font-sans text-base
 * Secondary text:      text-ink-secondary text-sm
 * Muted / disabled:    text-ink-muted text-xs
 *
 * Heading:             font-serif text-2xl tracking-snug leading-snug
 * Heading italic em:   italic text-gold
 * Logo wordmark:       font-script text-gold
 * Eyebrow:             font-sans text-xs tracking-eyebrow uppercase text-gold font-bold
 * Section label:       font-sans text-xs tracking-wider uppercase text-ink-muted font-bold
 *
 * Primary button:      bg-gold text-ink-inverse font-bold rounded-pill h-btn shadow-gold-glow
 * Ghost button:        bg-transparent text-ink-primary border border-default rounded-pill h-btn
 *
 * Badge:               bg-gold-soft text-gold border border-subtle rounded text-xs font-bold tracking-badge uppercase
 *
 * Card:                bg-card border border-subtle rounded-lg
 * Card hover:          hover:bg-[#222226]
 *
 * Border default:      border border-default
 * Border subtle:       border border-subtle
 * Divider:             border-b border-neutral
 *
 * Avatar default:      bg-avatar-default rounded-full
 * Avatar deep:         bg-avatar-deep rounded-full
 * Avatar warm:         bg-avatar-warm rounded-full
 *
 * Tab active:          text-gold
 * Tab inactive:        text-ink-muted
 *
 * Prayer italic serif: font-serif italic text-md leading-relaxed
 * Prayer accent bar:   border-l-2 border-gold/50
 *
 * Live badge:          bg-live text-white font-bold text-xs tracking-wider uppercase rounded-pill
 *
 * Gold countdown num:  font-serif text-3xl text-gold tracking-tight
 */
