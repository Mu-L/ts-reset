# Typed Object.create return

**Decision:** Out of scope

**Reason:**

The TypeScript team tried typing `Object.create` with a generic return type in 2016 ([PR #8974](https://github.com/microsoft/TypeScript/pull/8974)) and reverted it in 2017 ([PR #14162](https://github.com/microsoft/TypeScript/pull/14162)) because it broke real-world code — including VS Code.

The core problems are fundamental:

- `Object.create` puts properties on the prototype chain, not as own properties — so `Object.keys()`, spread, and `JSON.stringify()` won't see inherited properties. Typing the return as `T` is misleading.
- The most common use case, `Object.create(null)`, needs a type assertion regardless.
- The `PropertyDescriptorMap` overload can't carry type information.

As Ryan Cavanaugh [said](https://github.com/microsoft/TypeScript/issues/22875#issuecomment-376259367): "`any` can never be wrong, just... less right." This is a deliberate trade-off, not an oversight, and falls outside ts-reset's sweet spot of fixing clearly wrong defaults.

**Prior requests:**

- #220 — "Improve return type of Object.create"
