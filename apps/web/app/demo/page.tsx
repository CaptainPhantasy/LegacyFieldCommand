'use client';

import React, { useState } from 'react';
import FieldDashboard from '@/components/dashboard/FieldDashboard';
import JobDetail from '@/components/job/JobDetail';
import PhotosGate from '@/components/job/PhotosGate';

type View = 'dashboard' | 'job_detail' | 'photos_gate';

export default function DemoPage() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const handleOpenGate = (jobId: string, gateId: string) => {
    console.log('Open gate', jobId, gateId);
    setCurrentView('job_detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleLogException = () => {
    alert('Log Exception clicked');
  };

  const handleCompleteGate = () => {
    alert('Complete Gate clicked');
    // In real flow, would go to next gate or update status
  };

  const handleGateAction = (action: string) => {
    if (action === 'add_reading') {
      alert('Add Reading functionality would open here (e.g., moisture meter input form).');
    }
  };

  const handleOpenPhotos = () => {
      setCurrentView('photos_gate');
  }

  // For demo purposes, simulate navigation from Job Detail to Photos Gate
  // In JobDetail, I'll add a way to trigger Photos Gate if the current gate is Photos.
  // But MOCK_JOB in JobDetail defaults to "Moisture/Equipment".
  // I'll just add a debug overlay to switch views.

  return (
    <div className="relative">
      {currentView === 'dashboard' && (
        <FieldDashboard 
          onOpenGate={handleOpenGate}
        />
      )}

      {currentView === 'job_detail' && (
        <JobDetail 
          onBack={handleBackToDashboard}
          onLogException={handleLogException}
          onCompleteGate={handleCompleteGate}
          onGateAction={handleGateAction}
        />
      )}

      {currentView === 'photos_gate' && (
        <PhotosGate 
          onBack={() => setCurrentView('job_detail')}
          onNextGate={() => setCurrentView('job_detail')}
          onUpload={() => alert('Upload clicked')}
        />
      )}

      {/* Debug Navigation Overlay */}
      <div className="fixed bottom-20 right-4 z-50 bg-black/80 text-white p-2 rounded-lg text-xs flex flex-col gap-2">
        <p className="font-bold border-b border-gray-600 pb-1 mb-1">Demo Nav</p>
        <button onClick={() => setCurrentView('dashboard')} className="text-left hover:text-accent">Dashboard</button>
        <button onClick={() => setCurrentView('job_detail')} className="text-left hover:text-accent">Job Detail</button>
        <button onClick={() => setCurrentView('photos_gate')} className="text-left hover:text-accent">Photos Gate</button>
      </div>
    </div>
  );
}

