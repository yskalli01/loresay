---
name: quiet-workspace-design-system
source: derived
character: "A calm, private workspace for collecting knowledge and asking grounded questions. The visual language is light, compact, and trustworthy, with layered surfaces, crisp borders, and a restrained blue accent reserved for primary actions, active navigation, and page emphasis."
tokens: "Real values live in src/app/globals.css. Read tokens there and do not duplicate them here."
contrast: "body on canvas 8.7:1, ink on canvas 15.5:1, muted on canvas 5.0:1, on accent 6.9:1, focus on canvas 4.6:1. This slice ships light mode only, with token names ready for a later dark mode."
---

## Build mandate

Every page ships as a complete product surface, not a bare widget. Use the app shell, real product copy, clear hierarchy, and visible loading, empty, and error states. The first screen should feel like a working knowledge workspace even while data is placeholder backed.

## Character and direction

Use a quiet professional tone. Favor legible density, neutral panels, small precise controls, and useful status language. Layer the canvas, sidebar, page headers, and cards so the workspace has depth without becoming decorative. The accent should point to the next meaningful action, never decorate the page.

## Composition patterns

Authenticated product pages use a desktop sidebar beside a main workspace. Mobile uses a top bar with a disclosure menu. Main pages open with a concise elevated header, then a dashboard grid or work surface with cards, tables, and state panels. Keep repeated content scannable and avoid marketing style hero sections inside the app.

## Component and usage rules

Use cards for individual repeated items and compact panels only. Do not nest cards inside cards. Buttons use icons when the command benefits from one, and icon only buttons need accessible names. Tables are for comparison and recent activity, while source cards are for quick object recognition. Status badges pair color with text.

## Responsive and accessibility direction

Mobile should stack panels into a single column and keep every control at least 44px tall. Desktop can use denser rows and side by side panels. Use semantic landmarks, persistent labels, visible focus rings, and native interactive elements before ARIA.
