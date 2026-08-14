'use client';

import { Select, Stack, Text, type ComboboxItem, type OptionsFilter } from '@mantine/core';
import { useMemo } from 'react';
import {
  findVietQrBank,
  normalizeBankSearch,
  VIETQR_BANKS,
  type VietQrBank,
} from '@/lib/sepay/vietqr-banks';

const BANK_OPTIONS: ComboboxItem[] = VIETQR_BANKS.map((bank) => ({
  value: bank.bankCode,
  label: `${bank.bankShortName} (${bank.bankCode})`,
}));

const BANKS_BY_CODE = new Map(
  VIETQR_BANKS.map((bank) => [bank.bankCode, bank])
);

const filterBanks: OptionsFilter = ({ options, search, limit }) => {
  const query = normalizeBankSearch(search);
  const result: ComboboxItem[] = [];
  for (const option of options) {
    if (result.length >= limit) break;
    if (!('value' in option) || !('label' in option)) continue;
    const bank = BANKS_BY_CODE.get(String(option.value));
    const haystack = normalizeBankSearch(
      [option.label, bank?.bankName, bank?.bankCode, bank?.bankShortName]
        .filter(Boolean)
        .join(' ')
    );
    if (!query || haystack.includes(query)) {
      result.push(option);
    }
  }
  return result;
};

export function VietQrBankSelect({
  value,
  onChange,
  label = 'Mã NH VietQR',
  description = 'Chọn ngân hàng để tạo QR động kèm số tiền + nội dung. Gõ tên hoặc mã để tìm.',
}: {
  value: string;
  onChange: (bank: VietQrBank | null) => void;
  label?: string;
  description?: string;
}) {
  const matched = findVietQrBank(value);
  const selectValue = matched?.bankCode ?? (value.trim() || null);

  const data = useMemo(() => {
    if (matched || !value.trim()) return BANK_OPTIONS;
    return [{ value: value.trim(), label: value.trim() }, ...BANK_OPTIONS];
  }, [matched, value]);

  return (
    <Select
      label={label}
      description={description}
      placeholder="Vietcombank"
      data={data}
      value={selectValue}
      onChange={(next) => {
        if (!next) {
          onChange(null);
          return;
        }
        onChange(
          findVietQrBank(next) ?? {
            bankCode: next,
            bankName: next,
            bankShortName: next,
          }
        );
      }}
      searchable
      clearable
      nothingFoundMessage="Không tìm thấy ngân hàng"
      filter={filterBanks}
      maxDropdownHeight={280}
      renderOption={({ option }) => {
        const bank = BANKS_BY_CODE.get(String(option.value));
        if (!bank) {
          return (
            <Text size="sm" truncate>
              {option.label}
            </Text>
          );
        }
        return (
          <Stack gap={0}>
            <Text size="sm">
              {bank.bankShortName} ({bank.bankCode})
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {bank.bankName}
            </Text>
          </Stack>
        );
      }}
    />
  );
}
