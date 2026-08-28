import { createServiceClient } from '@/lib/supabase/server';
import { LIST_VIEW_LIMIT, warnIfTruncated } from '@/lib/supabase/query-guard';
import { todayDateOnly } from '@/lib/dates';
import {
  emptyNightBoard,
  INVENTORY_HOLD_STATUSES,
  INVENTORY_LOCK_STATUSES,
  isActiveStayRange,
  type AssetNightBoard,
  type StaySpan,
} from '@/lib/engines/inventory';

const BOARD_ROW_CAP = LIST_VIEW_LIMIT;

type BookingStayRow = {
  id: string;
  asset_id: string;
  sale_id: string;
  status: string;
  check_in: string;
  check_out: string;
};

function toStay(row: BookingStayRow): StaySpan {
  return {
    bookingId: row.id,
    saleId: row.sale_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
  };
}

function pushStay(board: AssetNightBoard, row: BookingStayRow) {
  const stay = toStay(row);
  if (
    (INVENTORY_LOCK_STATUSES as readonly string[]).includes(row.status) &&
    isActiveStayRange(stay)
  ) {
    board.confirmedStays.push(stay);
    return;
  }
  if ((INVENTORY_HOLD_STATUSES as readonly string[]).includes(row.status)) {
    board.holdStays.push(stay);
  }
}

/**
 * Shared inventory ledger for one asset. Uses the service client so Sale/Guest
 * see the same locked/closed/hold nights (RLS would hide other sales' holds).
 * Does not read `ui_mode`.
 */
export async function loadAssetNightBoard(
  assetId: string,
  range?: { from: string; to: string }
): Promise<AssetNightBoard> {
  const map = await loadAssetNightBoards([assetId], range);
  return map.get(assetId) ?? emptyNightBoard(assetId);
}

export async function loadAssetNightBoards(
  assetIds: string[],
  range?: { from: string; to: string }
): Promise<Map<string, AssetNightBoard>> {
  const boards = new Map<string, AssetNightBoard>();
  for (const id of assetIds) {
    boards.set(id, emptyNightBoard(id));
  }
  if (!assetIds.length) return boards;

  const admin = createServiceClient();
  const from = range?.from ?? todayDateOnly();
  const to = range?.to;

  const bookingQuery = admin
    .from('bookings')
    .select('id, asset_id, sale_id, status, check_in, check_out')
    .in('asset_id', assetIds)
    .in('status', [...INVENTORY_LOCK_STATUSES, ...INVENTORY_HOLD_STATUSES])
    .gte('check_out', from)
    .order('check_in', { ascending: true })
    .limit(BOARD_ROW_CAP);

  const closedQuery = admin
    .from('asset_closed_nights')
    .select('asset_id, night')
    .in('asset_id', assetIds)
    .gte('night', from)
    .limit(BOARD_ROW_CAP);

  const costQuery = admin
    .from('asset_nightly_costs')
    .select('asset_id, night, cost')
    .in('asset_id', assetIds)
    .gte('night', from)
    .limit(BOARD_ROW_CAP);

  const boundedBookings = to ? bookingQuery.lt('check_in', to) : bookingQuery;
  const boundedClosed = to ? closedQuery.lt('night', to) : closedQuery;
  const boundedCosts = to ? costQuery.lt('night', to) : costQuery;

  const [bookingsRes, closedRes, costsRes] = await Promise.all([
    boundedBookings,
    boundedClosed,
    boundedCosts,
  ]);

  if (bookingsRes.error) {
    throw new Error(`Night board bookings failed: ${bookingsRes.error.message}`);
  }
  if (closedRes.error) {
    throw new Error(`Night board closed nights failed: ${closedRes.error.message}`);
  }
  if (costsRes.error) {
    throw new Error(`Night board nightly costs failed: ${costsRes.error.message}`);
  }

  warnIfTruncated('asset-night-board.bookings', bookingsRes.data);
  warnIfTruncated('asset-night-board.closed', closedRes.data);
  warnIfTruncated('asset-night-board.costs', costsRes.data);

  for (const row of (bookingsRes.data || []) as BookingStayRow[]) {
    const board = boards.get(row.asset_id);
    if (!board) continue;
    pushStay(board, row);
  }

  for (const row of closedRes.data || []) {
    const board = boards.get(row.asset_id);
    if (!board) continue;
    board.closedNights.push(row.night);
  }

  for (const row of costsRes.data || []) {
    const board = boards.get(row.asset_id);
    if (!board) continue;
    board.nightlyCosts[row.night] = Number(row.cost);
  }

  return boards;
}

export async function loadClosedNightsInRange(
  assetId: string,
  checkIn: string,
  checkOut: string
): Promise<string[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('asset_closed_nights')
    .select('night')
    .eq('asset_id', assetId)
    .gte('night', checkIn)
    .lt('night', checkOut)
    .limit(BOARD_ROW_CAP);
  if (error) {
    throw new Error(`Closed nights lookup failed: ${error.message}`);
  }
  warnIfTruncated('closed-nights-range', data);
  return (data || []).map((r) => r.night as string);
}

export async function loadNightlyCostsInRange(
  assetId: string,
  checkIn: string,
  checkOut: string
): Promise<Record<string, number>> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from('asset_nightly_costs')
    .select('night, cost')
    .eq('asset_id', assetId)
    .gte('night', checkIn)
    .lt('night', checkOut)
    .limit(BOARD_ROW_CAP);
  if (error) {
    throw new Error(`Nightly costs lookup failed: ${error.message}`);
  }
  warnIfTruncated('nightly-costs-range', data);
  const map: Record<string, number> = {};
  for (const row of data || []) {
    map[row.night as string] = Number(row.cost);
  }
  return map;
}
