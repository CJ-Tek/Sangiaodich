import type { ReactNode } from 'react';

function Svg({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconHome({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

export function IconStore({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <path d="M4 10V8l1.5-4h13L20 8v2" />
      <path d="M4 10h16v10H4V10Z" />
      <path d="M9 20v-6h6v6" />
    </Svg>
  );
}

export function IconUsers({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.2c2 .4 3.6 1.8 4.2 4.3" />
    </Svg>
  );
}

export function IconCalendar({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </Svg>
  );
}

export function IconSettings({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7 1 1.2 1.7 1.2H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </Svg>
  );
}

export function IconUser({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-3.6 3.6-5.5 7-5.5S18 16.4 19 20" />
    </Svg>
  );
}

export function IconCompass({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 6-6 2 2-6 6-2Z" />
    </Svg>
  );
}

export function IconInbox({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <path d="M4 12h4l2 3h4l2-3h4v7H4v-7Z" />
      <path d="M4 12 6.5 5h11L20 12" />
    </Svg>
  );
}

export function IconClipboard({ color }: { color: string }) {
  return (
    <Svg color={color}>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 12h6M9 16h4" />
    </Svg>
  );
}
