---
"@total-typescript/ts-reset": minor
---

Add `clone-node` entrypoint that overrides `Node.cloneNode` to return `this` instead of `Node`, preserving the specific element type through cloning. Available standalone via `@total-typescript/ts-reset/clone-node` or as part of `@total-typescript/ts-reset/dom`.
