/**
 * Changes the `reason` parameter of `.then()` and `.catch()` rejection
 * handlers from `any` to `unknown`, forcing explicit type narrowing.
 *
 * **Known limitation:** This adds a second overload to `.then()` and
 * `.catch()` (the original from lib.es5.d.ts uses `reason: any`).
 * TypeScript cannot reconcile multiple overloads across union members,
 * so calling `.then()` or `.catch()` on a union of promises like
 * `Promise<number> | Promise<void>` will fail with:
 *
 *   "This expression is not callable. Each member of the union type
 *    '...' has signatures, but none of those signatures are compatible
 *    with each other."
 *
 * Workaround: use `Promise<A | B>` instead of `Promise<A> | Promise<B>`.
 *
 * This is unfixable with TypeScript's current type system — interface
 * declaration merging can only add overloads, never replace them.
 * See https://github.com/mattpocock/ts-reset/issues/209
 *
 * This entrypoint is NOT included in `recommended` for this reason.
 * Import it explicitly if you want this behavior:
 *
 *   import "@total-typescript/ts-reset/promise-catch";
 */
interface Promise<T> {
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2>;

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(
    onrejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult>;
}
