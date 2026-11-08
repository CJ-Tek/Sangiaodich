'use client';

import { Accordion, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { colors, radius, typography } from '@/config/design-tokens';
import { Reveal } from '@/components/landing/Reveal';
import { SectionShell } from '@/components/ui/SectionShell';

export type FaqItem = { question: string; answer: string };

export function FaqSection() {
  const t = useTranslations('landing.faq');
  const items = t.raw('items') as FaqItem[];

  return (
    <SectionShell id="faq" eyebrow={t('eyebrow')} title={t('title')} align="center">
      <Reveal style={{ maxWidth: 820, marginInline: 'auto' }}>
        <Accordion
          variant="separated"
          order={3}
          radius={radius.lg}
          chevronPosition="right"
          styles={{
            item: {
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            },
            control: { paddingBlock: 6 },
            label: {
              fontWeight: 600,
              fontSize: '1rem',
              color: colors.textPrimary,
            },
          }}
        >
          {items.map((item, index) => (
            <Accordion.Item key={item.question} value={`faq-${index}`}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text
                  c={colors.textSecondary}
                  style={{ fontSize: typography.body.fontSize, lineHeight: 1.65 }}
                >
                  {item.answer}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Reveal>
    </SectionShell>
  );
}
