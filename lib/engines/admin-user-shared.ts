import type { UserRole } from '@/lib/types';
import { phoneFieldMatch } from '@/lib/phone/vn-search';

export type AdminUserSub = {
  status: string;
  period_end: string;
} | null;

export type AdminUserRow = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  delete_reason: string | null;
  subscription: AdminUserSub;
};

export class AdminUserError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AdminUserError';
  }
}

export function matchesAdminUserSearch(
  query: string,
  fullName: string,
  phone: string | null,
  email: string | null
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (fullName.toLowerCase().includes(q)) return true;
  if (email && email.toLowerCase().includes(q)) return true;
  if (phoneFieldMatch(q, phone)) return true;
  return false;
}

export function hardDeleteBlockedMessage(): string {
  return 'Xóa vĩnh viễn bị chặn theo chính sách hệ thống';
}
