# SocialNova — Brand Identity System

> **Version**: 1.0 · **Guardian**: Brand Guardian · **Status**: Approved
> **Platform**: Next.js 15 + Tailwind v4 + Framer Motion
> **Theme**: Dark-first with light mode support

---

## 1. Brand Strategy

### Brand Purpose
SocialNova exists to **democratize professional social media management** by giving every creator, solopreneur, and agency access to the same AI-powered tools that Fortune 500 companies use — without the enterprise price tag or complexity.

### Brand Vision
A world where every business, regardless of size, can maintain a consistent, high-quality social media presence that drives real revenue — autonomously.

### Brand Mission
Deliver an AI-powered social media management platform with specialized agents that plan, create, publish, and optimize content across 14+ platforms, all through a simple chat interface.

### Brand Values
1. **Autonomy with Oversight**: AI does the work; humans set the direction. We never remove human judgment.
2. **Revenue Over Vanity**: We optimize for business outcomes, not follower counts. Every feature ties to revenue impact.
3. **Radical Simplicity**: Complex AI should feel simple. If a feature requires a tutorial, we haven't finished building it.
4. **Transparency**: Users see exactly what AI is doing and why. No black boxes, no mystery.
5. **Growth Together**: We grow when our users grow. Their success is our success.

### Brand Personality
- **Helpful**: Nova is a knowledgeable friend, not a corporate assistant
- **Confident**: We know AI social media management works — we prove it daily
- **Approachable**: Enterprise power, startup energy
- **Smart**: We speak with intelligence but never with arrogance
- **Reliable**: 24/7 AI that never sleeps, never forgets, never drops the ball

### Brand Promise
"Your social media runs itself — and you're always in control."

---

## 2. Visual Identity

### Logo System

**Primary Mark**: Capital "S" in a rounded square — the SocialNova identity mark.

| Variant | Spec |
|---------|------|
| **Icon** | 32×32 rounded square, "S" in white on `var(--accent)` |
| **Horizontal** | Icon + "SocialNova" wordmark, gap 8px |
| **Stacked** | Icon centered above "SocialNova" |

**Favicon**: 32×32 canvas, "S" mark at 24×24 centered on `var(--accent)` background.

**Clearspace**: 0.5× mark height on all sides.

**Minimum sizes**: Icon 16×16, Lockup width 100px.

### Color System

#### Primary Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-primary-500` | `#F97316` | Primary brand accent, CTAs, active states |
| `--color-primary-400` | `#FB923C` | Dark mode accent |
| `--color-primary-600` | `#EA580C` | Hover states, emphasis |

#### Neutral Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--color-neutral-50` | `#FAFAF9` | Light mode background |
| `--color-neutral-100` | `#F5F5F4` | Light mode tertiary |
| `--color-neutral-200` | `#E7E5E4` | Light mode borders |
| `--color-neutral-900` | `#292524` | Dark mode surfaces |
| `--color-neutral-950` | `#0C0A09` | Dark mode background |

#### Semantic Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-success` | `#22C55E` | Positive metrics, confirmations |
| `--color-warning` | `#EAB308` | Attention needed, caution |
| `--color-error` | `#EF4444` | Errors, destructive actions |
| `--color-info` | `#3B82F6` | Informational, links |

#### Light/Dark Theme Mapping

| Element | Light | Dark |
|---------|-------|------|
| Background | `var(--color-neutral-50)` | `var(--color-neutral-950)` |
| Surface | `#FFFFFF` | `var(--color-neutral-900)` |
| Border | `var(--color-neutral-200)` | `var(--color-neutral-800)` |
| Primary text | `var(--color-neutral-900)` | `var(--color-neutral-50)` |
| Secondary text | `var(--color-neutral-600)` | `var(--color-neutral-300)` |
| Accent | `var(--color-primary-500)` | `var(--color-primary-400)` |

### Typography

| Role | Font | Weights | Use |
|------|------|---------|-----|
| **Display/Headings** | Plus Jakarta Sans | 600, 700 | H1-H6, Card titles |
| **Body/UI** | Inter | 400, 500, 600 | Paragraphs, labels, buttons |
| **Data/Numbers** | System mono | 400, 500 | Stats, metrics, timestamps |

**Scale**:
- Display: 48px / 700 / -0.01em
- H1: 36px / 700
- H2: 30px / 600
- H3: 24px / 600
- H4: 20px / 600
- Body: 14px / 400
- Caption: 12px / 400

### Spacing & Layout

**Base unit**: 4px

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

**Border radius**: `rounded-lg` (8px) default, `rounded-xl` (12px) for cards, `rounded-full` for pills.

### Component Specifications

#### Buttons
- **Primary**: `var(--accent)` bg, white text, 8px radius
- **Secondary**: Transparent bg, border `var(--border-default)`, 8px radius
- **Ghost**: Transparent, hover `var(--bg-tertiary)`
- **Danger**: `#EF4444` bg, white text

#### Cards
- Background: `var(--bg-secondary)`
- Border: 1px `var(--border-default)`
- Radius: 12px
- Padding: 24px
- Shadow: none (hover: subtle shadow)

#### Inputs
- Height: 40px
- Border: 1px `var(--border-default)`
- Radius: 8px
- Focus ring: 2px `var(--accent)` with 2px offset

---

## 3. Brand Voice

### Voice Characteristics
- **Helpful**: Always ready to assist, never condescending
- **Confident**: We know our product works — we show, don't tell
- **Concise**: Short sentences, clear language, no jargon
- **Warm**: Friendly but professional — like a knowledgeable colleague

### Tone by Context
- **Onboarding**: Encouraging, step-by-step, celebrates small wins
- **Dashboard**: Informative, data-forward, actionable
- **Chat with Nova**: Conversational, helpful, slightly playful
- **Error states**: Apologetic but solution-oriented
- **Marketing**: Aspirational, proof-driven, confidence-building

### Naming Conventions
- **Product**: SocialNova (always capitalized)
- **AI Assistant**: Nova (always capitalized, she/her)
- **AI Agents**: Always "agents" lowercase, capitalized names (Creator Agent, Timing Agent)
- **Features**: Sentence case for UI labels, Title Case for navigation

### Example Copy

| Context | On-brand | Off-brand |
|---------|----------|-----------|
| Dashboard greeting | "Good afternoon, Sarah. Your engagement rate is up 12% this week." | "Hey there! Welcome back! 😊" |
| Empty state | "No posts yet. Let's create your first one." | "Oops! Nothing here! Try adding something!" |
| Error | "Something went wrong. We're on it." | "Sorry for the inconvenience!" |
| CTA | "Start creating" | "Click here to get started!!!" |

---

## 4. Accessibility Requirements

- **Contrast**: All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Focus**: 2px outline `var(--accent)` on all interactive elements
- **Touch targets**: Minimum 44×44px for all interactive elements
- **Motion**: Respect `prefers-reduced-motion: reduce`
- **Screen readers**: All images have alt text, all buttons have aria-labels
- **Keyboard navigation**: Full keyboard access to all features

---

## 5. Brand Protection

### Trademark Usage
- SocialNova: Always two words, both capitalized
- Nova: Always capitalized, she/her pronouns
- Never modify the logo mark or wordmark colors

### Brand Monitoring
- Track brand mentions across social platforms
- Monitor competitor usage of similar naming
- Quarterly brand consistency audits

### Crisis Protocol
- Unified response through designated spokesperson
- Pre-approved response templates for common issues
- Escalation path: Support → Marketing → CEO

---

*This document is the source of truth for SocialNova's brand identity. All product, marketing, and communication materials must align with these specifications.*

---

**Brand Guardian**: SocialNova Brand Guardian
**Date**: August 2026
**Status**: Active — All teams reference this document
