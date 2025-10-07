import { useState } from 'react';
import * as tus from 'tus-js-client';
import { API_CONFIG } from '../config/api.config';

export const useTusUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [upload, setUpload] = useState(null);

  const uploadVideo = (file) => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('No authentication token found');
        setError(error);
        setUploading(false);
        reject(error);
        return;
      }

      // Create tus upload
      const tusUpload = new tus.Upload(file, {
        // Endpoint URL
        endpoint: `${API_CONFIG.API_URL}/tus/files`,

        // Retry configuration
        retryDelays: [0, 3000, 5000, 10000, 20000],

        // Metadata
        metadata: {
          filename: file.name,
          filetype: file.type,
        },

        // Headers (including auth)
        headers: {
          Authorization: `Bearer ${token}`,
        },

        // Chunk size (5MB chunks)
        chunkSize: 5 * 1024 * 1024,

        // Events
        onError: (error) => {
          console.error('Upload failed:', error);
          setError(error);
          setUploading(false);
          reject(error);
        },

        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(percentage);
        },

        onSuccess: () => {
          console.log('Upload finished:', tusUpload.url);
          setUploading(false);
          setProgress(100);

          // Extract filename from upload URL
          const uploadUrl = tusUpload.url;
          const filename = uploadUrl.split('/').pop();
          const fileUrl = `/uploads/videos/${filename}`;

          resolve({
            fileUrl,
            filename,
            uploadUrl,
          });
        },
      });

      // Store upload instance for cancellation
      setUpload(tusUpload);

      // Start upload
      tusUpload.start();
    });
  };

  const cancelUpload = () => {
    if (upload) {
      upload.abort();
      setUploading(false);
      setProgress(0);
      setError(new Error('Upload cancelled'));
    }
  };

  const resumeUpload = () => {
    if (upload) {
      upload.start();
    }
  };

  return {
    uploadVideo,
    cancelUpload,
    resumeUpload,
    uploading,
    progress,
    error,
  };
};
