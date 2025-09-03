'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEmailStore } from '@/store/useEmailStore';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadMultipleEmails, isLoading, uploadProgress } = useEmailStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const emlFiles = acceptedFiles.filter(file => file.name.endsWith('.eml'));
    if (emlFiles.length > 0) {
      await uploadMultipleEmails(emlFiles);
    }
  }, [uploadMultipleEmails]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'message/rfc822': ['.eml'],
    },
    multiple: true,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {isLoading
            ? `Uploading... ${Math.round(uploadProgress)}%`
            : 'Drop .eml files here, or click to select'}
        </p>
      </div>

      {isLoading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}