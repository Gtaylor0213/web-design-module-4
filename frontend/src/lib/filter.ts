/** Filter a list of objects by a free-text query, checking the values
 *  returned by each accessor function. An empty query returns the list
 *  unchanged. Case-insensitive substring match. */
export function searchFilter<T>(
  entries: T[],
  query: string,
  accessors: ((entry: T) => string | null | undefined)[],
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) =>
    accessors.some((get) => {
      const v = get(e);
      return typeof v === 'string' && v.toLowerCase().includes(q);
    }),
  );
}
