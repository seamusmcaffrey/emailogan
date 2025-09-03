'use client';

import Navigation from '@/components/Layout/Navigation';
import { useEmailStore } from '@/store/useEmailStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KnowledgePage() {
  const emails = useEmailStore((state) => state.emails);
  const fetchEmailsFromVectorDB = useEmailStore((state) => state.fetchEmailsFromVectorDB);
  const clearKnowledgeBase = useEmailStore((state) => state.clearKnowledgeBase);
  const isLoading = useEmailStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else {
      // Fetch existing emails from vector database on page load
      fetchEmailsFromVectorDB();
    }
  }, [isAuthenticated, router, fetchEmailsFromVectorDB]);

  if (!isAuthenticated) {
    return null;
  }
  
  const handleClearKnowledgeBase = async () => {
    setIsClearing(true);
    try {
      await clearKnowledgeBase();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to clear knowledge base:', error);
      alert('Failed to clear knowledge base. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
            {emails.length > 0 && (
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isClearing}
              >
                Clear Knowledge Base
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">{emails.length}</div>
                  <div className="text-sm text-gray-700">Total Emails</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {emails.filter(e => e.embedding).length}
                  </div>
                  <div className="text-sm text-gray-700">Processed</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {emails.filter(e => !e.embedding).length}
                  </div>
                  <div className="text-sm text-gray-700">Pending</div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-700">Loading emails from knowledge base...</span>
                </div>
              </div>
            ) : emails.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Email Archive</h2>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {email.from}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                <p className="text-gray-700">No emails in the knowledge base yet.</p>
                <p className="text-sm text-gray-600 mt-2">
                  Upload emails to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Clear Knowledge Base
            </h2>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to clear the entire knowledge base? This will permanently delete all {emails.length} stored emails and their embeddings. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                onClick={handleClearKnowledgeBase}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}