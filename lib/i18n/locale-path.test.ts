import { describe, expect, it } from 'vitest';
import {
  localeFromPath,
  stripLocalePrefix,
  withLocalePath,
} from './locale-path';

describe('locale-path', () => {
  it('stripLocalePrefix leaves default locale paths unchanged', () => {
    expect(stripLocalePrefix('/login')).toBe('/login');
    expect(stripLocalePrefix('/owner/assets')).toBe('/owner/assets');
  });

  it('stripLocalePrefix removes English prefix', () => {
    expect(stripLocalePrefix('/en')).toBe('/');
    expect(stripLocalePrefix('/en/login')).toBe('/login');
    expect(stripLocalePrefix('/en/owner/calendar')).toBe('/owner/calendar');
  });

  it('localeFromPath detects English prefix', () => {
    expect(localeFromPath('/login')).toBe('vi');
    expect(localeFromPath('/en/login')).toBe('en');
    expect(localeFromPath('/en')).toBe('en');
  });

  it('withLocalePath prefixes non-default locale', () => {
    expect(withLocalePath('/login', 'vi')).toBe('/login');
    expect(withLocalePath('/login', 'en')).toBe('/en/login');
    expect(withLocalePath('/', 'en')).toBe('/en');
  });
});
