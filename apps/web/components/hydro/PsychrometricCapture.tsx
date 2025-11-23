/**
 * Psychrometric Reading Capture Component
 * Capture ambient temperature, relative humidity, and GPP readings
 */

'use client';

import { useState } from 'react';
import { useReadings, useCreateReading } from '@/hooks/useHydro';
import type { PsychrometricReading } from '@/types/hydro';

interface PsychrometricCaptureProps {
  chamberId: string;
}

export function PsychrometricCapture({ chamberId }: PsychrometricCaptureProps) {
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [readingTime, setReadingTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState<'exterior' | 'unaffected' | 'affected' | 'hvac'>('affected');
  const [ambientTemp, setAmbientTemp] = useState('');
  const [relativeHumidity, setRelativeHumidity] = useState('');
  const [grainsPerPound, setGrainsPerPound] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useReadings(chamberId);
  const createReading = useCreateReading();

  const readings = data?.readings || [];

  const handleSubmit = async () => {
    try {
      await createReading.mutateAsync({
        chamber_id: chamberId,
        reading_date: readingDate,
        reading_time: readingTime,
        location,
        ambient_temp_f: ambientTemp ? parseFloat(ambientTemp) : undefined,
        relative_humidity: relativeHumidity ? parseFloat(relativeHumidity) : undefined,
        grains_per_pound: grainsPerPound ? parseFloat(grainsPerPound) : undefined,
        notes: notes || undefined,
      });
      setShowCaptureForm(false);
      setAmbientTemp('');
      setRelativeHumidity('');
      setGrainsPerPound('');
      setNotes('');
    } catch (error) {
      console.error('Failed to create reading:', error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Psychrometric Readings
        </h3>
        <button
          onClick={() => setShowCaptureForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Reading
        </button>
      </div>

      {showCaptureForm && (
        <div className="p-4 rounded-lg border space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Date *
              </label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Time
              </label>
              <input
                type="time"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Location *
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as PsychrometricReading['location'])}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="exterior">Exterior</option>
              <option value="unaffected">Unaffected Area</option>
              <option value="affected">Affected Area</option>
              <option value="hvac">HVAC</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Temp (°F)
              </label>
              <input
                type="number"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                RH (%)
              </label>
              <input
                type="number"
                value={relativeHumidity}
                onChange={(e) => setRelativeHumidity(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                placeholder="45"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                GPP
              </label>
              <input
                type="number"
                value={grainsPerPound}
                onChange={(e) => setGrainsPerPound(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                placeholder="65"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCaptureForm(false)}
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
              onClick={handleSubmit}
              disabled={createReading.isPending}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {createReading.isPending ? 'Saving...' : 'Save Reading'}
            </button>
          </div>
        </div>
      )}

      {readings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Recent Readings
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {readings.slice(0, 5).map((reading) => (
              <div
                key={reading.id}
                className="p-3 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {reading.location}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {reading.reading_date} {reading.reading_time}
                  </span>
                </div>
                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {reading.ambient_temp_f && <span>Temp: {reading.ambient_temp_f}°F</span>}
                  {reading.relative_humidity && <span>RH: {reading.relative_humidity}%</span>}
                  {reading.grains_per_pound && <span>GPP: {reading.grains_per_pound}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

