'use client';

import { Group, Text, UnstyledButton } from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { colors } from '@/config/design-tokens';
import type { AppLocale } from '@/lib/i18n/routing';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  function switchLocale(next: AppLocale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  const btn = (code: AppLocale, label: string) => {
    const active = locale === code;
    return (
      <UnstyledButton
        onClick={() => switchLocale(code)}
        aria-label={t('switchLanguage', { lang: label })}
        aria-current={active ? 'true' : undefined}
      >
        <Text
          size={compact ? 'xs' : 'sm'}
          fw={active ? 700 : 500}
          c={active ? colors.primaryDark : colors.textMuted}
          td={active ? undefined : 'underline'}
          style={{ textUnderlineOffset: 3 }}
        >
          {label}
        </Text>
      </UnstyledButton>
    );
  };

  return (
    <Group gap={6} wrap="nowrap">
      {btn('vi', 'VI')}
      <Text size={compact ? 'xs' : 'sm'} c={colors.textMuted}>
        |
      </Text>
      {btn('en', 'EN')}
    </Group>
  );
}
