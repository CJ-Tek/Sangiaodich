'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';

/**
 * Fades children up when they scroll into view.
 * Server HTML is always fully visible (crawlers, no-JS); only elements that start
 * below the fold are hidden after hydration, then revealed once.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'li';
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.reveal = 'shown';
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (el.dataset.reveal === 'pending') delete el.dataset.reveal;
    };
  }, []);

  return (
    <Tag
      ref={ref as Ref<HTMLDivElement & HTMLLIElement>}
      className={className ? `vbnb-reveal ${className}` : 'vbnb-reveal'}
      style={{ '--vbnb-reveal-delay': `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
