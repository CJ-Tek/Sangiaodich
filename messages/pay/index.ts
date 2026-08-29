export const payVi = {
  invoice: {
    payOwnerAtCheckIn: 'Chuyển cho chủ nhà lúc nhận phòng',
    saleContact: 'Sale: {name} · {phone}',
    memoLabel: 'Mã CK',
    paidFull: 'Đã ghi nhận đủ',
    ownerPaidNote:
      'Chủ nhà đã ghi nhận đủ phần còn lại cho booking này.',
    salePaidNote:
      'Sale đã xác nhận thu đủ giá bán cho booking này.',
    countdown: 'Còn {time} để chuyển',
    ownerRemainderHint:
      'Chuyển nốt phần còn lại cho chủ nhà theo QR bên dưới.',
    saleDepositHint:
      'Chuyển nhanh để Sale gửi Owner giữ chỗ. Lịch chưa khóa — chậm có thể bị người khác book.',
    confirmedRemainder:
      'Phòng đã được xác nhận. Chuyển nốt phần còn lại theo QR bên dưới.',
    expiredTitle: 'Hết thời gian trên link này',
    expiredBody:
      'Link đã hết hạn. Liên hệ chủ nhà/Sale để được hướng dẫn thanh toán lại.',
    mayBeTaken:
      'Booking này có thể đã bị người khác book nếu bạn chưa kịp chuyển.',
    viewCalendar: 'Xem lịch villa',
    depositPreset: 'Chuyển cọc ({amount})',
    fullPreset: 'Chuyển full ({amount})',
    remainderAtCheckIn: 'Phần còn lại lúc nhận phòng',
    qrTitle: 'QR chuyển khoản',
    qrFailed:
      'Chưa tạo được QR — dùng STK bên dưới và dán mã CK.',
    vietQr: 'VietQR',
    staticQr: 'QR tĩnh',
    memoRequired:
      'Nội dung CK phải có mã {memo} để {payee} đối soát.',
    payeeOwner: 'chủ nhà',
    payeeSale: 'Sale',
    villaFallback: 'Villa',
    saleFallback: 'Sale',
  },
} as const;

export const payEn = {
  invoice: {
    payOwnerAtCheckIn: 'Pay owner at check-in',
    saleContact: 'Sale: {name} · {phone}',
    memoLabel: 'Transfer memo',
    paidFull: 'Fully recorded',
    ownerPaidNote:
      'Owner recorded the full remainder for this booking.',
    salePaidNote:
      'Sale confirmed full list price collected for this booking.',
    countdown: '{time} left to transfer',
    ownerRemainderHint:
      'Pay the remainder to the owner using the QR below.',
    saleDepositHint:
      'Transfer quickly so the sale can submit to owner. Dates not locked — delay may lose the slot.',
    confirmedRemainder:
      'Booking confirmed. Pay the remainder using the QR below.',
    expiredTitle: 'This link has expired',
    expiredBody:
      'Link expired. Contact owner/sale for payment instructions.',
    mayBeTaken:
      'This booking may have been taken if you did not transfer in time.',
    viewCalendar: 'View villa calendar',
    depositPreset: 'Pay deposit ({amount})',
    fullPreset: 'Pay full ({amount})',
    remainderAtCheckIn: 'Remainder at check-in',
    qrTitle: 'Transfer QR',
    qrFailed:
      'Could not create QR — use account details below and include transfer memo.',
    vietQr: 'VietQR',
    staticQr: 'Static QR',
    memoRequired:
      'Transfer description must include {memo} for {payee} reconciliation.',
    payeeOwner: 'owner',
    payeeSale: 'sale',
    villaFallback: 'Villa',
    saleFallback: 'Sale',
  },
} as const;
