'use client';

import Link from 'next/link';
import { Button, type ButtonProps } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = Omit<ButtonProps, 'component'> & {
  href: string;
  children?: ReactNode;
};

export function LinkButton({ href, children, ...props }: Props) {
  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}
