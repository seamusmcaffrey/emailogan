'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEmailStore } from '@/store/useEmailStore';

export default function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const [processingStage, setProcessingStage] = useState<'idle' | 'extracting' | 'uploading' | 'processing' | 'storing' | 'complete'>('idle');
  const [totalFiles, setTotalFiles] = useState(0);
  const { uploadMultipleEmails, isLoading, isProcessing, isStoringVectors, uploadProgress } = useEmailStore();

  useEffect(() => {
    if (isLoading && uploadProgress > 0 && uploadProgress < 100) {
      setProcessingStage('uploading');
    } else if (isProcessing) {
      setProcessingStage('processing');
    } else if (isStoringVectors) {
      setProcessingStage('storing');
    } else if (!isLoading && !isProcessing && !isStoringVectors && 
               (processingStage === 'storing' || processingStage === 'processing')) {
      // All processing complete
      setProcessingStage('complete');
      setTimeout(() => {
        setProcessingStage('idle');
        setTotalFiles(0);
      }, 5000);
    }
  }, [isLoading, isProcessing, isStoringVectors, uploadProgress, processingStage]);

  const extractEmlFromZip = async (zipFile: File): Promise<File[]> => {
    console.log('🎯 Starting ZIP extraction for:', zipFile.name);
    setExtractionStatus('Extracting files from ZIP...');
    setProcessingStage('extracting');
    
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
      setTotalFiles(emlFiles.length);
      return emlFiles;
    } catch (error) {
      console.error('❌ Error extracting ZIP:', error);
      setExtractionStatus('Error extracting ZIP file');
      setProcessingStage('idle');
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
      setTotalFiles(allEmlFiles.length);
      await uploadMultipleEmails(allEmlFiles);
    } else {
      console.warn('⚠️ No valid .eml files to upload');
      setExtractionStatus('No .eml files found');
      setProcessingStage('idle');
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

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'extracting':
        return 'Extracting files from ZIP...';
      case 'uploading':
        return `Uploading emails... ${Math.round(uploadProgress)}%`;
      case 'processing':
        return 'Creating vector embeddings...';
      case 'storing':
        return 'Storing in vector database...';
      case 'complete':
        return '✓ Processing complete! You can now chat with your emails.';
      default:
        return extractionStatus || 'Drop .eml or .zip files here, or click to select';
    }
  };

  const getProcessingColor = () => {
    switch (processingStage) {
      case 'complete':
        return 'bg-green-50 border-green-200';
      case 'idle':
        return '';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="w-full">
      {/* Processing Status Banner */}
      {processingStage !== 'idle' && (
        <div className={`mb-4 p-4 rounded-lg border ${getProcessingColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {processingStage === 'complete' ? (
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <div>
                <p className={`font-medium ${processingStage === 'complete' ? 'text-green-800' : 'text-blue-800'}`}>
                  {getProcessingMessage()}
                </p>
                {totalFiles > 0 && processingStage !== 'complete' && (
                  <p className="text-sm text-gray-700">
                    Processing {totalFiles} email{totalFiles !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          {(processingStage === 'uploading' || processingStage === 'processing') && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {processingStage === 'extracting' && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}
          
          {processingStage === 'storing' && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${processingStage !== 'idle' && processingStage !== 'complete' ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} disabled={processingStage !== 'idle' && processingStage !== 'complete'} />
        <svg
          className="mx-auto h-12 w-12 text-gray-600"
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
        <p className="mt-2 text-sm text-gray-700">
          Drop .eml or .zip files here, or click to select
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Supports individual .eml files or ZIP archives containing .eml files
        </p>
      </div>
    </div>
  );
}