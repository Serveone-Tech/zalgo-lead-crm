'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    router.push(token ? '/dashboard' : '/login');
  }, []);
  return null;
}
