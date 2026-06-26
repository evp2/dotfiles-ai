# Global Claude Preferences

## Stack
- Web dashboards: SvelteKit in SPA mode for low-medium complexity; switch to React only when the UI is heavily component-dense
- Type safety is non-negotiable

## Code Style
- Terse and minimal — let the code speak for itself
- No comments unless the WHY is non-obvious (hidden constraint, subtle invariant, workaround)
- Keep it DRY — before writing a new function, dispatch an explore agent to check for an existing one that can be reused
- Prefer editing existing files over creating new ones

## Dependencies
- Reach for stdlib first; add a package only when it clearly earns its place

## Testing
- Write tests when the change warrants it
- Don't build a regression suite around a trivial change

## Git
- Never include commit metadata — no Co-Authored-By, no AI attribution, no generated-by footers

## Responses
- Concise, no unnecessary headers
- No em dashes in reports or generated documents

## Pre-push
- In web and Python projects: always run the linter and tests before pushing
