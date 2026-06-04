/**
 * True when a list query failed before any data was loaded.
 * Distinguishes API/network errors from a successful empty response ([]).
 */
export function isQueryLoadFailure(isError: boolean, data: unknown): boolean {
  return isError && data === undefined
}
