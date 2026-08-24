import type { ReactNode } from 'react';

function Svg({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconTag({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M20.5 13.2 12.8 20.9a1.8 1.8 0 0 1-2.5 0L3.2 13.8a1.8 1.8 0 0 1 0-2.5L11 3.5H20.5V13.2Z" />
      <circle cx="16.2" cy="7.8" r="1.2" />
    </Svg>
  );
}

export function IconMapPin({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </Svg>
  );
}

export function IconCalendar({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </Svg>
  );
}

export function IconUsers({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 19a4.8 4.8 0 0 1 4.5-5" />
    </Svg>
  );
}

export function IconHome({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Svg>
  );
}

export function IconBriefcase({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="3" y="8" width="18" height="12.5" rx="2" />
      <path d="M8 8V6.5A2.5 2.5 0 0 1 10.5 4h3A2.5 2.5 0 0 1 16 6.5V8" />
      <path d="M3 13h18" />
    </Svg>
  );
}

export function IconSun({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Svg>
  );
}

export function IconBolt({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M13 3 5 14h7l-1 7 8-11h-7l1-7Z" />
    </Svg>
  );
}

export function IconClock({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconTrend({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M4 16.5 10 10l4 4 6-7.5" />
      <path d="M15 6.5h5v5" />
    </Svg>
  );
}

export function IconShield({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M12 3.5 5 6.5v6.2c0 4.2 2.8 7.4 7 8.8 4.2-1.4 7-4.6 7-8.8V6.5L12 3.5Z" />
    </Svg>
  );
}

export function IconNetwork({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="17" r="2.2" />
      <path d="M8 8.2 10.6 15M16 8.2 13.4 15" />
    </Svg>
  );
}

export function IconArrowRight({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconChevronDown({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function IconCoins({ size }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="9.5" cy="10" r="5.5" />
      <path d="M14.2 7.2a5.5 5.5 0 1 1 0 9.6" />
      <path d="M9.5 7.8v4.4M8 10h3" />
    </Svg>
  );
}
