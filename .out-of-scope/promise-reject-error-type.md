# Typed Promise reject callback

**Decision:** Out of scope

**Reason:**

The proposal is to change `reject(reason?: any)` to `reject(reason?: Error)` in the `Promise` constructor, enforcing that only `Error` objects can be used for rejection.

This contradicts ts-reset's own `promise-catch` rule, which types the catch handler as `(reason: unknown)` — acknowledging that rejections can be anything at runtime. Typing the production side as `Error` while the consumption side is `unknown` is inconsistent.

Additionally, coverage is incomplete — it only constrains the `new Promise()` constructor callback. It doesn't catch:

- `throw "string"` inside async functions
- `Promise.reject("string")`
- Throws inside the executor itself

"Always reject with Error" is a code convention best enforced by the [prefer-promise-reject-errors](https://typescript-eslint.io/rules/prefer-promise-reject-errors/) ESLint rule, not a type correctness issue in ts-reset's sweet spot.

**Prior requests:**

- #223 — "Use Error type in Promise constructor"
