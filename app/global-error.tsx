'use client';

import { useEffect } from 'react';
import { colors, radius } from '@/config/design-tokens';

/**
 * Replaces the root layout, so it cannot use Mantine or any provider —
 * plain markup only, otherwise the fallback can crash the same way.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.background,
          color: colors.textPrimary,
          fontFamily:
            'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            margin: 16,
            padding: 32,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Đã có lỗi xảy ra
          </h1>
          <p style={{ color: colors.textSecondary, fontSize: 14 }}>
            Ứng dụng gặp sự cố ngoài dự kiến. Thử tải lại trang.
          </p>

          {error.digest ? (
            <p style={{ color: colors.textMuted, fontSize: 12 }}>
              Mã lỗi: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: colors.surface,
              background: colors.primary,
              border: 'none',
              borderRadius: radius.md,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
