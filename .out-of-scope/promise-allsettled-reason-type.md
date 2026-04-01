# PromiseRejectedResult.reason `any` → `unknown`

**Decision:** Out of scope

**Reason:**

TypeScript doesn't allow redeclaring an interface property with a different type — attempting to merge `PromiseRejectedResult` with `reason: unknown` triggers TS2717 ("Subsequent property declarations must have the same type").

A workaround exists: re-declare `PromiseConstructor.allSettled` to return an inline type with `reason: unknown` instead of referencing `PromiseRejectedResult`. However, this only fixes the `allSettled` call site — standalone usage of `PromiseRejectedResult` would still have `reason: any`. Since we can't cleanly fix the underlying interface, this is out of scope.

**Prior requests:**

- #210 — "Improve Promise types reset for `reason` field of PromiseRejectedResult"
