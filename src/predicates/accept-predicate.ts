/**
 * A predicate that always returns true.
 */
export class AcceptPredicate {
  static test(): boolean {
    return true;
  }

  test(): boolean {
    return true;
  }
}

/**
 * Syntactic sugar for always returning true.
 *
 * @returns Always true.
 */
export const accept = () => true;
