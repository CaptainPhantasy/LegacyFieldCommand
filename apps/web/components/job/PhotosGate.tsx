import React from 'react';
import { Camera, Upload, ChevronLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Job, JobPhoto } from '@/types/gates';

// Mocks
const MOCK_JOB_TITLE = "Smith Residence – Water Loss";
const MOCK_PHOTOS: Array<{ id: string; url: string; label: string }> = [
  { id: '1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', label: 'Kitchen' },
  { id: '2', url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=400', label: 'Kitchen' },
  { id: '3', url: 'https://images.unsplash.com/photo-1595429035839-c99c298ffdde?auto=format&fit=crop&q=80&w=400', label: 'Basement' },
  { id: '4', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400', label: 'Basement' },
  { id: '5', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', label: 'Exterior' },
];

interface PhotosGateProps {
  onBack?: () => void;
  onUpload?: () => void;
  onNextGate?: () => void;
}

export default function PhotosGate({
  onBack,
  onUpload,
  onNextGate
}: PhotosGateProps) {
  const photoCount = MOCK_PHOTOS.length;

  return (
    <div className="min-h-screen bg-app text-main font-sans flex flex-col">
      {/* Header */}
      <header className="bg-app border-b border-border-subtle sticky top-0 z-10">
         <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted tracking-wider font-medium uppercase">
           <button onClick={onBack}>
             <ChevronLeft size={16} />
           </button>
           <span>Legacy Field Command</span>
         </div>
         <div className="px-4 pb-4 pt-1">
           <h1 className="text-2xl font-bold text-main">Photos Gate</h1>
           <p className="text-sm text-muted">{MOCK_JOB_TITLE}</p>
         </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-24 max-w-3xl mx-auto w-full">
        {/* Summary Line */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold text-main">{photoCount} photos added</h2>
            <p className="text-sm text-muted">Take and upload photos of the job site.</p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOCK_PHOTOS.map((photo) => (
            <div key={photo.id} className="aspect-[4/3] relative group rounded-card overflow-hidden bg-elevated border border-border-subtle">
              {/* In real app, use next/image */}
              <img 
                src={photo.url} 
                alt={photo.label}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Label Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs font-medium text-white px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm">
                  {photo.label}
                </span>
              </div>
            </div>
          ))}
          
          {/* Add Photo Placeholder (optional visual cue in grid) */}
          <button 
            onClick={onUpload}
            className="aspect-[4/3] rounded-card bg-subtle border-2 border-dashed border-border-strong flex flex-col items-center justify-center gap-2 text-muted hover:text-main hover:border-main transition-colors"
          >
            <Camera size={24} />
            <span className="text-xs font-medium">Add Photo</span>
          </button>
        </div>
      </main>

      {/* Action Buttons (Sticky Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-elevated border-t border-border-subtle p-4 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button 
            onClick={onUpload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-pill bg-subtle border border-border-subtle text-main font-medium hover:bg-bg-subtle transition-colors"
          >
            <Upload size={18} />
            <span>Upload photos</span>
          </button>
          
          <button 
            onClick={onNextGate}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-pill bg-accent text-white font-medium hover:bg-blue-600 shadow-lg shadow-accent/20 active:scale-[0.98] transition-all"
          >
            <span>Next gate</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

