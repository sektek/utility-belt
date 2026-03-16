/**
 * Takes a specified number of items from an async or sync iterable source.
 *
 * @template T - The type of items in the source iterable.
 *
 * @param source - The source iterable or async iterable.
 * @param limit - The maximum number of items to take. If zero or negative,
 *                no items will be taken.
 * @param offset - The number of items to skip before starting to take items.
 *                 Defaults to 0. If negative, it will be treated as 0.
 *
 * @yields {T} The next item from the source iterable until the limit is reached.
 * @returns An async generator that yields items from the source iterable.
 */
export const take = async function* <T>(
  source: AsyncIterable<T> | Iterable<T>,
  limit: number,
  offset = 0,
): AsyncGenerator<T> {
  if (offset < 0) {
    offset = 0;
  }
  if (limit <= 0) {
    return;
  }

  const max = offset + limit;

  let count = 0;
  for await (const item of source) {
    if (count >= offset && count < max) {
      yield item;
    }
    count++;
    if (count >= max) {
      break;
    }
  }
};
