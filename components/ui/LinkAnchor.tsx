'use client';

import { Anchor, type AnchorProps } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';

type Props = Omit<AnchorProps, 'component' | 'href'> & {
  href: string;
  children?: ReactNode;
};

export function LinkAnchor({ href, children, ...props }: Props) {
  return (
    <Anchor component={Link} href={href} {...props}>
      {children}
    </Anchor>
  );
}
