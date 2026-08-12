export type UserRole = 'ADMIN' | 'OWNER' | 'SALE' | 'GUEST';

export type AssetStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'INACTIVE'
  | 'SUSPENDED';

export type PropertyType = 'VILLA' | 'APARTMENT';

export type BookingStatus =
  | 'PENDING'
  | 'AWAITING_OWNER'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { code: string; message: string };
};
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function fail(code: string, message: string): ApiError {
  return { success: false, error: { code, message } };
}
