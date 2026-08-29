'use client';

import {
  Anchor,
  Button,
  Checkbox,
  Group,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { colors, radius, typography } from '@/config/design-tokens';
import { appHrefForRole } from '@/lib/i18n/app-href';
import { Link } from '@/lib/i18n/navigation';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import type { AppLocale } from '@/lib/i18n/routing';

type Mode = 'login' | 'register';
type RegisterStep = 'role' | 'form';
type RegisterRole = 'GUEST' | 'SALE' | 'OWNER';

const REGISTER_ROLES: RegisterRole[] = ['GUEST', 'SALE', 'OWNER'];

/** Hard navigation so middleware sees auth cookies set by the login API. */
function redirectAfterAuth(href: string) {
  window.location.assign(href);
}

function safeNextPath(next: string): string | null {
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

const REMEMBER_KEY = 'vbnb.login.identifier';

function readRememberedIdentifier(): string | null {
  try {
    const saved = localStorage.getItem(REMEMBER_KEY)?.trim();
    return saved || null;
  } catch {
    return null;
  }
}

function persistRememberedIdentifier(value: string) {
  try {
    localStorage.setItem(REMEMBER_KEY, value.trim());
  } catch {
    // Private mode may block localStorage.
  }
}

function clearRememberedIdentifier() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore
  }
}

export function LoginForm() {
  const search = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const next = search.get('next') || '';

  const [mode, setMode] = useState<Mode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('role');
  const [registerRole, setRegisterRole] = useState<RegisterRole | null>(null);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (search.get('error') === 'account_trashed') {
      setMessage(t('accountTrashed'));
    }

    const modeParam = search.get('mode');
    const roleParam = search.get('role');
    if (modeParam !== 'register') {
      const saved = readRememberedIdentifier();
      if (saved) {
        setIdentifier(saved);
        setRememberAccount(true);
      }
      return;
    }

    setMode('register');
    setPhone('');
    setCode('');
    setEmail('');
    setIdentifier('');
    setPassword('');
    setPassword2('');
    setFullName('');
    setAcceptedTerms(false);

    if (
      roleParam === 'OWNER' ||
      roleParam === 'SALE' ||
      roleParam === 'GUEST'
    ) {
      setRegisterRole(roleParam);
      setRegisterStep('form');
    }
  }, [search, t]);

  function redirectByRole(role?: string) {
    const safeNext = safeNextPath(next);
    if (safeNext) {
      redirectAfterAuth(safeNext);
      return;
    }
    redirectAfterAuth(appHrefForRole(role, locale));
  }

  function switchMode(m: Mode) {
    setMode(m);
    setMessage('');
    setRegisterStep('role');
    setRegisterRole(null);
    setPhone('');
    setCode('');
    setEmail('');
    setPassword('');
    setPassword2('');
    setFullName('');
    setAcceptedTerms(false);

    if (m === 'login') {
      const saved = readRememberedIdentifier();
      if (saved) {
        setIdentifier(saved);
        setRememberAccount(true);
        return;
      }
    }
    setIdentifier('');
    setRememberAccount(false);
  }

  async function sendOtp() {
    if (mode === 'register' && !phone.trim()) {
      setMessage(t('validation.phoneRequired'));
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      setMessage(json.success ? json.data.message : json.error.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(intent: 'login' | 'register') {
    if (intent === 'register') {
      if (!fullName.trim()) {
        setMessage(t('validation.fullNameRequired'));
        return;
      }
      if (!phone.trim()) {
        setMessage(t('validation.phoneRequired'));
        return;
      }
      if (password !== password2) {
        setMessage(t('validation.passwordMismatch'));
        return;
      }
      if (password.length < 8) {
        setMessage(t('validation.passwordMinLength'));
        return;
      }
      if (!code.trim()) {
        setMessage(t('validation.otpRequired'));
        return;
      }
      if (!acceptedTerms) {
        setMessage(t('validation.termsRequired'));
        return;
      }
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code,
          fullName: fullName.trim() || (intent === 'register' ? '' : 'Guest'),
          intent,
          ...(intent === 'register' ? { password, acceptedTerms } : {}),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error.message);
        return;
      }
      redirectByRole(json.data.role);
    } finally {
      setLoading(false);
    }
  }

  async function passwordLogin() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error.message);
        return;
      }
      if (rememberAccount) persistRememberedIdentifier(identifier);
      else clearRememberedIdentifier();
      redirectByRole(json.data.role);
    } finally {
      setLoading(false);
    }
  }

  async function registerPaidRole() {
    if (!registerRole || registerRole === 'GUEST') return;
    if (password !== password2) {
      setMessage(t('validation.passwordMismatch'));
      return;
    }
    if (!code.trim()) {
      setMessage(t('validation.otpRequired'));
      return;
    }
    if (!acceptedTerms) {
      setMessage(t('validation.termsRequired'));
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          phone,
          fullName,
          role: registerRole,
          otpCode: code,
          acceptedTerms,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error.message);
        return;
      }
      setMessage(json.data.message || t('success.register'));
      redirectByRole(json.data.role);
    } finally {
      setLoading(false);
    }
  }

  const termsLabel = (
    <Text size="sm">
      {t('termsPrefix')}{' '}
      <Anchor component={Link} href="/terms" target="_blank" c="vbnbGreen.6">
        {t('termsLink')}
      </Anchor>
    </Text>
  );

  return (
    <SurfaceCard maw={440} mx="auto" mt={48} p="lg">
      <Stack gap="md">
        <div>
          <Title
            order={2}
            fw={600}
            className="vbnb-text-balance"
            style={{ letterSpacing: typography.title.letterSpacing }}
          >
            {tCommon('appName')}
          </Title>
          {mode === 'register' ? (
            <Text size="sm" c="dimmed" mt={6}>
              {t('subtitle')}
            </Text>
          ) : null}
        </div>

        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(v) => switchMode(v as Mode)}
          data={[
            { label: t('modeLogin'), value: 'login' },
            { label: t('modeRegister'), value: 'register' },
          ]}
          color="vbnbGreen"
        />

        {mode === 'login' ? (
          <Stack gap="sm">
            <TextInput
              label={t('identifierLabel')}
              description={t('identifierPhoneHint')}
              value={identifier}
              autoComplete="username"
              inputMode="text"
              onChange={(e) => setIdentifier(e.currentTarget.value)}
              placeholder={t('identifierPlaceholder')}
            />
            <PasswordInput
              label={t('passwordLabel')}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Checkbox
              checked={rememberAccount}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setRememberAccount(checked);
                if (!checked) clearRememberedIdentifier();
              }}
              label={t('rememberAccount')}
            />
            <Button
              color="vbnbGreen"
              loading={loading}
              onClick={passwordLogin}
            >
              {t('loginButton')}
            </Button>
          </Stack>
        ) : registerStep === 'role' ? (
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              {t('roleQuestion')}
            </Text>
            {REGISTER_ROLES.map((role) => {
              const selected = registerRole === role;
              return (
                <UnstyledButton
                  key={role}
                  onClick={() => setRegisterRole(role)}
                  style={{
                    textAlign: 'left',
                    borderRadius: radius.md,
                    border: `1.5px solid ${
                      selected ? colors.primary : colors.border
                    }`,
                    background: selected ? colors.primarySoft : colors.surface,
                    padding: '14px 16px',
                  }}
                >
                  <Text fw={600} size="sm" c={selected ? 'vbnbGreen.7' : undefined}>
                    {t(`roles.${role}.title`)}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {t(`roles.${role}.blurb`)}
                  </Text>
                </UnstyledButton>
              );
            })}
            <Text size="xs" c="dimmed">
              {t('roleFixedNote')}
            </Text>
            <Button
              color="vbnbGreen"
              disabled={!registerRole}
              onClick={() => setRegisterStep('form')}
            >
              {t('continue')}
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {t('registerTitle', {
                  role: registerRole
                    ? t(`roles.${registerRole}.title`)
                    : '',
                })}
              </Text>
              <UnstyledButton onClick={() => setRegisterStep('role')}>
                <Text size="sm" c="vbnbGreen.6">
                  {t('changeRole')}
                </Text>
              </UnstyledButton>
            </Group>

            {registerRole === 'GUEST' ? (
              <>
                <TextInput
                  label={t('fullNameLabel')}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.currentTarget.value)}
                  placeholder={t('fullNamePlaceholder')}
                />
                <TextInput
                  label={t('phoneLabel')}
                  required
                  value={phone}
                  inputMode="tel"
                  autoComplete="tel"
                  description={t('phoneFormatHint')}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder={t('phonePlaceholder')}
                />
                <PasswordInput
                  label={t('passwordLabel')}
                  required
                  description={t('passwordMinHint')}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  label={t('confirmPasswordLabel')}
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.currentTarget.value)}
                />
                <Button variant="light" loading={loading} onClick={sendOtp}>
                  {t('sendOtp')}
                </Button>
                <TextInput
                  label={t('otpLabel')}
                  required
                  value={code}
                  onChange={(e) => setCode(e.currentTarget.value)}
                  placeholder={t('otpPlaceholder')}
                />
                <Checkbox
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
                  label={termsLabel}
                />
                <Button
                  color="vbnbGreen"
                  loading={loading}
                  onClick={() => verifyOtp('register')}
                >
                  {t('completeRegister')}
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label={t('fullNameLabel')}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.currentTarget.value)}
                />
                <TextInput
                  label={t('emailLabel')}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <PasswordInput
                  label={t('passwordLabel')}
                  required
                  description={t('passwordMinHint')}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  label={t('confirmPasswordLabel')}
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.currentTarget.value)}
                />
                <TextInput
                  label={t('phoneLabel')}
                  required
                  description={`${t('phoneFormatHint')} ${t('phoneOtpDescription')}`}
                  value={phone}
                  inputMode="tel"
                  autoComplete="tel"
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder={t('phonePlaceholder')}
                />
                <Button variant="light" loading={loading} onClick={sendOtp}>
                  {t('sendOtp')}
                </Button>
                <TextInput
                  label={t('otpLabel')}
                  required
                  value={code}
                  onChange={(e) => setCode(e.currentTarget.value)}
                  placeholder={t('otpPlaceholder')}
                />
                <Text size="xs" c="dimmed">
                  {t('paidRoleNote')}
                </Text>
                <Checkbox
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
                  label={termsLabel}
                />
                <Button
                  color="vbnbGreen"
                  loading={loading}
                  onClick={registerPaidRole}
                >
                  {t('completeRegister')}
                </Button>
              </>
            )}
          </Stack>
        )}

        {message ? (
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}
