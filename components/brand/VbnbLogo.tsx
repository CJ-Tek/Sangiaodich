import Image from 'next/image';

const SOURCES = {
  full: {
    color: '/brand/vbnb-logo.svg',
    white: '/brand/vbnb-logo-white.svg',
    ratio: 360 / 77,
  },
  mark: {
    color: '/brand/vbnb-mark.svg',
    white: '/brand/vbnb-mark.svg',
    ratio: 350 / 224,
  },
} as const;

type VbnbLogoProps = {
  /** `full` = mark + wordmark, `mark` = pictorial mark only. */
  variant?: 'full' | 'mark';
  /** `white` swaps the wordmark to white for dark surfaces. */
  tone?: 'color' | 'white';
  height?: number;
  priority?: boolean;
  alt?: string;
};

export function VbnbLogo({
  variant = 'full',
  tone = 'color',
  height = 28,
  priority = false,
  alt = 'VBNB',
}: VbnbLogoProps) {
  const source = SOURCES[variant];
  const width = Math.round(height * source.ratio);

  return (
    <Image
      src={source[tone]}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      style={{ display: 'block', height, width, flexShrink: 0 }}
    />
  );
}
