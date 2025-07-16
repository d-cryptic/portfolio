# Agent Guidelines for Astro Portfolio

## Build/Test Commands

- `npm run build` - Type check with astro check then build
- `npm run dev` - Start development server
- `npm run preview` - Preview production build
- No test framework configured

## Code Style & Conventions

- Uses Prettier with astro and tailwindcss plugins
- TypeScript with strict mode enabled
- Path aliases: `@*` maps to `./src/*`
- Import order: External packages, then `@` aliases, then relative imports
- Use `clsx` + `tailwind-merge` via `cn()` utility for conditional classes
- Astro components use frontmatter with imports at top
- TypeScript functions use explicit return types when complex
- Use `const` for immutable values, descriptive variable names
- Error handling: Use optional chaining and nullish coalescing
- Tailwind classes: Use semantic class names, group by type (layout, spacing, colors)
- File naming: kebab-case for components, camelCase for utilities
- Export named functions from utilities, default export for components

## Framework Specifics

- Astro project with MDX, Tailwind CSS, and TypeScript
- Uses transition:persist for header persistence
- Mobile-first responsive design patterns
- Semantic HTML with proper ARIA labels
