'use client';

import Navigation from '@/components/Layout/Navigation';
import ResponseForm from '@/components/Generate/ResponseForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Generate Email Response</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <ResponseForm />
          </div>
        </div>
      </div>
    </div>
  );
}