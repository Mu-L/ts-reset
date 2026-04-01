# `Array.includes` as a type guard

**Decision:** Out of scope

**Reason:**

Using `Array.includes` as a type guard (narrowing `searchElement` to `T`) is too aggressive in the general case. A simple `searchElement is T` return type produces incorrect narrowing in else blocks and other negative positions.

For example:

```ts
const status: 400 | 404 | 500 = getStatus();

if ([400, 404].includes(status)) {
  // status narrows to 400 | 404 — correct
} else {
  // status narrows to 500 — WRONG
  // The array [400, 404] is not guaranteed to be exhaustive,
  // so 400 and 404 should not be excluded from the else branch
}
```

The narrowing in the else branch assumes the array is an exhaustive list of all possible values of `T`, which is not a safe assumption.

## Attempted fixes

PR #130 explored a safer variant: only enabling the type guard for tuples with literal entries (e.g. `[1, 2] as const`). This avoids the general case but still has a known problem when the array itself is a union type — the else branch narrows incorrectly because TypeScript's type guard negation assumes the guard is exhaustive across all union members.

Even the restricted version was deemed too risky for ts-reset's "no false positives" philosophy.

## Conclusion

This is a fundamental limitation of how TypeScript narrows types via type guards. The `includes` method checks membership in a runtime array, but TypeScript's control flow narrowing assumes type guards are exhaustive in negative positions. Until TypeScript provides a mechanism for "positive-only" type guards (narrow in the if branch but don't narrow in the else branch), this cannot be implemented safely.

**Prior requests:**

- #203 — "Type `Array.includes` as a type guard"
- #130 — PR attempting restricted type guard for tuple literals (closed)
- #49 — Earlier discussion of the same idea
