export const subscriptionEn = {
  planPicker: {
    createIntentFailed: 'Could not create payment code',
    networkError: 'Network error',
    paymentReceived: 'Payment received — subscription activated',
    gatewayNotReady: 'Payment gateway not ready',
    gatewayOpenFailed: 'Could not open SePay gateway',
    choosePlanTitle: 'Choose subscription plan',
    choosePlanDesc:
      'Tap a plan to generate a QR code — amount and transfer memo are pre-filled, no manual entry.',
    pendingTitle: 'Awaiting payment',
    pendingDesc:
      'After transfer, this page updates within 1–3 minutes — no refresh needed. If still not ACTIVE after 15 minutes, contact Admin.',
    selectedPlan: 'Selected plan',
    qrScanHint:
      'Scan QR with your banking app — transfer memo includes code {paymentCode}.',
    qrAlt: 'Subscription payment QR',
    noVietQrConfig:
      'Admin has not configured VietQR bank account — use transfer memo below or Mark paid.',
    accountNumber: 'Account number',
    amount: 'Amount',
    transferMemo: 'Transfer memo (included in QR)',
    payViaGateway: 'Pay via SePay gateway',
  },
  paymentInstructions: {
    noPaymentInfo:
      'No bank transfer details yet — contact Admin for payment instructions.',
    offlineTransfer: 'Offline bank transfer',
    bank: 'Bank',
    accountName: 'Account name',
    accountNumber: 'Account number',
    amountPerMonth: 'Amount / month',
    transferContent: 'Transfer memo',
    contact: 'Contact:',
    qrAlt: 'Payment QR',
  },
  statusBanner: {
    activeTitle: 'Active',
    inactiveTitle: 'Not active',
    activeStatus: 'ACTIVE',
    inactiveStatus: 'INACTIVE',
    defaultActiveDesc: 'Subscription is active',
    defaultInactiveDesc: 'Subscription INACTIVE — access limited',
    periodUntil: 'until {date}',
    defaultActiveAction: 'Membership',
    defaultInactiveAction: 'Renew',
  },
};
