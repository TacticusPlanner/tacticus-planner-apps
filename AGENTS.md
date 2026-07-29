# Repository Guidelines

## Project Structure & Module Organization

This repository is a pnpm/Turbo monorepo for a Vite React app with shared UI.

- `apps/web`: the runnable React/Vite application. Source lives in `apps/web/src`, with `App.tsx`, `main.tsx`, app-local components, and app utilities.
- `packages/ui`: shared UI package exported as `@workspace/ui`. Reusable components live in `packages/ui/src/components`, hooks in `src/hooks`, utilities in `src/lib`, and global Tailwind styles in `src/styles/globals.css`.
- `.agents/skills`: local agent skill documentation, including shadcn guidance.
- Root files such as `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`, and `.prettierrc` configure the workspace.

## Build, Test, and Development Commands

Use pnpm from the repository root.

- `pnpm install`: install workspace dependencies.
- `pnpm dev`: run Turbo development tasks, including the Vite dev server for `apps/web`.
- `pnpm build`: type-check and build packages/apps through Turbo.
- `pnpm lint`: run ESLint across configured workspace packages.
- `pnpm typecheck`: run TypeScript checks without emitting files.
- `pnpm format`: run Prettier formatting for TypeScript and TSX files.
- `pnpm --filter web preview`: preview the built Vite app.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing 2-space indentation, no semicolons, double quotes, LF line endings, and 80-column print width from `.prettierrc`. Prettier includes `prettier-plugin-tailwindcss`, so prefer letting formatting sort Tailwind classes.

Name React components in `PascalCase`, hooks as `useThing`, and utility files with short descriptive names such as `utils.ts`. Import shared UI through exports like `@workspace/ui/components/button` rather than reaching into package internals.

## UI & Styling

This workspace uses shadcn/ui-style components, Radix primitives, lucide icons, and Tailwind CSS. Add shadcn components with:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Generated shared components should land in `packages/ui/src/components`.

## Testing Guidelines

No test runner or `test` script is currently configured. When adding tests, choose tooling that fits Vite/React, document the command in `package.json`, and colocate tests near the code they cover using names like `Component.test.tsx` or `utils.test.ts`.

## Commit & Pull Request Guidelines

The current Git history uses short imperative subjects such as `Setup project`. Keep commit messages concise and action-oriented.

Pull requests should include a brief summary, validation steps run (`pnpm lint`, `pnpm typecheck`, `pnpm build`), linked issues when applicable, and screenshots or recordings for visible UI changes.

Open short-lived topic branches from `main` and squash-merge reviewed pull
requests back into `main`. Delete topic branches after merging. For supported
releases, fix defects on `main` first and backport the squash commit through a
pull request into `release/X.Y`. See `RELEASING.md` for the complete release
and patch process.
