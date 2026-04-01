---
"@total-typescript/ts-reset": minor
---

Remove `promise-catch` from `recommended` due to incompatibility with promise unions (`Promise<A> | Promise<B>`). The entrypoint is still available as an opt-in import via `@total-typescript/ts-reset/promise-catch`.
