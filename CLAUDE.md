Use pnpm

Each entrypoint must be in `src/entrypoints`, and have an entry in `package.json#exports`. It may optionally be added to `src/recommended.d.ts`.

When typechecking, always run `pnpm typecheck`. This runs against the entire repo, which is good for testing regressions.
