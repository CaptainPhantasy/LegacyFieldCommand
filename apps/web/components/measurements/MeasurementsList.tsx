/**
 * Measurements List Component
 */

'use client';

import { useState } from 'react';
import { useUploadMeasurement } from '@/hooks/useMeasurements';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function MeasurementsList() {
  const [jobId, setJobId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const uploadMeasurement = useUploadMeasurement();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !jobId.trim()) {
      setError('Please select a file and enter a job ID');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', jobId);
      formData.append('measurementType', '3d_scan');

      await uploadMeasurement.mutateAsync(formData);
      setFile(null);
      setJobId('');
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload measurement');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="glass-basic card-glass p-6 space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Upload Measurement
        </h2>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Job ID *
          </label>
          <Input
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter job ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Measurement File *
          </label>
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".obj,.ply,.stl,.3dm,.dwg"
            required
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Supported formats: OBJ, PLY, STL, 3DM, DWG
          </p>
        </div>

        <Button onClick={handleUpload} disabled={isUploading || !file || !jobId.trim()}>
          {isUploading ? 'Uploading...' : 'Upload Measurement'}
        </Button>
      </div>

      <div className="glass-basic card-glass p-6">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong>Note:</strong> View measurements from job detail pages. This page is for uploading new measurements.
        </p>
      </div>
    </div>
  );
}

