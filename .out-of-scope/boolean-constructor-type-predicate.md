# Boolean() as a type predicate

**Decision:** Out of scope (until TypeScript supports one-sided type predicates)

**Reason:**

Overriding `BooleanConstructor` with `<T>(value?: T): value is NonFalsy<T>` narrows correctly in the true branch but over-narrows in the false branch. For example, `string | undefined` in an else branch becomes just `undefined`, losing the fact that `""` is also falsy. The same problem applies to `number` (loses `0`) and `boolean` (loses `false`).

The TypeScript team shipped this exact change in TS 3.5 and [reverted it](https://github.com/microsoft/TypeScript/issues/16655#issuecomment-494907057) due to breakage. Ryan Cavanaugh also [noted](https://github.com/microsoft/TypeScript/issues/16655#issuecomment-309863079): "it fails to do the right thing in the `else` case when `x` is `0` coming from a non-literal numeric type."

This is blocked on one-sided type predicates ([microsoft/TypeScript#15048](https://github.com/microsoft/TypeScript/issues/15048)), which would allow narrowing only the true branch without incorrectly narrowing the false branch.

**Prior requests:**

- #35 — "Feature request - Smarter Boolean"
- #138 — "Boolean() behaviour vs !! operator"
- #213 — "FR: upgrade Boolean to be a type assertion function"
