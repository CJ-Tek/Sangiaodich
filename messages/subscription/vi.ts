export const subscriptionVi = {
  planPicker: {
    createIntentFailed: 'Không tạo được mã thanh toán',
    networkError: 'Lỗi mạng',
    paymentReceived: 'Đã nhận thanh toán — subscription được kích hoạt',
    gatewayNotReady: 'Gateway chưa sẵn sàng',
    gatewayOpenFailed: 'Lỗi mở cổng SePay',
    choosePlanTitle: 'Chọn gói subscription',
    choosePlanDesc:
      'Chạm gói để tạo QR — số tiền và nội dung CK đã sẵn trong QR, không cần nhập tay.',
    pendingTitle: 'Đang chờ thanh toán',
    pendingDesc:
      'Sau khi chuyển khoản, trang sẽ tự cập nhật trong 1–3 phút, không cần refresh. Nếu quá 15 phút chưa ACTIVE, liên hệ Admin.',
    selectedPlan: 'Gói đã chọn',
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
    activeTitle: 'Đã kích hoạt',
    inactiveTitle: 'Chưa kích hoạt',
    activeStatus: 'ACTIVE',
    inactiveStatus: 'INACTIVE',
    defaultActiveDesc: 'Subscription đang hoạt động',
    defaultInactiveDesc: 'Subscription INACTIVE — bị hạn chế',
    periodUntil: 'đến {date}',
    defaultActiveAction: 'Gói subscription',
    defaultInactiveAction: 'Gia hạn',
  },
};
