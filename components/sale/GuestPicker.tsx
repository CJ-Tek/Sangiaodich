'use client';

import { Loader, Select } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import type { GuestOption } from '@/lib/engines/sale-guest-search';

const MIN_SEARCH_LENGTH = 2;

/**
 * Searches on the server instead of receiving the guest directory as props.
 * `suggestions` are the sale's own saved customers, so the field is useful
 * before the first keystroke.
 */
export function GuestPicker({
  value,
  onChange,
  suggestions,
}: {
  value: GuestOption | null;
  onChange: (guest: GuestOption | null) => void;
  suggestions: GuestOption[];
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  // Answered query travels with its rows, so both "is this stale" and "is a
  // request in flight" are derived rather than tracked in their own state.
  const [answer, setAnswer] = useState<{
    query: string;
    options: GuestOption[];
  }>({ query: '', options: [] });

  const query = debouncedSearch.trim();
  const searching = query.length >= MIN_SEARCH_LENGTH;
  const loading = searching && answer.query !== query;

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length < MIN_SEARCH_LENGTH) return;

    const controller = new AbortController();
    fetch(`/api/sale/guests/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json) => setAnswer({ query: q, options: json?.data?.guests || [] }))
      .catch(() => {
        // Aborted by the next keystroke, or the request failed — either way the
        // previous rows stay on screen instead of blanking the field.
        setAnswer((prev) => ({ ...prev, query: q }));
      });

    return () => controller.abort();
  }, [debouncedSearch]);

  // The selected guest must stay in the list or Mantine renders a blank field
  // once the search that produced it is replaced.
  const data = useMemo(() => {
    const results = searching ? answer.options : [];
    const byValue = new Map<string, GuestOption>();
    for (const option of [...suggestions, ...results, ...(value ? [value] : [])]) {
      byValue.set(option.value, option);
    }
    return [...byValue.values()];
  }, [suggestions, searching, answer.options, value]);

  return (
    <Select
      label="Guest"
      description="Gõ tên hoặc SĐT để tìm guest trên hệ thống"
      data={data}
      value={value?.value ?? null}
      onChange={(next, option) =>
        onChange(next ? { value: next, label: option?.label ?? next } : null)
      }
      searchable
      searchValue={search}
      onSearchChange={setSearch}
      rightSection={loading ? <Loader size="xs" /> : undefined}
      nothingFoundMessage={
        search.trim().length < MIN_SEARCH_LENGTH
          ? `Gõ ít nhất ${MIN_SEARCH_LENGTH} ký tự`
          : 'Không có guest'
      }
      filter={({ options }) => options}
    />
  );
}
