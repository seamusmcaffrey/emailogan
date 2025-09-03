'use client';

import { useState } from 'react';
import axios from 'axios';

interface SourceEmail {
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
}

interface GeneratedResponse {
  response: string;
  sourceEmails: SourceEmail[];
  style: string;
}

export default function ResponseForm() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GeneratedResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await axios.post('/api/generate/response', {
        prompt,
        style,
        useKnowledgeBase,
      });
      setResponse(result.data);
    } catch {
      setError('Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (response?.response) {
      navigator.clipboard.writeText(response.response);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Email Prompt
          </label>
          <textarea
            id="prompt"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Describe the email you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="style" className="block text-sm font-medium text-gray-700">
              Response Style
            </label>
            <select
              id="style"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="useKnowledgeBase"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={useKnowledgeBase}
              onChange={(e) => setUseKnowledgeBase(e.target.checked)}
            />
            <label htmlFor="useKnowledgeBase" className="ml-2 block text-sm text-gray-900">
              Use knowledge base
            </label>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {response && (
        <div className="mt-8 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Generated Response</h3>
              <button
                onClick={copyToClipboard}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Copy to clipboard
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-gray-800">{response.response}</pre>
            </div>
          </div>

          {response.sourceEmails.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Source Emails</h3>
              <div className="space-y-3">
                {response.sourceEmails.map((email, index) => (
                  <div key={index} className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm">
                      <p><strong>From:</strong> {email.from}</p>
                      <p><strong>To:</strong> {email.to}</p>
                      <p><strong>Subject:</strong> {email.subject}</p>
                      <p className="mt-2 text-gray-600">{email.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}