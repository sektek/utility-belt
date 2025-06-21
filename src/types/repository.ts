import { OptionalProviderFn } from './optional-provider.js';
import { PredicateFn } from './predicate.js';

/**
 * Repository is a generic interface for a data repository that provides methods
 * for retrieving, saving, deleting, and checking the existence of entities.
 * It is designed to work with entities of type T and keys of type K, which defaults to string.
 *
 * @typeParam T - The type of the entity stored in the repository.
 * @typeParam K - The type of the key used to access the repository. Defaults to string.
 */
export type Repository<T, K = string> = {
  /**
   * Retrieves an entity from the repository by its key.
   * @param key - The key to retrieve the entity for.
   * @returns A promise that resolves to the entity associated with the key,
   *          or undefined if the key does not exist in the repository.
   */
  get: OptionalProviderFn<T, K>;

  /**
   * Saves an entity in the repository.
   * @param entity - The entity to be saved.
   * @returns A promise that resolves to the saved entity.
   */
  save(entity: T): PromiseLike<T> | T;

  /**
   * Deletes an entity from the repository by its key or the entity itself.
   * @param entityOrKey - The entity or key to delete from the repository.
   * @returns A promise that resolves to true if the entity was deleted,
   *          or false if the key did not exist in the repository.
   */
  delete(entityOrKey: T | K): PromiseLike<boolean> | boolean;

  /**
   * Checks if an entity exists in the repository by its key.
   * @param key - The key to check for existence.
   * @returns A promise that resolves to true if the key exists, false otherwise.
   */
  has: PredicateFn<K>;

  /**
   * Checks if an entity exists in the repository by its value.
   * @param entity - The entity to check for existence.
   * @returns A promise that resolves to true if the entity exists, false otherwise.
   */
  includes: PredicateFn<T>;
};
