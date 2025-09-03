'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [password, setPassword] = useState('blocklogan1988');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(password);
      router.push('/upload');
    } catch {
      setError('Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login on mount for testing
  useEffect(() => {
    if (!autoLoginAttempted) {
      setAutoLoginAttempted(true);
      console.log('🔐 Auto-logging in with default password for testing...');
      handleSubmit();
    }
  }, [autoLoginAttempted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email RAG Assistant
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLoading && !error ? 'Auto-logging in for testing...' : 'Enter your password to continue'}
          </p>
          {isLoading && !error && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Using default password: blocklogan1988
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="hidden"
                value="admin"
                readOnly
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}