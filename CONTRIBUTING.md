# Contributing

Thanks for helping out. This project keeps a deliberately strict bar so it
stays small, readable, and trustworthy.

## Setup

```bash
pnpm install
pnpm setup
pnpm dev
```

## The quality gates

All enforced by `pnpm verify` and by git hooks:

- **Tests + coverage** — Vitest with **100%** lines/branches/functions/
  statements on `lib/`. All real logic lives in `lib/` as small, pure,
  dependency-injected functions so it's testable without spinning up the
  framework. `app/` holds only thin glue (route handlers, page shells, server
  actions) and is intentionally out of the coverage scope — keep it thin.
- **Lint** — ESLint with hard caps: complexity ≤ 10, cognitive complexity
  ≤ 12, ≤ 250 lines/file, ≤ 50 lines/function (≤ 120 for JSX in `app/`),
  ≤ 4 params, depth ≤ 4. No `any`. Warnings fail (`--max-warnings=0`).
- **Duplication** — jscpd at 0%. Factor shared logic into a helper.
- **Formatting** — Prettier.

```bash
pnpm verify        # typecheck + lint + dupes + coverage (run before pushing)
pnpm test:watch    # TDD
pnpm lint:fix      # autofix lint + format
```

## Git hooks

- **pre-commit** — lint-staged (eslint + prettier on staged files) and jscpd.
- **pre-push** — typecheck and the full 100% coverage run.

If a hook blocks you, it found something real — fix it rather than bypassing.

## Where things go

- New logic → a small module in `lib/` with a colocated `*.test.ts` at 100%.
- New UI/route → `app/`, kept thin; push any decision into a tested `lib/`
  function.
- New env var → document it in `.env.example` and the README table.
- New gated/public route → update `lib/routes.ts` (and its test).

## Dependencies

`next-auth` is pinned to an exact `5.0.0-beta.*` version on purpose — v5 has
no stable release yet, and betas can break between patches. Don't widen it to
a caret range or bump it casually; bump deliberately, re-run `pnpm verify`,
and smoke-test a real sign-in before committing.

## Commits

Atomic and focused — one logical change per commit, with a message that
explains the why.
