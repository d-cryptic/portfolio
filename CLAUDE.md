# CLAUDE.md

## Project Overview
[Brief description of what this project does]

## Tech Stack
- Framework: [Next.js/React/Vue/etc.]
- Database: [PostgreSQL/MongoDB/etc.]
- ORM: [Prisma/SQLAlchemy/etc.]
- Testing: [Vitest/Pytest/etc.]
- Deployment: [Vercel/Netlify/etc.]

## Architecture
- `/src/app` - [App router pages/components]
- `/src/components` - [Reusable UI components]
- `/src/lib` - [Utilities and helpers]
- `/src/server` - [Server actions/API routes]
- `/src/db` - [Database schemas/migrations]

## Coding Standards
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zod for validation
- Error handling: use Result pattern
- Follow existing patterns in codebase

## Common Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm db:push` - Push database schema

## Important Files
- `src/lib/db.ts` - Database connection
- `src/lib/auth.ts` - Authentication logic
- `src/lib/validations.ts` - Zod schemas
- `src/components/ui/` - UI components

## AI Instructions
- Always use server actions for mutations
- Prefer `use server` over API routes
- Use Tailwind CSS for styling
- Follow existing patterns in codebase
- Test all changes before committing

## Environment Variables
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Auth secret
- `OPENAI_API_KEY` - AI features (if applicable)

## Deployment Notes
- Deploy to [platform]
- Environment variables needed: [list]
- Database migrations: [how to run]