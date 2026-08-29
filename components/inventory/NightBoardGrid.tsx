'use client';

import {
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from '@/lib/i18n/navigation';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { bookingStatusColors } from '@/config/booking-status';
import { colors } from '@/config/design-tokens';
import { useFormat } from '@/lib/i18n/use-format';
import { nightsInRange, todayDateOnly } from '@/lib/dates';
import {
  nightStatus,
  stayOnNight,
  type NightStatus,
} from '@/lib/engines/inventory';
import {
  compactCost,
  isDateInInclusiveRange,
  nightDisplayCost,
  orderedStay,
  stayDisplayCost,
  stayHasBlockedNight,
  weekdayLabel,
  type NightBoardColumn,
} from '@/lib/engines/night-board-display';
import {
  minDepositToConfirm,
  minOwnerDepositToConfirm,
  previewPricing,
} from '@/lib/engines/pricing';
import { GuestPicker } from '@/components/sale/GuestPicker';
import {
  NightBoardColumnHeader,
  columnGalleryImages,
  guestShareUrl,
} from '@/components/inventory/NightBoardColumnHeader';
import { AssetDetailGallery } from '@/components/marketplace/AssetDetailGallery';
import { OwnerBookingActions } from '@/components/owner/OwnerBookingActions';
import { OwnerSaleRatingForm } from '@/components/owner/OwnerSaleRatingForm';
import type { GuestOption } from '@/lib/engines/sale-guest-search';
import type { SaleRatingRecord } from '@/lib/engines/sale-ratings';

const LOCKED_TONE = {
  bg: colors.dangerSoft,
  text: colors.danger,
  border: '#E8D0D0',
};

function cellTone(status: NightStatus) {
  if (status === 'locked') return LOCKED_TONE;
  if (status === 'closed') return bookingStatusColors.blocked;
  if (status === 'hold') return bookingStatusColors.hold;
  return bookingStatusColors.available;
}

const LONG_PRESS_MS = 480;
const MOVE_CANCEL_PX = 10;

export function NightBoardGrid({
  role,
  viewerId,
  dates,
  columns,
  guestSuggestions = [],
  ratingsByBooking = {},
  simpleUi = false,
}: {
  role: 'OWNER' | 'SALE';
  viewerId: string;
  dates: string[];
  columns: NightBoardColumn[];
  guestSuggestions?: GuestOption[];
  ratingsByBooking?: Record<string, SaleRatingRecord | null>;
  /** Sale Đơn giản: gửi Owner without recording guest/CK amounts. */
  simpleUi?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('inventory');
  const { formatNumber } = useFormat();
  const today = todayDateOnly();
  const audience = role === 'OWNER' ? 'owner' : 'sale';
  const isDesktop = useMediaQuery('(min-width: 1024px)') === true;
  const colWidth = isDesktop
    ? role === 'SALE'
      ? 160
      : 128
    : role === 'SALE'
      ? 148
      : 156;
  const cellHeight = isDesktop ? 44 : 48;
  const stickHeader = !isDesktop;
  const [busy, setBusy] = useState(false);
  const [rangeStart, setRangeStart] = useState<{
    assetId: string;
    date: string;
  } | null>(null);
  const [rangeHover, setRangeHover] = useState<string | null>(null);
  const dragRef = useRef<{ assetId: string; start: string; end: string } | null>(
    null
  );
  const lastPointerTypeRef = useRef<string>('mouse');
  const suppressClickRef = useRef(false);
  const ownerPressCleanupRef = useRef<(() => void) | null>(null);
  const [tapSelecting, setTapSelecting] = useState(false);
  const [holdOpen, setHoldOpen] = useState<{
    assetId: string;
    checkIn: string;
    checkOut: string;
  } | null>(null);
  const [guest, setGuest] = useState<GuestOption | null>(null);
  const [listPrice, setListPrice] = useState(0);
  const [submitOpen, setSubmitOpen] = useState<{
    bookingId: string;
  } | null>(null);
  const [collected, setCollected] = useState(0);
  const [ownerPaid, setOwnerPaid] = useState(0);
  const [ownerStay, setOwnerStay] = useState<{
    bookingId: string;
    nightStatus: NightStatus;
    bookingStatus?: string;
  } | null>(null);
  const [costEdit, setCostEdit] = useState<{
    assetId: string;
    date: string;
    value: number;
  } | null>(null);
  const [gallery, setGallery] = useState<NightBoardColumn | null>(null);

  const colById = useMemo(() => {
    const map = new Map(columns.map((c) => [c.assetId, c]));
    return map;
  }, [columns]);

  function openHold(assetId: string, checkIn: string, checkOut: string) {
    const col = colById.get(assetId);
    setHoldOpen({ assetId, checkIn, checkOut });
    setGuest(null);
    setCollected(0);
    setOwnerPaid(0);
    if (col) {
      setListPrice(stayDisplayCost(checkIn, checkOut, col, 'sale'));
    }
  }

  const openHoldRef = useRef(openHold);
  openHoldRef.current = openHold;

  const holdCol = holdOpen ? colById.get(holdOpen.assetId) : undefined;
  const holdPreview =
    holdOpen && holdCol
      ? previewPricing({
          checkIn: holdOpen.checkIn,
          checkOut: holdOpen.checkOut,
          costWeekday: holdCol.costWeekday,
          costWeekend: holdCol.costWeekend,
          listSelling: listPrice,
          saleCostDiscountPercent: holdCol.saleDiscountPercent || 0,
          nightlyCosts: holdCol.board.nightlyCosts,
        })
      : null;
  const holdNights = holdOpen
    ? nightsInRange(holdOpen.checkIn, holdOpen.checkOut).length
    : 0;
  const minGuest = minDepositToConfirm(listPrice);
  const minOwner = holdPreview
    ? minOwnerDepositToConfirm(holdPreview.effectiveCost)
    : 0;
  const canSubmitHold =
    !!guest &&
    listPrice > 0 &&
    (!holdPreview || listPrice >= holdPreview.effectiveCost) &&
    (simpleUi || (collected >= minGuest && ownerPaid >= minOwner));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      dragRef.current = null;
      setRangeStart(null);
      setRangeHover(null);
      setTapSelecting(false);
    }
    function onUp() {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      const stay = orderedStay(drag.start, drag.end);
      const col = colById.get(drag.assetId);
      setRangeStart(null);
      setRangeHover(null);
      if (!col) return;
      if (stayHasBlockedNight(stay.checkIn, stay.checkOut, col.board)) {
        notifications.show({
          color: 'yellow',
          message: 'Khoảng này có đêm đóng / khóa / giữ — chọn lại đêm trống',
        });
        return;
      }
      openHoldRef.current(drag.assetId, stay.checkIn, stay.checkOut);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onUp);
      ownerPressCleanupRef.current?.();
    };
  }, [colById]);

  function clearRange() {
    dragRef.current = null;
    setRangeStart(null);
    setRangeHover(null);
    setTapSelecting(false);
  }

  async function patchInventory(
    assetId: string,
    night: string,
    action: 'close' | 'open' | 'set_cost',
    cost?: number | null
  ) {
    setBusy(true);
    try {
      const res = await fetch('/api/owner/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, night, action, cost }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không lưu được',
        });
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitBooking(bookingId: string): Promise<boolean> {
    if (!simpleUi) {
      const pay = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action: 'record_payment',
          amountCollected: collected,
        }),
      });
      const payJson = await pay.json();
      if (!payJson.success) {
        notifications.show({
          color: 'red',
          message: payJson.error?.message || 'Không ghi nhận đã thu',
        });
        return false;
      }
      const owner = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action: 'record_owner_payout',
          ownerPaidAmount: ownerPaid,
        }),
      });
      const ownerJson = await owner.json();
      if (!ownerJson.success) {
        notifications.show({
          color: 'red',
          message: ownerJson.error?.message || 'Không ghi nhận CK Owner',
        });
        return false;
      }
    }
    const submit = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        action: 'submit_to_owner',
        amountCollected: simpleUi ? 0 : collected,
      }),
    });
    const submitJson = await submit.json();
    if (!submitJson.success) {
      notifications.show({
        color: 'red',
        message: submitJson.error?.message || 'Không gửi Owner được',
      });
      return false;
    }
    return true;
  }

  async function createHold(submitAfter: boolean) {
    if (!holdOpen || !guest) return;
    setBusy(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: holdOpen.assetId,
          guestId: guest.value,
          checkIn: holdOpen.checkIn,
          checkOut: holdOpen.checkOut,
          listPrice,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        notifications.show({
          color: 'red',
          message: json.error?.message || 'Không giữ chỗ được',
        });
        return;
      }
      const bookingId = json.data?.booking?.id as string | undefined;
      if (submitAfter) {
        if (!bookingId) {
          notifications.show({
            color: 'yellow',
            message: 'Đã giữ chỗ. Gửi Owner chưa xong — bấm ô vàng để gửi lại.',
          });
        } else {
          const sent = await submitBooking(bookingId);
          if (!sent) {
            notifications.show({
              color: 'yellow',
              message: 'Đã giữ chỗ. Gửi Owner chưa xong — bấm ô vàng để gửi lại.',
            });
            setHoldOpen(null);
            setGuest(null);
            router.refresh();
            return;
          }
          notifications.show({
            color: 'vbnbGreen',
            message: 'Đã giữ và gửi Owner — chờ chủ khóa lịch',
          });
        }
      } else {
        notifications.show({
          color: 'vbnbGreen',
          message: 'Đã giữ chỗ (chưa gửi Owner)',
        });
      }
      setHoldOpen(null);
      setGuest(null);
      setListPrice(0);
      setCollected(0);
      setOwnerPaid(0);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function sendToOwner() {
    if (!submitOpen) return;
    setBusy(true);
    try {
      const sent = await submitBooking(submitOpen.bookingId);
      if (!sent) return;
      notifications.show({ color: 'vbnbGreen', message: 'Đã gửi Owner' });
      setSubmitOpen(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onOwnerCellClick(column: NightBoardColumn, date: string) {
    const status = nightStatus(date, column.board);
    if (status === 'open') {
      void patchInventory(column.assetId, date, 'close');
      return;
    }
    if (status === 'closed') {
      void patchInventory(column.assetId, date, 'open');
      return;
    }
    const stay =
      stayOnNight(date, column.board.holdStays) ||
      stayOnNight(date, column.board.confirmedStays);
    if (stay) {
      setOwnerStay({
        bookingId: stay.bookingId,
        nightStatus: status,
        bookingStatus: stay.status,
      });
    }
  }

  function onOwnerPointerDown(
    e: ReactPointerEvent<HTMLTableCellElement>,
    column: NightBoardColumn,
    date: string
  ) {
    if (role !== 'OWNER' || date < today || busy) return;
    if (e.button !== 0) return;
    const status = nightStatus(date, column.board);
    if (status !== 'open' && status !== 'closed') return;

    ownerPressCleanupRef.current?.();
    suppressClickRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    let timer: number | null = window.setTimeout(() => {
      timer = null;
      suppressClickRef.current = true;
      onCellContext(column, date);
      cleanup();
    }, LONG_PRESS_MS);

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        suppressClickRef.current = true;
        cleanup();
      }
    }
    function onEnd(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      cleanup();
    }
    function cleanup() {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      if (ownerPressCleanupRef.current === cleanup) {
        ownerPressCleanupRef.current = null;
      }
    }
    ownerPressCleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }

  function onSaleOpenPointerDown(column: NightBoardColumn, date: string) {
    if (busy) return;
    dragRef.current = { assetId: column.assetId, start: date, end: date };
    setRangeStart({ assetId: column.assetId, date });
    setRangeHover(date);
    setTapSelecting(false);
  }

  function onSaleOpenPointerEnter(column: NightBoardColumn, date: string) {
    const drag = dragRef.current;
    if (!drag || drag.assetId !== column.assetId) return;
    drag.end = date;
    setRangeHover(date);
  }

  function onSaleTouchSelect(column: NightBoardColumn, date: string) {
    if (busy) return;
    if (!rangeStart || rangeStart.assetId !== column.assetId) {
      setRangeStart({ assetId: column.assetId, date });
      setRangeHover(date);
      setTapSelecting(true);
      return;
    }
    const stay = orderedStay(rangeStart.date, date);
    clearRange();
    if (stayHasBlockedNight(stay.checkIn, stay.checkOut, column.board)) {
      notifications.show({
        color: 'yellow',
        message: 'Khoảng này có đêm đóng / khóa / giữ — chọn lại đêm trống',
      });
      return;
    }
    openHold(column.assetId, stay.checkIn, stay.checkOut);
  }

  function onSaleHoldClick(column: NightBoardColumn, date: string) {
    const stay = stayOnNight(date, column.board.holdStays);
    if (!stay) return;
    if (stay.saleId !== viewerId) {
      notifications.show({
        color: 'yellow',
        message: 'Sale khác đang giữ đêm này — lịch chưa khóa',
      });
      return;
    }
    if (stay.status === 'PENDING') {
      setSubmitOpen({ bookingId: stay.bookingId });
      setCollected(0);
      setOwnerPaid(0);
      return;
    }
    notifications.show({
      message: 'Đã gửi Owner — chờ chủ khóa lịch. Sale không khóa được.',
    });
  }

  function onCellContext(column: NightBoardColumn, date: string) {
    if (role !== 'OWNER' || date < today) return;
    const status = nightStatus(date, column.board);
    if (status !== 'open' && status !== 'closed') return;
    setCostEdit({
      assetId: column.assetId,
      date,
      value: nightDisplayCost(date, column, 'owner'),
    });
  }

  const draftEnd = rangeHover ?? rangeStart?.date ?? null;

  return (
    <>
      <Box
        style={{
          overflow: 'auto',
          maxWidth: '100%',
          maxHeight: isDesktop
            ? undefined
            : 'min(60dvh, calc(100svh - var(--app-shell-header-offset, 56px) - var(--app-shell-footer-offset, 0px) - 10.5rem))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          userSelect: 'none',
        }}
      >
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: columns.length * colWidth + 96,
          }}
        >
          <thead>
            <tr>
              <Th sticky left={0} width={56} stickTop>
                Ngày
              </Th>
              <Th sticky left={56} width={40} stickTop>
                Thứ
              </Th>
              {columns.map((col) => (
                <Th key={col.assetId} width={colWidth} stickTop={stickHeader}>
                  <NightBoardColumnHeader
                    column={col}
                    showOwner={role === 'SALE'}
                    compact={!isDesktop}
                    onOpenGallery={() => setGallery(col)}
                  />
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr key={date}>
                <Td sticky left={0} width={56}>
                  <Text size="xs">{date.slice(5).replace('-', '/')}</Text>
                </Td>
                <Td sticky left={56} width={40}>
                  <Text size="xs" c="dimmed">
                    {weekdayLabel(date)}
                  </Text>
                </Td>
                {columns.map((col) => {
                  const status = nightStatus(date, col.board);
                  const past = date < today;
                  const amount = nightDisplayCost(date, col, audience);
                  const inDraft =
                    !past &&
                    rangeStart?.assetId === col.assetId &&
                    draftEnd != null &&
                    isDateInInclusiveRange(date, rangeStart.date, draftEnd);
                  const tone = inDraft
                    ? bookingStatusColors.selected
                    : cellTone(status);
                  const label =
                    status === 'locked'
                      ? 'khóa'
                      : status === 'closed'
                        ? 'đóng'
                        : status === 'hold'
                          ? 'giữ'
                          : compactCost(amount);
                  return (
                    <td
                      key={`${col.assetId}-${date}`}
                      onClick={() => {
                        if (past || busy) return;
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        if (role === 'OWNER') {
                          onOwnerCellClick(col, date);
                          return;
                        }
                        if (status === 'hold') {
                          clearRange();
                          onSaleHoldClick(col, date);
                          return;
                        }
                        if (
                          status === 'open' &&
                          lastPointerTypeRef.current === 'touch'
                        ) {
                          onSaleTouchSelect(col, date);
                        }
                      }}
                      onPointerDown={(e) => {
                        lastPointerTypeRef.current = e.pointerType;
                        if (past || busy) return;
                        if (role === 'OWNER') {
                          onOwnerPointerDown(e, col, date);
                          return;
                        }
                        if (role !== 'SALE') return;
                        if (status !== 'open') return;
                        if (e.pointerType === 'touch') return;
                        e.preventDefault();
                        onSaleOpenPointerDown(col, date);
                      }}
                      onPointerEnter={() => {
                        if (role !== 'SALE' || past) return;
                        onSaleOpenPointerEnter(col, date);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onCellContext(col, date);
                      }}
                      style={{
                        width: colWidth,
                        height: cellHeight,
                        textAlign: 'center',
                        background: past ? colors.surfaceMuted : tone.bg,
                        color: past
                          ? colors.textMuted
                          : inDraft
                            ? tone.text
                            : tone.text,
                        border: `1px solid ${inDraft ? tone.border : colors.border}`,
                        cursor: past ? 'default' : 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        touchAction: 'manipulation',
                      }}
                    >
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      <Text size="xs" c="dimmed" mt="sm">
        {role === 'OWNER'
          ? isDesktop
            ? 'Bấm ô trắng để đóng đêm, ô xám để mở. Giữ lâu hoặc chuột phải để sửa giá đêm (cost). Ô vàng: chờ Sale gửi hoặc xác nhận. Ô đỏ: đánh giá.'
            : 'Bấm = đóng/mở. Giữ lâu = sửa giá.'
          : tapSelecting
            ? `Đang chọn ${colById.get(rangeStart?.assetId || '')?.title || ''} từ ${rangeStart?.date.slice(5).replace('-', '/')}. Bấm đêm cuối trên cùng căn — bấm lại đêm này nếu chỉ 1 đêm. Esc hủy.`
            : rangeStart
              ? `Đang chọn ${colById.get(rangeStart.assetId)?.title || ''} từ ${rangeStart.date.slice(5).replace('-', '/')}. Kéo tới đêm cuối rồi thả — Esc để hủy.`
              : isDesktop
                ? simpleUi
                  ? 'Bấm đêm rồi gửi chủ. Owner xác nhận mới khóa lịch.'
                  : 'Bấm một đêm rồi bấm đêm cuối (cùng căn), hoặc kéo chuột trên máy tính. Giá = cả khoảng. Gửi Owner không khóa lịch.'
                : simpleUi
                  ? 'Bấm đêm đầu, đêm cuối, rồi gửi chủ.'
                  : 'Bấm đêm đầu, rồi bấm đêm cuối (cùng căn).'}
      </Text>

      <Modal
        opened={!!holdOpen}
        onClose={() => {
          setHoldOpen(null);
          clearRange();
        }}
        title={simpleUi ? 'Gửi chủ' : 'Giữ chỗ'}
      >
        <Stack>
          <Text size="sm">
            {holdNights} đêm · {holdOpen?.checkIn} → {holdOpen?.checkOut}
          </Text>
          {holdPreview ? (
            <Text size="xs" c="dimmed">
              Cost Owner (sau hạng):{' '}
              {formatNumber(holdPreview.effectiveCost)} — giá bán
              không được thấp hơn.
            </Text>
          ) : null}
          <GuestPicker
            value={guest}
            onChange={setGuest}
            suggestions={guestSuggestions}
          />
          <NumberInput
            label={t('listPriceGuestPay')}
            value={listPrice}
            onChange={(v) => setListPrice(Number(v) || 0)}
            min={holdPreview?.effectiveCost || 0}
            thousandSeparator="."
            decimalSeparator=","
          />
          {simpleUi ? null : (
            <>
              <NumberInput
                label={t('collectedGuestMin', {
                  amount: formatNumber(minGuest),
                })}
                value={collected}
                onChange={(v) => setCollected(Number(v) || 0)}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
              />
              <NumberInput
                label={t('collectedOwnerMin', {
                  amount: formatNumber(minOwner),
                })}
                value={ownerPaid}
                onChange={(v) => setOwnerPaid(Number(v) || 0)}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
              />
            </>
          )}
          <Group>
            {simpleUi ? null : (
              <Button
                variant="default"
                loading={busy}
                disabled={!guest || listPrice <= 0}
                onClick={() => void createHold(false)}
              >
                Chỉ giữ chỗ
              </Button>
            )}
            <Button
              color="vbnbGreen"
              loading={busy}
              disabled={!canSubmitHold}
              onClick={() => void createHold(true)}
            >
              Gửi chủ
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            {simpleUi
              ? 'Gửi chủ = chờ Owner khóa lịch. Không cần ghi CK trên tab Giữ.'
              : 'Gửi chủ = chờ Owner khóa. Sale không khóa lịch.'}
          </Text>
        </Stack>
      </Modal>

      <Modal
        opened={!!submitOpen}
        onClose={() => setSubmitOpen(null)}
        title="Chưa gửi Owner"
      >
        <Stack>
          <Text size="sm">
            {simpleUi
              ? 'Booking đang giữ. Gửi chủ — lịch khóa khi Owner xác nhận.'
              : 'Booking đang giữ (PENDING). Điền đã thu / đã CK rồi gửi chủ — lịch vẫn chưa khóa.'}
          </Text>
          {simpleUi ? null : (
            <>
              <NumberInput
                label={t('collectedGuest')}
                value={collected}
                onChange={(v) => setCollected(Number(v) || 0)}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
              />
              <NumberInput
                label={t('collectedOwner')}
                value={ownerPaid}
                onChange={(v) => setOwnerPaid(Number(v) || 0)}
                min={0}
                thousandSeparator="."
                decimalSeparator=","
              />
            </>
          )}
          <Button
            color="vbnbGreen"
            loading={busy}
            onClick={() => void sendToOwner()}
          >
            Gửi chủ
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!ownerStay}
        onClose={() => setOwnerStay(null)}
        title={
          ownerStay?.nightStatus === 'locked'
            ? 'Đã khóa'
            : ownerStay?.bookingStatus === 'PENDING'
              ? 'Sale đang giữ'
              : 'Chờ xác nhận'
        }
      >
        {ownerStay?.nightStatus === 'hold' &&
        ownerStay.bookingStatus === 'PENDING' ? (
          <Text size="sm">
            Sale đang giữ chỗ, chưa gửi. Không khóa được cho đến khi Sale bấm
            gửi chủ.
          </Text>
        ) : ownerStay?.nightStatus === 'hold' ? (
          <OwnerBookingActions
            bookingId={ownerStay.bookingId}
            requireStkCheck={false}
          />
        ) : ownerStay ? (
          <OwnerSaleRatingForm
            bookingId={ownerStay.bookingId}
            rating={ratingsByBooking[ownerStay.bookingId] ?? null}
          />
        ) : null}
      </Modal>

      <Modal
        opened={!!costEdit}
        onClose={() => setCostEdit(null)}
        title={t('costNightTitle')}
      >
        <Stack>
          <TextInput value={costEdit?.date ?? ''} readOnly label={t('night')} />
          <NumberInput
            label={t('costInput')}
            value={costEdit?.value ?? 0}
            onChange={(v) =>
              setCostEdit((cur) =>
                cur ? { ...cur, value: Number(v) || 0 } : cur
              )
            }
            min={0}
            thousandSeparator="."
            decimalSeparator=","
          />
          <Group>
            <Button
              variant="default"
              onClick={() => {
                if (!costEdit) return;
                void patchInventory(
                  costEdit.assetId,
                  costEdit.date,
                  'set_cost',
                  null
                );
                setCostEdit(null);
              }}
            >
              Xóa giá đêm
            </Button>
            <Button
              color="vbnbGreen"
              onClick={() => {
                if (!costEdit) return;
                void patchInventory(
                  costEdit.assetId,
                  costEdit.date,
                  'set_cost',
                  costEdit.value
                );
                setCostEdit(null);
              }}
            >
              Lưu
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={!!gallery}
        onClose={() => setGallery(null)}
        title={gallery?.title}
        size="xl"
      >
        {gallery ? (
          <>
            <AssetDetailGallery
              title={gallery.title}
              images={columnGalleryImages(gallery)}
            />
            {gallery.detailHref ? (
              <Link href={gallery.detailHref} style={{ textDecoration: 'none' }}>
                <Text size="sm" c="vbnbGreen.6" mt="md">
                  Xem căn (Nâng cao)
                </Text>
              </Link>
            ) : null}
            {role === 'SALE' ? (
              <Stack gap={6} mt="md">
                <Text size="sm">{gallery.ownerName || 'Owner'}</Text>
                {gallery.ownerPhone ? (
                  <Text
                    component="a"
                    href={`tel:${gallery.ownerPhone}`}
                    size="sm"
                    c="vbnbGreen.6"
                  >
                    {gallery.ownerPhone}
                  </Text>
                ) : (
                  <Text size="sm" c="dimmed">
                    Chưa có SĐT
                  </Text>
                )}
                {gallery.slug ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="vbnbGreen"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        guestShareUrl(gallery.slug!)
                      );
                      notifications.show({
                        color: 'vbnbGreen',
                        message: 'Đã copy',
                        autoClose: 2000,
                      });
                    }}
                  >
                    Copy link khách
                  </Button>
                ) : null}
              </Stack>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}

function Th({
  children,
  sticky,
  left,
  width,
  stickTop,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  left?: number;
  width: number;
  stickTop?: boolean;
}) {
  const pinned = Boolean(sticky || stickTop);
  return (
    <th
      style={{
        position: pinned ? 'sticky' : undefined,
        left: sticky ? left : undefined,
        top: stickTop ? 0 : undefined,
        zIndex: sticky && stickTop ? 5 : sticky ? 3 : stickTop ? 4 : undefined,
        background: colors.surface,
        boxShadow: stickTop ? `0 1px 0 ${colors.border}` : undefined,
        border: `1px solid ${colors.border}`,
        padding: 8,
        width,
        minWidth: width,
        verticalAlign: 'top',
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  sticky,
  left,
  width,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  left?: number;
  width: number;
}) {
  return (
    <td
      style={{
        position: sticky ? 'sticky' : undefined,
        left,
        zIndex: sticky ? 2 : undefined,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        padding: 6,
        width,
        minWidth: width,
      }}
    >
      {children}
    </td>
  );
}
