export const subscriptionVi = {
  planPicker: {
    createIntentFailed: 'Không tạo được mã thanh toán',
    networkError: 'Lỗi mạng',
    paymentReceived: 'Đã nhận thanh toán — subscription được kích hoạt',
    gatewayNotReady: 'Gateway chưa sẵn sàng',
    gatewayOpenFailed: 'Lỗi mở cổng SePay',
    choosePlanTitle: 'Chọn gói gia hạn',
    choosePlanDesc:
      'Chạm gói để tạo QR — số tiền và nội dung CK đã sẵn trong QR, không cần nhập tay.',
    pendingTitle: 'Đang chờ thanh toán',
    pendingDesc:
      'Sau khi chuyển khoản, trang sẽ tự cập nhật trong 1–3 phút, không cần refresh. Nếu quá 15 phút chưa kích hoạt, liên hệ Admin.',
    selectedPlan: 'Gói đã chọn',
    choosePlanCta: 'Chọn gói này →',
    selectedPlanShort: 'Đang chọn',
    qrScanHint:
      'Quét QR bằng app ngân hàng — nội dung CK đã điền sẵn mã {paymentCode}.',
    qrAlt: 'QR thanh toán subscription',
    noVietQrConfig:
      'Chưa cấu hình STK / mã ngân hàng VietQR trên Admin — chỉ dùng được nội dung CK bên dưới hoặc Mark paid.',
    accountNumber: 'Số tài khoản',
    amount: 'Số tiền',
    transferMemo: 'Nội dung CK (đã có trong QR)',
    payViaGateway: 'Thanh toán qua cổng SePay',
  },
  paymentInstructions: {
    noPaymentInfo:
      'Chưa có thông tin chuyển khoản — liên hệ Admin để được hướng dẫn thanh toán.',
    offlineTransfer: 'Chuyển khoản offline',
    bank: 'Ngân hàng',
    accountName: 'Chủ tài khoản',
    accountNumber: 'Số tài khoản',
    amountPerMonth: 'Số tiền / tháng',
    transferContent: 'Nội dung chuyển khoản',
    contact: 'Liên hệ:',
    qrAlt: 'QR thanh toán',
  },
  statusBanner: {
    activeTitle: 'Gói đang hoạt động',
    expiredTitle: 'Gói đã hết hạn',
    inactiveTitle: 'Chưa kích hoạt gói',
    defaultActiveDesc: 'Bạn dùng được đầy đủ tính năng',
    defaultInactiveDesc: 'Một số tính năng bị khóa — gia hạn để tiếp tục',
    periodUntil: 'đến {date}',
    expiredSince: 'từ {date}',
    defaultActiveAction: 'Gói subscription',
    defaultInactiveAction: 'Gia hạn',
  },
};
