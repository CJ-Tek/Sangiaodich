import { VbnbLogo } from '@/components/brand/VbnbLogo';

/** Wordmark on most phones; mark only below 400px so header controls fit on one row. */
export function ShellLogo({ height = 24 }: { height?: number }) {
  return (
    <>
      <span className="vbnb-shell-logo-full">
        <VbnbLogo height={height} priority />
      </span>
      <span className="vbnb-shell-logo-mark">
        <VbnbLogo variant="mark" height={height + 2} priority />
      </span>
    </>
  );
}
