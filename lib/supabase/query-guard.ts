/**
 * PostgREST caps every response at `db-max-rows` (see `supabase/config.toml`)
 * and does so without raising an error, so an unbounded list query silently
 * returns partial data. Aggregates built from that data are then wrong with no
 * failure to trace. A result sitting exactly on the cap is treated as truncated.
 */
export const POSTGREST_MAX_ROWS = Number(
  process.env.SUPABASE_DB_MAX_ROWS || 1000
);

export function warnIfTruncated<T>(
  scope: string,
  rows: T[] | null | undefined
): void {
  if (!rows || rows.length < POSTGREST_MAX_ROWS) return;
  console.error(
    `[query-guard] ${JSON.stringify({
      scope,
      rows: rows.length,
      maxRows: POSTGREST_MAX_ROWS,
      hint: 'Result sits on the PostgREST row cap — treat it as truncated and page or aggregate in SQL.',
    })}`
  );
}

/**
 * Cap for dashboard lists that render every row they fetch and have no paging
 * controls yet. It is deliberately far below the row cap so the boundary is a
 * decision in the code rather than a silent cut by PostgREST.
 *
 * TODO: remaining LIST_VIEW_LIMIT views (bookings, pending) still need paging.
 */
export const LIST_VIEW_LIMIT = 200;

/** Card lists: owner Properties and admin Asset approval. */
export const DASHBOARD_ASSET_PAGE_SIZE = 10;
export const MAX_DASHBOARD_PAGE = 1_000;

export function parseDashboardPage(raw?: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_DASHBOARD_PAGE);
}

const DEFAULT_PAGE_SIZE = 500;

/**
 * An `in.(...)` filter travels in the URL, so a few hundred UUIDs already
 * approach the request line limit — well before the row cap comes into play.
 */
const DEFAULT_ID_CHUNK = 200;

export async function fetchByIds<T>(
  ids: string[],
  makeChunk: (
    chunk: string[]
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  chunkSize: number = DEFAULT_ID_CHUNK
): Promise<T[]> {
  const rows: T[] = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const { data, error } = await makeChunk(ids.slice(i, i + chunkSize));
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
  }

  return rows;
}

/**
 * Reads a whole result set in pages.
 *
 * For queries that genuinely need every row — replaying a history, grouping by
 * a key — where a single call would be cut at the row cap and produce a wrong
 * answer with no error. Aggregating in SQL is better where the shape allows it;
 * this is the honest fallback where it does not.
 */
export async function fetchAllPages<T>(
  makePage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makePage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);

    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
