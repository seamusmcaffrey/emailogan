'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEmailStore } from '@/store/useEmailStore';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const { uploadMultipleEmails, isLoading, uploadProgress } = useEmailStore();

  const extractEmlFromZip = async (zipFile: File): Promise<File[]> => {
    console.log('🎯 Starting ZIP extraction for:', zipFile.name);
    setExtractionStatus('Extracting files from ZIP...');
    
    try {
      // Dynamic import for browser-only code
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      console.log('📦 Loading ZIP file...');
      const zipContent = await zip.loadAsync(zipFile);
      
      const emlFiles: File[] = [];
      const fileNames = Object.keys(zipContent.files);
      console.log(`📋 Found ${fileNames.length} files in ZIP`);
      
      for (const fileName of fileNames) {
        if (fileName.toLowerCase().endsWith('.eml') && !fileName.startsWith('__MACOSX/')) {
          console.log(`✅ Processing: ${fileName}`);
          const file = zipContent.files[fileName];
          
          if (!file.dir) {
            const content = await file.async('blob');
            const extractedFile = new File([content], fileName.split('/').pop() || fileName, {
              type: 'message/rfc822'
            });
            emlFiles.push(extractedFile);
          }
        } else {
          console.log(`⏭️ Skipping: ${fileName}`);
        }
      }
      
      console.log(`✨ Extracted ${emlFiles.length} .eml files from ZIP`);
      setExtractionStatus(`Extracted ${emlFiles.length} .eml files`);
      return emlFiles;
    } catch (error) {
      console.error('❌ Error extracting ZIP:', error);
      setExtractionStatus('Error extracting ZIP file');
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('📥 Files dropped:', acceptedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    const allEmlFiles: File[] = [];
    
    for (const file of acceptedFiles) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        console.log('🗜️ Processing ZIP file:', file.name);
        try {
          const extractedFiles = await extractEmlFromZip(file);
          allEmlFiles.push(...extractedFiles);
        } catch (error) {
          console.error('Failed to extract ZIP:', error);
        }
      } else if (file.name.toLowerCase().endsWith('.eml')) {
        console.log('📧 Adding EML file:', file.name);
        allEmlFiles.push(file);
      } else {
        console.warn('⚠️ Unsupported file type:', file.name);
      }
    }
    
    if (allEmlFiles.length > 0) {
      console.log(`🚀 Uploading ${allEmlFiles.length} .eml files`);
      setExtractionStatus('');
      await uploadMultipleEmails(allEmlFiles);
    } else {
      console.warn('⚠️ No valid .eml files to upload');
      setExtractionStatus('No .eml files found');
    }
  }, [uploadMultipleEmails]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'message/rfc822': ['.eml'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
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
            : extractionStatus
            ? extractionStatus
            : 'Drop .eml or .zip files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports individual .eml files or ZIP archives containing .eml files
        </p>
      </div>

      {extractionStatus && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">{extractionStatus}</p>
        </div>
      )}

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