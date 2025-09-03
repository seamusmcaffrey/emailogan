'use client';

import Navigation from '@/components/Layout/Navigation';
import FileUploader from '@/components/Upload/FileUploader';
import { useEmailStore } from '@/store/useEmailStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const emails = useEmailStore((state) => state.emails);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Email Files</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <FileUploader />
            
            {emails.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Uploaded Emails ({emails.length})
                </h2>
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="border border-gray-200 rounded p-3 text-sm"
                    >
                      <div className="font-medium">{email.subject}</div>
                      <div className="text-gray-500">
                        From: {email.from} | To: {email.to}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}