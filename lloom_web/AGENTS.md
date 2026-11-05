<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LLooM Web — Agent Instructions

## 1. Project Overview

LLooM Web is a web-based frontend for LLooM (Language Model-based Concept Induction), a tool for discovering, defining, and analyzing concepts in collections of text documents.

The frontend provides a graphical interface for managing projects, uploading and exploring datasets, generating concepts, and reviewing analysis results.

This file defines conventions for AI coding agents contributing to the frontend. Human contributors should follow the same conventions where applicable.

**Scope:** These instructions apply to the `lloom_web/` directory and its descendants. Do not apply frontend-specific conventions to the Python backend.

## 2. Technology Stack

The frontend uses:

- **Framework:** Next.js 16 with the App Router
- **UI library:** React 19
- **Language:** TypeScript with strict mode enabled
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React, with custom SVG components when necessary
- **Typography:** Roboto, loaded through `next/font/google`
- **Code quality:** ESLint, TypeScript, and Prettier
- **Package manager:** npm

Prefer the existing technology stack. Do not introduce additional frameworks, UI component libraries, state management libraries, or other dependencies without a clear technical justification.

## 3. Project Structure

The frontend follows the Next.js App Router structure.

```text
lloom_web/
├── AGENTS.md
├── public/                 # Static assets
├── src/
│   ├── app/                # Routes, layouts, and global styles
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/         # Reusable React components
│       └── icons/          # Custom SVG icon components
├── eslint.config.mjs
├── tsconfig.json
├── package.json
└── .prettierrc.json
```

### Architecture Guidelines

- Use the Next.js App Router for routing and page composition.
- Place route-specific pages and layouts under `src/app/`.
- Place reusable UI components under `src/components/`.
- Place custom SVG icon components under `src/components/icons/`.
- Keep components focused on a clear responsibility.
- Extract reusable components when doing so improves readability, reuse, or maintainability.
- Avoid unnecessary abstraction or excessive component fragmentation.
- Reuse existing components before creating new ones.
- Use the `@/` import alias for imports from `src/` when appropriate.
- Follow established project patterns unless there is a compelling reason to change them.

As the application grows, new directories may be introduced for shared types, utilities, hooks, or other concerns. Prefer structures that reflect actual needs rather than speculative future requirements.

## 4. TypeScript and React Conventions

### TypeScript

- Write all new application code in TypeScript (`.ts` or `.tsx`).
- Maintain compatibility with TypeScript strict mode.
- Define appropriate types for component props, function parameters, and data structures.
- Prefer type inference when the inferred type is clear.
- Avoid `any`. Use `unknown` and narrow the type when handling uncertain data.
- Do not suppress TypeScript or ESLint errors merely to make checks pass.
- Use `import type` for imports used exclusively as types.
- Avoid unused imports, variables, and parameters.
- Do not introduce unnecessary type assertions or non-null assertions.

### React

- Use functional React components.
- Name React components using PascalCase.
- Use camelCase for variables, functions, and props.
- Use descriptive names that reflect each component's responsibility.
- Prefer declarative React patterns over direct DOM manipulation.
- Keep state as local as practical; lift state when multiple components genuinely need to share it.
- Avoid unnecessary state when a value can be derived from existing props or state.
- Use React hooks according to the Rules of Hooks.
- Use stable, unique keys when rendering collections.
- Avoid premature memoization or performance optimizations without a demonstrated need.

### Server and Client Components

Next.js App Router components are Server Components by default.

- Prefer Server Components when client-side interactivity is unnecessary.
- Add `"use client"` only when a component requires client-side state, event handlers, browser APIs, or client-only hooks.
- Keep client component boundaries as narrow as practical.
- Do not convert entire pages or layouts into Client Components merely to support a small interactive element.

## 5. Styling and Design System

### Primary Design Reference

The frontend follows the LLooM Web Figma design:

https://www.figma.com/design/ZD63PswmLrGbgtIn4OulsL/LLooM-Web-UI-Design

When implementing or significantly modifying a designed page:

1. Inspect the corresponding Figma frame using the Figma MCP integration when available.
2. Use Figma as the primary visual reference for layout, spacing, dimensions, and component appearance.
3. Compare the design with existing implementations to preserve application-wide consistency.
4. If Figma is inaccessible or a design detail is ambiguous, consult existing components and request clarification rather than inventing major UI elements.

Figma access may require each contributor to configure their own integration and permissions.

The Figma design is the reference for intended visual appearance. The existing codebase is the reference for established implementation patterns and shared design tokens.

### Tailwind CSS

- Use Tailwind CSS v4 utility classes for component styling.
- Prefer Tailwind utilities over component-specific CSS files.
- Use `src/app/globals.css` for global styles, theme definitions, and shared design tokens.
- Avoid inline styles when equivalent Tailwind utilities exist.
- Avoid introducing CSS-in-JS libraries or additional styling frameworks.
- Keep Tailwind class names readable and organized consistently with existing components.

### Semantic Design Tokens

The application defines semantic colors in `src/app/globals.css`.

Prefer existing semantic utilities, including:

- `bg-page` — application page background
- `bg-surface` — cards, panels, and other surfaces
- `bg-surface-subtle` — subtle surface variations
- `text-content` — primary text
- `text-content-secondary` — secondary text
- `text-content-placeholder` — placeholder text
- `border-outline` — borders and separators
- `bg-primary` and `text-primary` — primary accent color
- `text-on-primary` — text displayed on primary-colored surfaces

Additional semantic tokens are available in `globals.css`.

**Do not introduce hardcoded colors when an appropriate semantic token already exists.**

If a new semantic color is genuinely needed, define it centrally rather than repeating arbitrary color values throughout the application.

Preserve compatibility with the existing theme variables, including dark-mode definitions. Avoid styling choices that would prevent components from supporting alternate themes.

### Typography

- Use Roboto as the application font.
- Use the existing font configuration in `src/app/layout.tsx`.
- Maintain consistent font sizes, weights, and text hierarchy.
- Prefer established Tailwind typography utilities.
- Avoid introducing additional fonts without a design requirement.

### Components and Icons

- Preserve the application's established visual language, including rounded controls, consistent spacing, subtle borders, and restrained use of color.
- Use Lucide React for standard icons.
- Prefer existing custom SVG components when a specific icon has already been implemented.
- Create custom SVG components when necessary to match an approved design.
- Keep icon sizing, stroke weight, and alignment consistent with surrounding elements.
- Do not introduce emoji as substitutes for interface icons.

## 6. Responsive Design

The application is primarily intended for desktop use but must remain usable on smaller screens.

- Follow the desktop Figma design while implementing appropriate responsive behavior.
- Use Tailwind's responsive utilities rather than maintaining separate desktop and mobile implementations where avoidable.
- Prefer flexible layouts using Flexbox and CSS Grid.
- Avoid fixed widths that cause horizontal overflow.
- Use `min-w-0`, flexible sizing, and responsive breakpoints where appropriate.
- Ensure text, buttons, navigation, and other controls remain usable on narrow viewports.
- Preserve the intended visual hierarchy when layouts change between screen sizes.
- Do not assume that a desktop Figma frame specifies every mobile interaction or layout decision.

When modifying a responsive component, verify that the change does not unintentionally break other viewport sizes.

## 7. Accessibility

Use semantic HTML and established accessibility practices.

- Prefer native HTML elements such as `button`, `input`, `nav`, `main`, and `section`.
- Use actual buttons for actions and links for navigation.
- Give icon-only buttons accessible names using `aria-label` or equivalent mechanisms.
- Ensure form controls have accessible labels.
- Maintain logical heading hierarchy.
- Support keyboard navigation and visible focus states.
- Avoid relying exclusively on color to communicate meaning.
- Use appropriate alternative text for meaningful images.
- Mark purely decorative icons and images as hidden from assistive technology when appropriate.
- Avoid unnecessary ARIA attributes when native HTML semantics already provide the required behavior.

Accessibility should be considered during implementation rather than added as an afterthought.

## 8. Data and Application Behavior

- Keep mock data clearly distinguishable from production data.
- Do not introduce hardcoded production data into reusable UI components.
- Use typed interfaces or type aliases for application data structures.
- Separate presentation logic from data fetching and business logic where practical.
- Do not invent backend endpoints, response schemas, or integration behavior.
- Consult existing API contracts or backend implementations before connecting frontend functionality.
- Handle loading, empty, and error states where relevant.
- Do not silently replace working functionality with placeholders.

When backend functionality is unavailable, implement only the requested frontend behavior and clearly identify any remaining integration work.

## 9. Dependencies and Scope

### Dependencies

Before adding a dependency:

1. Check whether the functionality is already provided by the existing stack.
2. Prefer established project dependencies and native browser capabilities.
3. Consider the dependency's maintenance cost and impact on bundle size.
4. Explain the justification for significant new dependencies.

Do not install dependencies solely for functionality that can be implemented simply using existing tools.

### Scope of Changes

- Make focused changes that directly address the requested task.
- Preserve existing behavior unless a change is explicitly required.
- Avoid unrelated refactoring, renaming, or formatting changes.
- Do not restructure working components without a clear benefit.
- Do not modify backend code unless the task requires it.
- Avoid adding speculative features or abstractions.
- Do not overwrite unrelated changes made by other contributors.
- Ask for clarification when requirements are ambiguous and the decision would significantly affect functionality or architecture.

Prefer incremental, reviewable changes over large rewrites.

## 10. Development Workflow

Run commands from the `lloom_web/` directory.

### Development Server

```bash
npm run dev
```

### Code Quality Checks

```bash
npm run lint
npm run typecheck
npm run format:check
```

Run all three checks together using:

```bash
npm run check
```

### Formatting

Format source files using:

```bash
npm run format
```

Formatting is governed by `.prettierrc.json`.

Do not manually introduce formatting conventions that conflict with Prettier.

### Production Build

```bash
npm run build
```

### Before Completing a Task

1. Review the relevant existing components and project conventions.
2. Implement the requested change with minimal unrelated modifications.
3. Verify the affected functionality and responsive layouts when applicable.
4. Run `npm run check`.
5. Run `npm run build` when appropriate, especially before a pull request.
6. Review the final diff for unintended changes.

Do not claim that checks or tests passed unless they were actually executed successfully.

If validation cannot be completed, clearly state what was not verified and why.

## 11. Communication and Documentation

When completing a coding task:

- Summarize the changes made.
- Identify significant implementation decisions.
- Mention any new dependencies or configuration changes.
- Report the results of validation commands.
- Identify incomplete functionality, known limitations, or follow-up work.
- Keep explanations concise and relevant to the task.

Update relevant documentation when introducing significant architectural changes or new development conventions.

Do not modify `AGENTS.md` merely to justify a deviation from established project conventions.

## 12. Guiding Principles

When making implementation decisions, prioritize:

1. **Correctness:** The application should behave as intended.
2. **Design consistency:** New UI should match the established LLooM design system.
3. **Maintainability:** Code should be readable, typed, and appropriately organized.
4. **Accessibility:** Interfaces should be usable with standard assistive technologies and keyboard navigation.
5. **Responsiveness:** Layouts should remain usable across supported viewport sizes.
6. **Simplicity:** Prefer straightforward solutions over unnecessary abstractions.

When multiple implementations are reasonable, favor the one that best fits the existing codebase and introduces the least unnecessary complexity.