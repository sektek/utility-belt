/**
 * A predicate that always returns false.
 */
export class RejectPredicate {
  static test(): boolean {
    return false;
  }

  test(): boolean {
    return false;
  }
}

/**
 * Syntactic sugar for always returning false.
 *
 * @returns Always false.
 */
export const reject = () => false;
