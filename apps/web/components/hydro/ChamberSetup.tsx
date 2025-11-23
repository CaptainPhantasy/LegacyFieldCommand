/**
 * Chamber Setup Component
 * Create and manage drying chambers
 */

'use client';

import { useState } from 'react';
import { useChambers, useCreateChamber } from '@/hooks/useHydro';

interface ChamberSetupProps {
  jobId: string;
}

export function ChamberSetup({ jobId }: ChamberSetupProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChamberName, setNewChamberName] = useState('');
  const [newChamberType, setNewChamberType] = useState('standard');
  const [newChamberDescription, setNewChamberDescription] = useState('');

  const { data, isLoading } = useChambers(jobId);
  const createChamber = useCreateChamber();

  const chambers = data?.chambers || [];

  const handleCreateChamber = async () => {
    if (!newChamberName.trim()) return;

    try {
      await createChamber.mutateAsync({
        job_id: jobId,
        name: newChamberName,
        chamber_type: newChamberType,
        description: newChamberDescription || undefined,
        status: 'active',
      });
      setShowCreateModal(false);
      setNewChamberName('');
      setNewChamberDescription('');
      setNewChamberType('standard');
    } catch (error) {
      console.error('Failed to create chamber:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Loading chambers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Drying Chambers
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + New Chamber
        </button>
      </div>

      {chambers.length === 0 ? (
        <div className="p-6 text-center rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            No chambers created yet. Create your first chamber to start tracking drying progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chambers.map((chamber) => (
            <div
              key={chamber.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {chamber.name}
                  </h4>
                  {chamber.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {chamber.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: chamber.status === 'active' ? '#10b981' : '#6b7280',
                        color: 'white',
                      }}
                    >
                      {chamber.status}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {chamber.chamber_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Chamber Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-elevated rounded-xl p-6 w-full max-w-md"
            style={{ border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create New Chamber
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Chamber Name *
                </label>
                <input
                  type="text"
                  value={newChamberName}
                  onChange={(e) => setNewChamberName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="e.g., Main Floor Chamber"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Chamber Type
                </label>
                <select
                  value={newChamberType}
                  onChange={(e) => setNewChamberType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="containment">Containment</option>
                  <option value="negative_pressure">Negative Pressure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={newChamberDescription}
                  onChange={(e) => setNewChamberDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="Describe the chamber setup..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChamber}
                disabled={!newChamberName.trim() || createChamber.isPending}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {createChamber.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

