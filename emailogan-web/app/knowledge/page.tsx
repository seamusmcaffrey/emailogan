'use client';

import Navigation from '@/components/Layout/Navigation';
import { useEmailStore } from '@/store/useEmailStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Knowledge Base</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">{emails.length}</div>
                  <div className="text-sm text-gray-500">Total Emails</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {emails.filter(e => e.embedding).length}
                  </div>
                  <div className="text-sm text-gray-500">Processed</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {emails.filter(e => !e.embedding).length}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            </div>

            {emails.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Email Archive</h2>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emails.map((email) => (
                        <tr key={email.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {email.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.to}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                email.embedding
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {email.embedding ? 'Processed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No emails in the knowledge base yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload emails to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}