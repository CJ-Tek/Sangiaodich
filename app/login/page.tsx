import { Suspense } from 'react';
import { GuestShell } from '@/components/shells/GuestShell';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <GuestShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </GuestShell>
  );
}
