'use client';

import {
  Anchor,
  Button,
  Card,
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
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { colors, radius } from '@/config/design-tokens';

type Mode = 'login' | 'register';
type RegisterStep = 'role' | 'form';
type RegisterRole = 'GUEST' | 'SALE' | 'OWNER';

const ROLE_OPTIONS: {
  role: RegisterRole;
  title: string;
  blurb: string;
}[] = [
  {
    role: 'GUEST',
    title: 'Khách hàng',
    blurb: 'Tìm Villa, tìm nhân viên tư vấn tự do',
  },
  {
    role: 'SALE',
    title: 'Sale',
    blurb: 'Nhận lead, tạo booking, quản lý khách hàng',
  },
  {
    role: 'OWNER',
    title: 'Chủ nhà',
    blurb: 'Đăng tài sản, quản lý P&L',
  },
];

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (search.get('error') === 'account_trashed') {
      setMessage(
        'Tài khoản đã bị đưa vào trash. Liên hệ Admin để khôi phục.'
      );
    }

    const modeParam = search.get('mode');
    const roleParam = search.get('role');
    if (modeParam !== 'register') return;

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
  }, [search]);

  function redirectByRole(role?: string) {
    if (next) {
      router.push(next);
      return;
    }
    if (role === 'ADMIN') router.push('/admin');
    else if (role === 'OWNER') router.push('/owner');
    else if (role === 'SALE') router.push('/sale');
    else router.push('/marketplace');
  }

  function switchMode(m: Mode) {
    setMode(m);
    setMessage('');
    setRegisterStep('role');
    setRegisterRole(null);
    setPhone('');
    setCode('');
    setEmail('');
    setIdentifier('');
    setPassword('');
    setPassword2('');
    setFullName('');
    setAcceptedTerms(false);
  }

  async function sendOtp() {
    if (mode === 'register' && !phone.trim()) {
      setMessage('Số điện thoại bắt buộc');
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
        setMessage('Họ và tên bắt buộc');
        return;
      }
      if (!phone.trim()) {
        setMessage('Số điện thoại bắt buộc');
        return;
      }
      if (password !== password2) {
        setMessage('Mật khẩu xác nhận không khớp');
        return;
      }
      if (password.length < 8) {
        setMessage('Mật khẩu tối thiểu 8 ký tự');
        return;
      }
      if (!code.trim()) {
        setMessage('Vui lòng nhập mã OTP đã gửi tới SĐT');
        return;
      }
      if (!acceptedTerms) {
        setMessage('Vui lòng đồng ý điều khoản sử dụng');
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
      redirectByRole(json.data.role);
    } finally {
      setLoading(false);
    }
  }

  async function registerPaidRole() {
    if (!registerRole || registerRole === 'GUEST') return;
    if (password !== password2) {
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!code.trim()) {
      setMessage('Vui lòng nhập mã OTP đã gửi tới SĐT');
      return;
    }
    if (!acceptedTerms) {
      setMessage('Vui lòng đồng ý điều khoản sử dụng');
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
      setMessage(json.data.message || 'Đăng ký thành công');
      redirectByRole(json.data.role);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      maw={440}
      mx="auto"
      mt={48}
      shadow="none"
      padding="lg"
      radius={radius.lg}
      style={{ border: `1px solid ${colors.border}` }}
    >
      <Stack gap="md">
        <div>
          <Title order={2} fw={600} style={{ letterSpacing: '-0.02em' }}>
            VBNB
          </Title>
          {mode === 'register' ? (
            <Text size="sm" c="dimmed" mt={6}>
              Tạo tài khoản — chọn đúng role (không đổi sau này).
            </Text>
          ) : null}
        </div>

        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(v) => switchMode(v as Mode)}
          data={[
            { label: 'Đăng nhập', value: 'login' },
            { label: 'Đăng ký', value: 'register' },
          ]}
          color="vbnbGreen"
        />

        {mode === 'login' ? (
          <Stack gap="sm">
            <TextInput
              label="Email hoặc số điện thoại"
              value={identifier}
              onChange={(e) => setIdentifier(e.currentTarget.value)}
              placeholder="email@... hoặc +84..."
            />
            <PasswordInput
              label="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Button
              color="vbnbGreen"
              loading={loading}
              onClick={passwordLogin}
            >
              Đăng nhập
            </Button>
          </Stack>
        ) : registerStep === 'role' ? (
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Bạn tham gia với vai trò nào?
            </Text>
            {ROLE_OPTIONS.map((opt) => {
              const selected = registerRole === opt.role;
              return (
                <UnstyledButton
                  key={opt.role}
                  onClick={() => setRegisterRole(opt.role)}
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
                    {opt.title}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {opt.blurb}
                  </Text>
                </UnstyledButton>
              );
            })}
            <Text size="xs" c="dimmed">
              Role gắn cố định với tài khoản — không đổi sau khi đăng ký.
            </Text>
            <Button
              color="vbnbGreen"
              disabled={!registerRole}
              onClick={() => setRegisterStep('form')}
            >
              Tiếp tục
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Đăng ký ·{' '}
                {ROLE_OPTIONS.find((r) => r.role === registerRole)?.title}
              </Text>
              <UnstyledButton onClick={() => setRegisterStep('role')}>
                <Text size="sm" c="vbnbGreen.6">
                  Đổi role
                </Text>
              </UnstyledButton>
            </Group>

            {registerRole === 'GUEST' ? (
              <>
                <TextInput
                  label="Họ và tên"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.currentTarget.value)}
                  placeholder="Nguyễn Văn A"
                />
                <TextInput
                  label="Số điện thoại"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder="+84..."
                />
                <PasswordInput
                  label="Mật khẩu"
                  required
                  description="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  label="Xác nhận mật khẩu"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.currentTarget.value)}
                />
                <Button variant="light" loading={loading} onClick={sendOtp}>
                  Gửi OTP
                </Button>
                <TextInput
                  label="Mã OTP"
                  required
                  value={code}
                  onChange={(e) => setCode(e.currentTarget.value)}
                  placeholder="000000"
                />
                <Checkbox
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
                  label={
                    <Text size="sm">
                      Tôi đã đọc và đồng ý{' '}
                      <Anchor href="/terms" target="_blank" c="vbnbGreen.6">
                        Điều khoản sử dụng
                      </Anchor>
                    </Text>
                  }
                />
                <Button
                  color="vbnbGreen"
                  loading={loading}
                  onClick={() => verifyOtp('register')}
                >
                  Hoàn tất đăng ký
                </Button>
              </>
            ) : (
              <>
                <TextInput
                  label="Họ và tên"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.currentTarget.value)}
                />
                <TextInput
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <PasswordInput
                  label="Mật khẩu"
                  required
                  description="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  label="Xác nhận mật khẩu"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.currentTarget.value)}
                />
                <TextInput
                  label="Số điện thoại"
                  required
                  description="Bắt buộc xác minh OTP để chống SĐT ảo"
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder="+84..."
                />
                <Button variant="light" loading={loading} onClick={sendOtp}>
                  Gửi OTP
                </Button>
                <TextInput
                  label="Mã OTP"
                  required
                  value={code}
                  onChange={(e) => setCode(e.currentTarget.value)}
                  placeholder="000000"
                />
                <Text size="xs" c="dimmed">
                  Sau đăng ký bạn vào app ở trạng thái chờ kích hoạt. Thanh toán
                  gói subscription để mở chức năng.
                </Text>
                <Checkbox
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
                  label={
                    <Text size="sm">
                      Tôi đã đọc và đồng ý{' '}
                      <Anchor href="/terms" target="_blank" c="vbnbGreen.6">
                        Điều khoản sử dụng
                      </Anchor>
                    </Text>
                  }
                />
                <Button
                  color="vbnbGreen"
                  loading={loading}
                  onClick={registerPaidRole}
                >
                  Hoàn tất đăng ký
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
    </Card>
  );
}
