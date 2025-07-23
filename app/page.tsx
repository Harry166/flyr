'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [shareType, setShareType] = useState<'text' | 'file'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [expirationMode, setExpirationMode] = useState<'views' | 'time'>('views');
  const [maxViews, setMaxViews] = useState(1);
  const [expirationTime, setExpirationTime] = useState('24hours');
  const [customTime, setCustomTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [error, setError] = useState('');
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setShareType('file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 * 1024 // 5GB limit for all users
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setShareUrl('');

    try {
      if (shareType === 'text') {
        const response = await fetch('/api/shares/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: textContent,
            password,
            expirationMode,
            maxViews,
            expirationTime
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setShareUrl(data.shareUrl);
      } else if (shareType === 'file') {
        const formData = new FormData();
        formData.append('file', selectedFile!);
        formData.append('password', password);
        formData.append('expirationMode', expirationMode);
        formData.append('maxViews', maxViews.toString());
        formData.append('expirationTime', expirationTime);

        const response = await fetch('/api/shares/file', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setShareUrl(data.shareUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create share');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const reset = () => {
    setShareUrl('');
    setTextContent('');
    setSelectedFile(null);
    setPassword('');
    setMaxViews(1);
    setExpirationTime('24hours');
    setExpirationMode('views');
    setCustomTime('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fylr
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Share files and text that self-destruct
          </p>
        </div>

        {!shareUrl ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            {/* Share Type Tabs */}
            <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 py-3 font-medium transition-colors ${
                  shareType === 'text'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setShareType('text')}
              >
                Text
              </button>
              <button
                className={`flex-1 py-3 font-medium transition-colors ${
                  shareType === 'file'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setShareType('file')}
              >
                File
              </button>
            </div>

            {/* Content Input */}
            {shareType === 'text' ? (
              <textarea
                className="w-full h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Paste your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div>
                    <p className="text-green-600 font-medium mb-2">File selected:</p>
                    <p className="text-gray-700 dark:text-gray-300">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop a file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Max size: 5 GB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="mt-6 space-y-4">
              {/* Password Protection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password Protection (Optional)
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Expiration Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="views"
                      checked={expirationMode === 'views'}
                      onChange={(e) => setExpirationMode(e.target.value as 'views' | 'time')}
                      className="mr-2"
                    />
                    After views
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="time"
                      checked={expirationMode === 'time'}
                      onChange={(e) => setExpirationMode(e.target.value as 'views' | 'time')}
                      className="mr-2"
                    />
                    After time
                  </label>
                </div>

                {expirationMode === 'views' && (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter number of views (e.g., 5)"
                    min="1"
                    value={maxViews}
                    onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                  />
                )}

                {expirationMode === 'time' && (
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter hours (e.g., 48)"
                    min="1"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      setExpirationTime(e.target.value + 'hours');
                    }}
                  />
                )}
              </div>

            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || (shareType === 'text' ? !textContent : !selectedFile)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Creating...' : 'Create Secure Link'}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Your secure link is ready!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Share this link to grant access to your content
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {shareUrl}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={reset}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Secure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your content is encrypted and automatically deleted
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Ephemeral</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set custom expiration by views or time
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Lightning Fast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quick uploads and instant share link generation
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
