# `promise-catch` in `recommended`

**Decision:** Out of scope

**Reason:**

The `promise-catch` entrypoint changes the `reason` parameter of `.then()` and `.catch()` rejection handlers from `any` to `unknown`. While this is a strict improvement for type safety, it causes a **breaking regression** when calling `.then()` or `.catch()` on a union of promises (e.g. `Promise<number> | Promise<void>`).

TypeScript's interface declaration merging can only **add** overloads, never replace them. This means `Promise<T>` ends up with two overloads for both `.then()` and `.catch()` — the original from `lib.es5.d.ts` (with `reason: any`) and the ts-reset override (with `reason: unknown`). When TypeScript encounters a union like `Promise<number> | Promise<void>`, it tries to find a single overload signature compatible across all union members. With doubled overloads, this fails with:

> This expression is not callable. Each member of the union type '...' has signatures, but none of those signatures are compatible with each other.

The entrypoint remains available as an opt-in import (`@total-typescript/ts-reset/promise-catch`) for users who don't use promise unions, but it cannot be included in `recommended` because it silently breaks common patterns.

## Attempted fixes

We exhaustively investigated 30+ approaches to solve this. None succeeded. Here is a detailed account of every avenue explored.

### Approach 1: `Omit` + intersection to replace methods

**Idea:** Use `Omit<Promise<T>, 'then' | 'catch'>` to strip the original methods, then intersect with new ones.

```typescript
type FixedPromise<T> = Omit<Promise<T>, 'then' | 'catch'> & {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined,
  ): Promise<T | TResult>;
};
```

**Result:** Circular reference error. `Promise<T>` extends the type that uses `Omit<Promise<T>>`, creating an infinite loop. Even if it compiled, there's no way to make the global `Promise<T>` equal this type alias — you can't replace a global interface with a type alias.

### Approach 2: `declare class Promise` to replace the interface

**Idea:** Re-declare `Promise` as a class with the corrected method signatures.

**Result:** TS2300: Duplicate identifier 'Promise'. TypeScript won't let you redeclare an existing global.

### Approach 3: `declare global { type Promise<T> = ... }`

**Idea:** Override `Promise` with a global type alias.

**Result:** TS2300: Duplicate identifier 'Promise'. Same problem — can't shadow an existing interface with a type alias.

### Approach 4: Property syntax instead of method syntax

**Idea:** Declare `then` and `catch` as properties with function types rather than method signatures, hoping TypeScript would replace rather than merge.

```typescript
interface Promise<T> {
  then: <TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ) => Promise<TResult1 | TResult2>;
}
```

**Result:** TS2717: Subsequent property declarations must have the same type. TypeScript enforces that property re-declarations match the original type exactly. Since the original uses `any` and we use `unknown`, the types differ and the merge is rejected.

### Approach 5: Identical `any` signature (hoping TS deduplicates)

**Idea:** Add an overload with the exact same signature as the original (including `reason: any`), hoping TypeScript would recognize duplicates and collapse them.

**Result:** TypeScript does NOT deduplicate identical overloads from interface merging. The union issue persists even when both overloads are byte-for-byte identical.

### Approach 6: Augment `PromiseLike` instead of `Promise`

**Idea:** Override `.then()` on `PromiseLike<T>` instead, since `Promise<T>` implements `PromiseLike<T>`.

**Result:** The union issue goes away (only one overload on `PromiseLike`), but `Promise` has its own independent `.then()` and `.catch()` signatures with `reason: any`. Augmenting `PromiseLike` does not propagate to `Promise` — the `reason` stays `any` on `Promise`, defeating the purpose.

### Approach 7: Augment both `PromiseLike` AND `Promise`

**Idea:** Augment `PromiseLike` for the base case and `Promise` for the full signatures.

**Result:** Same double-overload problem on `Promise`. Adding to `PromiseLike` doesn't help because `Promise` still gets the extra overload.

### Approach 8: `export {}` + `declare global` module pattern

**Idea:** Make the `.d.ts` file a module (via `export {}`), then use `declare global { interface Promise<T> { ... } }` hoping the module context changes how merging works.

**Result:** Same behavior. Module-scoped `declare global` merges identically to ambient declarations. Still adds overloads.

### Approach 9: `reason: unknown & {}`

**Idea:** Use `unknown & {}` instead of `unknown`, which excludes `null` and `undefined`. Maybe this creates a more compatible overload.

**Result:** Existing tests fail because `Equal<unknown, typeof err>` is `false` — `unknown & {}` is not the same type as `unknown`. And it doesn't fix the union issue anyway.

### Approach 10: Conditional types (`unknown extends any ? unknown : never`)

**Idea:** Use a conditional type that evaluates to `unknown` at compile time, but might trick TypeScript into treating it as the same overload.

**Result:** TypeScript eagerly evaluates the conditional to `unknown` during declaration emit. It's still a second overload with a different `reason` type.

### Approach 11: `NoInfer<unknown>`

**Idea:** Wrap `unknown` in `NoInfer<>` utility type to change how TypeScript resolves the type parameter.

**Result:** Resolves to `unknown` — still creates a distinct second overload.

### Approach 12: Type alias indirection (`type _ResetUnknown = unknown`)

**Idea:** Define a type alias for `unknown` and use it in the signature, hoping TypeScript treats the alias as structurally distinct.

**Result:** Type aliases are transparent in TypeScript. `_ResetUnknown` resolves to `unknown` immediately. Still a second overload.

### Approach 13: Extra type parameter (`_TReason = unknown`)

**Idea:** Add an extra type parameter to the overload signature so it has a different arity, hoping TypeScript picks the more specific overload.

```typescript
then<TResult1 = T, TResult2 = never, _TReason = unknown>(
  onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
  onrejected?: ((reason: _TReason & unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
): Promise<TResult1 | TResult2>;
```

**Result:** Different number of type parameters makes the overloads even MORE distinct, making the union problem worse.

### Approach 14: `this: Promise<T>` parameter constraint

**Idea:** Add a `this` parameter to the override signature, hoping it would make TypeScript prefer it over the original.

**Result:** The `this` parameter doesn't prevent the double-overload problem. Both overloads still exist on the interface.

### Approach 15: Rest parameter tuple form

**Idea:** Use rest parameters in tuple form (`...args: [onfulfilled?, onrejected?]`) instead of named parameters, hoping this creates a structurally different method that TypeScript handles differently.

**Result:** Still creates a second overload. TypeScript normalizes the signatures.

### Approach 16: `PromiseConstructor.prototype` augmentation

**Idea:** Override methods on the `PromiseConstructor`'s prototype type.

**Result:** TS2687 and TS2717 errors. You can't modify the prototype type of a built-in constructor.

### Approach 17: `PromiseConstructor` return type override

**Idea:** Override `PromiseConstructor` methods to return a type with the corrected signatures.

**Result:** Doesn't help because user code annotates with `Promise<T>` (the interface), not whatever the constructor returns.

### Approach 18: Mapped type with key remapping (`as never`)

**Idea:** Use a mapped type to exclude `then` and `catch` from the keys, then add new ones.

**Result:** Works perfectly as a standalone utility type, but there is no mechanism to make the global `Promise<T>` equal a mapped type. You'd need to replace the global, which TypeScript doesn't allow.

### Approach 19: Remove only the `.then()` override, keep `.catch()`

**Idea:** At least fix the `.then()` union case by only overriding `.catch()`.

**Result:** `.catch()` still has the double-overload problem. And `.then()`'s `onrejected` callback loses the `unknown` typing. Partial fix at best, still broken for `.catch()` on unions.

### Approach 20: Add MORE overloads (simpler single-arg `.then()`)

**Idea:** Add additional overloads with simpler signatures that might be easier for TypeScript to reconcile across union members.

**Result:** More overloads makes the union problem strictly worse — more combinations to reconcile, not fewer.

## Conclusion

This is a **fundamental limitation of TypeScript's type system**. Interface declaration merging is strictly additive — you can add members but never remove or replace them. Every approach that successfully changes `reason` to `unknown` does so by adding a second overload, which breaks union compatibility. Every approach that tries to replace the original signature is blocked by TypeScript's rules against redeclaration.

The only theoretical paths to a real fix are:

1. **Upstream change to TypeScript** — change `lib.es5.d.ts` to use `reason: unknown` in Promise's `.then()` and `.catch()`. This would be the correct fix but is unlikely to be accepted by the TypeScript team as it would be a breaking change for the entire ecosystem.
2. **Custom lib replacement** — use `"lib": []` in tsconfig and ship patched lib files. This is far too heavy for ts-reset's lightweight approach.
3. **Future TypeScript feature** — if TypeScript ever adds a mechanism for interface merging to replace rather than add overloads, this could be revisited.

**Prior requests:**

- #209 — "Promise Union - This expression is not callable."
