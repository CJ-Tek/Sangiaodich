'use client';

import { useEffect, useRef } from 'react';

/**
 * Opening the leads page is what marks them read. The already-rendered list
 * keeps its "New" markers on purpose — the watermark only affects what counts
 * as unread the next time the page is opened.
 */
export function MarkLeadsSeen({ hasUnread }: { hasUnread: boolean }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!hasUnread || sent.current) return;
    sent.current = true;
    fetch('/api/sale/leads/seen', { method: 'POST' }).catch(() => {
      // Losing a watermark update only means the badge stays up until the next
      // visit, so there is nothing worth surfacing to the sale here.
    });
  }, [hasUnread]);

  return null;
}
