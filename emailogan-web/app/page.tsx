'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import LoginForm from '@/components/Auth/LoginForm';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && isAuthenticated) {
      router.push('/instructions');
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted) {
    return null;
  }

  return <LoginForm />;
}