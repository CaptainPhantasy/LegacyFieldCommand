'use client';

import { useState, useRef } from 'react';
import styles from './PhotoCapture.module.css';

interface PhotoCaptureProps {
  onPhotoTaken: (file: File) => void;
  label?: string;
  required?: boolean;
}

export default function PhotoCapture({
  onPhotoTaken,
  label = 'Take Photo',
  required = false,
}: PhotoCaptureProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      setPhotoFile(file);
      onPhotoTaken(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      alert('Camera permission is required to take photos.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
            setPhotoFile(file);
            onPhotoTaken(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleRetake = () => {
    setPhotoUrl(null);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      {photoUrl ? (
        <div className={styles.previewContainer}>
          <img src={photoUrl} alt="Preview" className={styles.previewImage} />
          <div className={styles.previewActions}>
            <button className={styles.actionButton} onClick={handleRetake}>
              Retake
            </button>
            <button
              className={styles.actionButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Different
            </button>
          </div>
        </div>
      ) : showCamera ? (
        <div className={styles.cameraContainer}>
          <video ref={videoRef} autoPlay playsInline className={styles.video} />
          <div className={styles.cameraActions}>
            <button
              className={styles.captureButton}
              onClick={capturePhoto}
            >
              📷 Capture
            </button>
            <button className={styles.cancelButton} onClick={stopCamera}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.captureContainer}>
          <button
            className={styles.captureButton}
            onClick={startCamera}
          >
            📷 {label}
          </button>
          <button
            className={styles.libraryButton}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose from Library
          </button>
          {required && (
            <p className={styles.requiredText}>* This photo is required</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
