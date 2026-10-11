---
name: image-based-knowledge-design-system
source: image
character: "A modern, private knowledge workspace with a crisp white canvas, soft blue neutral surfaces, rounded icon tiles, and a confident indigo accent. The system should feel clear, focused, and powerful without becoming loud: generous cards, precise borders, compact controls, and semantic color used only when the state matters."
tokens: "Real values live in src/app/globals.css. Read tokens there and do not duplicate them here."
contrast: "This slice ships light mode only. Maintain WCAG AA contrast for text, focus, borders, and semantic states while preserving the image driven indigo accent and soft neutral surface system."
---

## Build mandate

Every page ships as a complete product surface, not a bare widget. Use the app shell, real product copy, clear hierarchy, and visible loading, empty, and error states. The first screen should feel like a working AI Personal Knowledge Base with a polished design system underneath it.

## Character and direction

Use a clear professional tone. Favor legible density, white and pale blue surfaces, small precise controls, and useful status language. Layer the canvas, sidebar, page headers, and cards with soft shadows and crisp borders. The indigo accent should point to the next meaningful action, active navigation, selected states, and focus, never decorate the page without purpose.

## Composition patterns

Authenticated product pages use a desktop sidebar beside a main workspace. Mobile uses a top bar with a disclosure menu. Main pages open with a concise elevated header, then a dashboard grid or work surface with cards, tables, and state panels. Brand marks use the open book symbol language from the design sheet. Keep repeated content scannable and avoid marketing style hero sections inside the app.

## Component and usage rules

Use cards for individual repeated items and compact panels only. Do not nest cards inside cards. Cards use 8px radius, pale borders, and soft elevation. Buttons use icons when the command benefits from one, and icon only buttons need accessible names. Tables are for comparison and recent activity, while source cards are for quick object recognition. Status badges pair color with text. Inputs, search fields, selects, toggles, and radio controls must show default, hover, focus, selected, invalid, and disabled states.

## Responsive and accessibility direction

Mobile should stack panels into a single column and keep every control at least 44px tall. Desktop can use denser rows and side by side panels. Use semantic landmarks, persistent labels, visible focus rings, and native interactive elements before ARIA.
