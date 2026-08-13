import { describe, expect, it } from 'vitest';
import {
  extractPaymentCode,
  isPaymentCode,
  PAYMENT_CODE_ALPHABET,
} from '@/lib/sepay/payment-code';
import {
  buildActivationNote,
  decidePaymentMatch,
} from '@/lib/engines/subscription-payment-match';
import { generatePaymentCode } from '@/lib/engines/subscription-payment';

describe('sepay payment code', () => {
  it('generates codes that match the matching pattern', () => {
    for (let i = 0; i < 50; i++) {
      const code = generatePaymentCode();
      expect(isPaymentCode(code)).toBe(true);
    }
  });

  it('excludes ambiguous glyphs from the alphabet', () => {
    for (const glyph of ['I', 'O', '0', '1']) {
      expect(PAYMENT_CODE_ALPHABET).not.toContain(glyph);
    }
  });

  it('prefers the extracted code field', () => {
    expect(
      extractPaymentCode({ code: 'VBABCD2345', content: 'VBZZZZ9999' })
    ).toBe('VBABCD2345');
  });

  it('falls back to the raw transfer content', () => {
    expect(
      extractPaymentCode({
        code: '',
        content: 'CT DEN:123456 NGUYEN VAN A CHUYEN TIEN VBABCD2345 GD 001',
      })
    ).toBe('VBABCD2345');
  });

  it('normalizes lowercase content', () => {
    expect(extractPaymentCode({ content: 'thanh toan vbabcd2345' })).toBe(
      'VBABCD2345'
    );
  });

  it('ignores a code field that is not a payment code and scans content', () => {
    expect(
      extractPaymentCode({ code: 'FT2401', content: 'sub VBABCD2345' })
    ).toBe('VBABCD2345');
  });

  it('returns empty when nothing looks like a payment code', () => {
    expect(extractPaymentCode({ code: '', content: 'CHUYEN TIEN' })).toBe('');
  });
});

describe('sepay payment matching', () => {
  it('treats a paid intent as already done', () => {
    expect(
      decidePaymentMatch({
        intentStatus: 'PAID',
        expectedAmount: 200_000,
        transferAmount: 200_000,
      }).action
    ).toBe('ALREADY_PAID');
  });

  it('requires the exact amount', () => {
    const decision = decidePaymentMatch({
      intentStatus: 'PENDING',
      expectedAmount: 200_000,
      transferAmount: 199_000,
    });
    expect(decision.action).toBe('AMOUNT_MISMATCH');
    expect(decision.note).toContain('expected=200000');
  });

  it('flags an overpayment instead of activating', () => {
    expect(
      decidePaymentMatch({
        intentStatus: 'PENDING',
        expectedAmount: 200_000,
        transferAmount: 250_000,
      }).action
    ).toBe('AMOUNT_MISMATCH');
  });

  it('claims an exact-amount transfer', () => {
    expect(
      decidePaymentMatch({
        intentStatus: 'PENDING',
        expectedAmount: 600_000,
        transferAmount: 600_000,
      }).action
    ).toBe('CLAIM');
  });

  it('still honours late, cancelled or previously mismatched intents', () => {
    for (const status of ['EXPIRED', 'CANCELLED', 'AMOUNT_MISMATCH']) {
      expect(
        decidePaymentMatch({
          intentStatus: status,
          expectedAmount: 200_000,
          transferAmount: 200_000,
        }).action
      ).toBe('CLAIM');
    }
  });

  it('records the origin status when a late transfer is honoured', () => {
    expect(
      buildActivationNote({ extended: false, claimedFromStatus: 'PENDING' })
    ).toBe('ACTIVATED');
    expect(
      buildActivationNote({ extended: true, claimedFromStatus: 'PENDING' })
    ).toBe('EXTENDED');
    expect(
      buildActivationNote({ extended: true, claimedFromStatus: 'EXPIRED' })
    ).toBe('EXTENDED_FROM_EXPIRED');
  });
});
