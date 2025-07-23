'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SharePage() {
  const params = useParams();
  const shareId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [shareData, setShareData] = useState<{
    type: string;
    content?: string;
    filename?: string;
    mimetype?: string;
    downloadUrl?: string;
    isLastView?: boolean;
    viewsRemaining?: number;
  } | null>(null);
  const [passwordError, setPasswordError] = useState('');

  const fetchShare = useCallback(async (pwd?: string) => {
    try {
      const headers: HeadersInit = {};
      if (pwd) {
        headers['x-share-password'] = pwd;
      }

      const response = await fetch(`/api/shares/${shareId}`, { headers });
      const data = await response.json();

      if (response.status === 401 && data.requiresPassword) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load share');
      }

      setShareData(data);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to load share');
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setLoading(true);
    
    try {
      await fetchShare(password);
    } catch {
      setPasswordError('Incorrect password');
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    const headers: HeadersInit = {};
    if (password) {
      headers['x-share-password'] = password;
    }

    const response = await fetch(`/api/shares/${shareId}/download`, { headers });
    
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'Failed to download file');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = shareData?.filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading share...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Share Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/" className="inline-block py-2 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Create New Share
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requiresPassword && !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Password Required</h2>
            <p className="text-gray-600 dark:text-gray-400">This share is password protected</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {passwordError && (
              <p className="text-red-600 text-sm mb-4">{passwordError}</p>
            )}
            
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Unlock Share
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
        {shareData?.isLastView && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 text-yellow-700 dark:text-yellow-400 rounded-lg">
            <p className="font-medium">⚠️ This is the last allowed view</p>
            <p className="text-sm mt-1">The content will be permanently deleted after you close this page.</p>
          </div>
        )}

        {shareData?.type === 'text' ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Shared Text</h2>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono text-sm">
                {shareData.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Shared File</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{shareData?.filename}</p>
            <button
              onClick={downloadFile}
              className="inline-block py-3 px-8 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download File
            </button>
          </div>
        )}

        {shareData?.viewsRemaining > 0 && !shareData?.isLastView && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Views remaining: {shareData.viewsRemaining}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Create your own secure share →
          </Link>
        </div>
      </div>
    </div>
  );
}
